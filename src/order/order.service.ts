import {
  BadRequestException,
  Injectable,
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
  constructor(
    @InjectModel(Order.name) private readonly orderModel: Model<OrderDocument>,
    @InjectModel(Product.name)
    private readonly productModel: Model<ProductDocument>,
    @InjectModel(Payment.name) private paymentModel: Model<PaymentDocument>,
    private readonly cartService: CartService,
  ) {}

  async createOrder(createOrderDto: CreateOrderDto): Promise<Order> {
    const {
      userId,
      items,
      paymentMethod,
      shippingFee,
      discount,
      shippingAddress,
    } = createOrderDto;

    if (!items || items.length === 0) {
      throw new BadRequestException('Order must contain at least one item');
    }

    // Prepare order details and validate products
    const orderDetails = [];
    let totalQuantity = 0;
    let totalPrice = 0;

    // First, verify all products and calculate totals
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
      // First create the order WITHOUT a payment reference
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

      // Now create the payment WITH the order reference
      const payment = new this.paymentModel({
        order: createdOrder._id,
        paymentMethod: paymentMethod || Payment_Method.COD,
        amount: finalTotalPrice,
        paymentStatus: Payment_Status.UNPAID,
        transactionId: `TXN-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      });

      const createdPayment = await payment.save();

      // Update the order with the payment reference - USE MONGOOSE METHOD INSTEAD OF DIRECT ASSIGNMENT
      await this.orderModel.findByIdAndUpdate(createdOrder._id, {
        payment: createdPayment._id,
      });

      // Now update the product stock
      for (const item of items) {
        await this.productModel.findByIdAndUpdate(item.productId, {
          $inc: { stockQuantity: -item.quantity, sold: item.quantity },
        });
      }

      // Return the order with payment included
      return this.orderModel
        .findById(createdOrder._id)
        .populate('payment')
        .populate({
          path: 'items.productId',
          select: 'name images price',
        });
    } catch (error) {
      // If anything fails, throw the error with a clear message
      throw new BadRequestException(`Order creation failed: ${error.message}`);
    }
  }

  async getOrders(userId: string): Promise<Order[]> {
    const orders = await this.orderModel
      .find({ user: userId })
      .populate({
        path: 'items.productId',
        select: 'name images',
      })
      .populate('payment', 'paymentMethod paymentStatus amount paymentDate')
      .sort({ createdAt: -1 });

    if (!orders || orders.length === 0) {
      return [];
    }

    return orders;
  }

  async getOrderById(orderId: string): Promise<Order> {
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
      .populate('user', 'name email');

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    return order;
  }

  async updateOrderStatus(
    orderId: string,
    status: Order_Status,
  ): Promise<Order> {
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
      for (const item of order.items) {
        const product = await this.productModel.findById(item.productId);
        if (product) {
          product.stockQuantity += item.quantity;
          product.sold -= item.quantity;
          await product.save();
        }
      }
    }

    order.orderStatus = status;
    return order.save();
  }

  async getOrderByStatus(status: Order_Status): Promise<Order[]> {
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
      .populate('user', 'name email')
      .sort({ createdAt: -1 });
  }

  async deleteOrder(orderId: string): Promise<string> {
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

    for (const item of order.items) {
      const product = await this.productModel.findById(item.productId);
      if (product) {
        product.stockQuantity += item.quantity;
        product.sold -= item.quantity;
        await product.save();
      }
    }

    if (order.payment) {
      await this.paymentModel.findByIdAndDelete(order.payment);
    }

    await this.orderModel.findByIdAndDelete(orderId);
    return 'Order deleted successfully';
  }

  private validateStatusTransition(
    currentStatus: Order_Status,
    newStatus: Order_Status,
  ): void {
    const allowedTransitions = {
      [Order_Status.PENDING]: [
        Order_Status.CONFIRMED,
        Order_Status.PROCESSING,
        Order_Status.CANCELLED,
      ],
      [Order_Status.CONFIRMED]: [
        Order_Status.PROCESSING,
        Order_Status.CANCELLED,
      ],
      [Order_Status.PROCESSING]: [
        Order_Status.SHIPPING,
        Order_Status.CANCELLED,
      ],
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
