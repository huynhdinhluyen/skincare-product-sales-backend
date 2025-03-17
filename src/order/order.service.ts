import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Order, OrderDocument } from './schema/order.schema';
import { Model } from 'mongoose';
import { Product, ProductDocument } from 'src/product/schema/product.schema';
import { CreateOrderDto } from './dto/create-order.dto';
import {
  Payment,
  PaymentDocument,
} from 'src/transaction/schema/payment.schema';
import { Order_Status } from './enums/order-status.enum';
import { CartService } from 'src/cart/cart.service';
import { Payment_Method } from 'src/transaction/enums/payment-method.enum';
import { Payment_Status } from 'src/transaction/enums/transaction-status.enum';

@Injectable()
export class OrderService {
  private readonly logger = new Logger(OrderService.name);
  constructor(
    @InjectModel(Order.name) private readonly orderModel: Model<OrderDocument>,
    @InjectModel(Product.name)
    private readonly productModel: Model<ProductDocument>,
    @InjectModel(Payment.name) private paymentModel: Model<PaymentDocument>,
    private readonly cartService: CartService,
  ) {}

  async createOrder(createOrderDto: CreateOrderDto): Promise<Order> {
    const { userId, items, shippingFee, discount, shippingAddress } =
      createOrderDto;

    if (!items || items.length === 0) {
      throw new BadRequestException('Order must contain at least one item');
    }

    const orderDetails = [];
    let totalQuantity = 0;
    let totalPrice = 0;

    for (const item of items) {
      const product = await this.productModel
        .findById(item.productId)
        .populate('promotionId', 'discountRate startDate endDate isActive');

      if (!product) {
        throw new NotFoundException(
          `Product with ID ${item.productId} not found`,
        );
      }

      if (product.stockQuantity < item.quantity) {
        throw new BadRequestException(
          `Not enough stock for product ${product.name}. Available: ${product.stockQuantity}`,
        );
      }

      // Calculate price with any active promotions
      let itemPrice = product.price;
      if (product.promotionId && product.promotionId['isActive']) {
        const now = new Date();
        const startDate = new Date(product.promotionId['startDate']);
        const endDate = new Date(product.promotionId['endDate']);

        if (now >= startDate && now <= endDate) {
          itemPrice =
            product.price -
            (product.price * product.promotionId['discountRate']) / 100;
        }
      }

      const subTotal = itemPrice * item.quantity;
      totalQuantity += item.quantity;
      totalPrice += subTotal;

      orderDetails.push({
        productId: product._id,
        quantity: item.quantity,
        price: itemPrice,
        subTotal,
      });
    }

    const finalTotalPrice = totalPrice + shippingFee - discount;

    try {
      const order = new this.orderModel({
        user: userId,
        items: orderDetails,
        totalQuantity,
        totalPrice: finalTotalPrice,
        discount,
        shippingFee,
        shippingAddress,
        orderStatus: Order_Status.PENDING,
      });

      const createdOrder = await order.save();

      const payment = new this.paymentModel({
        order: createdOrder._id,
        paymentMethod: Payment_Method.COD,
        amount: finalTotalPrice,
        paymentStatus: Payment_Status.UNPAID,
        transactionId: `TXN-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      });

      const createdPayment = await payment.save();

      await this.orderModel.findByIdAndUpdate(createdOrder._id, {
        payment: createdPayment._id,
      });

      for (const item of items) {
        await this.productModel.findByIdAndUpdate(item.productId, {
          $inc: { stockQuantity: -item.quantity, sold: item.quantity },
        });
      }

      try {
        const cart = await this.cartService.getCart(userId);
        if (cart && cart.items && cart.items.length > 0) {
          for (const item of items) {
            await this.cartService.removeFromCart(userId, item.productId);
          }
        }
      } catch (cartError) {
        this.logger.warn(`Failed to clear user cart: ${cartError.message}`);
      }

      return this.orderModel
        .findById(createdOrder._id)
        .populate('payment')
        .populate({
          path: 'items.productId',
          select: 'name images price',
        });
    } catch (error) {
      this.logger.error(`Order creation failed: ${error.message}`, error.stack);
      throw new BadRequestException(`Order creation failed: ${error.message}`);
    }
  }

  async getOrders(userId: string): Promise<Order[]> {
    try {
      const orders = await this.orderModel
        .find({ user: userId })
        .populate({
          path: 'items.productId',
          select: 'name images',
        })
        .populate('payment', 'paymentMethod paymentStatus amount paymentDate')
        .sort({ createdAt: -1 });
      return orders || [];
    } catch (error) {
      this.logger.error(`Failed to get orders: ${error.message}`, error.stack);
      throw new BadRequestException('Failed to retrieve orders');
    }
  }

  async getOrdersByUserAndStatus(
    userId: string,
    status: Order_Status,
  ): Promise<Order[]> {
    try {
      if (!Object.values(Order_Status).includes(status)) {
        throw new BadRequestException(`Invalid order status: ${status}`);
      }

      return this.orderModel
        .find({ user: userId, orderStatus: status })
        .sort({ createdAt: -1 })
        .populate('payment')
        .populate({
          path: 'items.productId',
          select: 'name images price',
        })
        .exec();
    } catch (error) {
      this.logger.error(`Failed to get orders: ${error.message}`, error.stack);
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException('Failed to retrieve orders');
    }
  }

  async getOrderById(orderId: string): Promise<Order> {
    try {
      const order = await this.orderModel
        .findById(orderId)
        .populate({
          path: 'items.productId',
          select: 'name images price',
        })
        .populate(
          'payment',
          'paymentMethod paymentStatus amount paymentDate transactionId',
        )
        .populate('user', 'fullName email phone');

      if (!order) {
        throw new NotFoundException('Order not found');
      }

      return order;
    } catch (error) {
      this.logger.error(`Failed to get order: ${error.message}`, error.stack);
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException('Failed to retrieve order');
    }
  }

  async updateOrderStatus(
    orderId: string,
    status: Order_Status,
  ): Promise<Order> {
    try {
      if (!Object.values(Order_Status).includes(status)) {
        throw new BadRequestException(`Invalid order status: ${status}`);
      }

      const order = await this.orderModel.findById(orderId);
      if (!order) {
        throw new NotFoundException('Order not found');
      }

      this.validateStatusTransition(order.orderStatus, status);

      if (status === Order_Status.DELIVERED) {
        const payment = await this.paymentModel.findById(order.payment);
        if (
          payment &&
          payment.paymentMethod === Payment_Method.COD &&
          payment.paymentStatus !== Payment_Status.PAID
        ) {
          payment.paymentStatus = Payment_Status.PAID;
          payment.paymentDate = new Date();
          await payment.save();
        }
      } else if (status === Order_Status.CANCELLED) {
        if (
          ![Order_Status.DELIVERED, Order_Status.RETURNED].includes(
            order.orderStatus,
          )
        ) {
          for (const item of order.items) {
            const product = await this.productModel.findById(item.productId);
            if (product) {
              product.stockQuantity += item.quantity;
              product.sold -= item.quantity;
              await product.save();
            }
          }
        }
      }

      order.orderStatus = status;
      return order.save();
    } catch (error) {
      this.logger.error(
        `Failed to update order status: ${error.message}`,
        error.stack,
      );
      if (
        error instanceof BadRequestException ||
        error instanceof NotFoundException
      ) {
        throw error;
      }
      throw new BadRequestException('Failed to update order status');
    }
  }

  async getOrderByStatus(status: Order_Status): Promise<Order[]> {
    try {
      if (!Object.values(Order_Status).includes(status)) {
        throw new BadRequestException(`Invalid order status: ${status}`);
      }

      return this.orderModel
        .find({ orderStatus: status })
        .populate({
          path: 'items.productId',
          select: 'name images',
        })
        .populate('payment', 'paymentMethod paymentStatus amount')
        .populate('user', 'fullName email phone')
        .sort({ createdAt: -1 });
    } catch (error) {
      this.logger.error(
        `Failed to get orders by status: ${error.message}`,
        error.stack,
      );
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException('Failed to retrieve orders');
    }
  }

  async deleteOrder(orderId: string): Promise<string> {
    try {
      const order = await this.orderModel.findById(orderId);
      if (!order) {
        throw new NotFoundException('Order not found');
      }

      if (
        ![Order_Status.PENDING, Order_Status.CANCELLED].includes(
          order.orderStatus,
        )
      ) {
        throw new BadRequestException(
          'Cannot delete an order that is already being processed',
        );
      }

      if (order.orderStatus === Order_Status.PENDING) {
        for (const item of order.items) {
          const product = await this.productModel.findById(item.productId);
          if (product) {
            product.stockQuantity += item.quantity;
            product.sold -= item.quantity;
            await product.save();
          }
        }
      }

      if (order.payment) {
        await this.paymentModel.findByIdAndDelete(order.payment);
      }

      await this.orderModel.findByIdAndDelete(orderId);
      return 'Order deleted successfully';
    } catch (error) {
      this.logger.error(
        `Failed to delete order: ${error.message}`,
        error.stack,
      );
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      throw new BadRequestException('Failed to delete order');
    }
  }

  private validateStatusTransition(
    currentStatus: Order_Status,
    newStatus: Order_Status,
  ): void {
    const allowedTransitions = {
      [Order_Status.PENDING]: [Order_Status.CONFIRMED, Order_Status.CANCELLED],
      [Order_Status.CONFIRMED]: [Order_Status.SHIPPING, Order_Status.CANCELLED],
      [Order_Status.SHIPPING]: [Order_Status.DELIVERED, Order_Status.RETURNED],
      [Order_Status.DELIVERED]: [Order_Status.RETURNED],
      [Order_Status.RETURNED]: [Order_Status.REFUNDED],
      [Order_Status.CANCELLED]: [],
      [Order_Status.REFUNDED]: [],
      [Order_Status.FAILED]: [],
    };

    if (
      !allowedTransitions[currentStatus]?.includes(newStatus) &&
      currentStatus !== newStatus
    ) {
      throw new BadRequestException(
        `Cannot change order status from ${currentStatus} to ${newStatus}`,
      );
    }
  }
}
