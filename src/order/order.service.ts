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
} from 'src/transaction/schema/transaction.schema';
import { Order_Status } from './enums/order-status.enum';

@Injectable()
export class OrderService {
  constructor(
    @InjectModel(Order.name)
    private readonly orderModel: Model<OrderDocument>,
    @InjectModel(Product.name)
    private readonly productModel: Model<ProductDocument>,
    @InjectModel(Payment.name)
    private paymentModel: Model<PaymentDocument>,
  ) {}

  async createOrder(createOrderDto: CreateOrderDto): Promise<Order> {
    const { userId, items, paymentMethod, shippingFee, discount } =
      createOrderDto;

    if (!items.length) {
      throw new BadRequestException('Order must contain at least one item');
    }

    const orderDetails = [];
    let totalQuantity = 0;
    let totalPrice = 0;

    for (const item of items) {
      const product = await this.productModel.findById(item.productId).lean();
      if (!product) {
        throw new NotFoundException(
          `Product with ID ${item.productId} not found`,
        );
      }

      const subTotal = product.price * item.quantity;
      totalQuantity += item.quantity;
      totalPrice += subTotal;

      orderDetails.push({
        productId: product._id,
        quantity: item.quantity,
        price: product.price,
        subTotal,
      });
    }

    const finalTotalPrice = totalPrice + shippingFee - discount;

    const payment = new this.paymentModel({
      order: null,
      method: paymentMethod,
      amount: finalTotalPrice,
    });

    const createdPayment = payment;

    const order = new this.orderModel({
      user: userId,
      items: orderDetails,
      totalQuantity,
      totalPrice: finalTotalPrice,
      discount,
      shippingFee,
      paymentMethod,
      payment: createdPayment._id,
    });

    const createdOrder = await order.save();

    createdPayment.order = createdOrder.id;
    await createdPayment.save();

    return createdOrder;
  }

  async getOrders(userId: string): Promise<Order[]> {
    const orders = await this.orderModel.find({ user: userId });
    if (!orders) {
      throw new NotFoundException('Orders not found');
    }
    return orders;
  }

  async getOrderById(orderId: string): Promise<Order> {
    const order = await this.orderModel.findById(orderId);
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

    order.orderStatus = status;
    return order.save();
  }

  async getOrderByStatus(status: Order_Status): Promise<Order[]> {
    if (!Object.values(Order_Status).includes(status)) {
      throw new BadRequestException(`Invalid order status: ${status}`);
    }
    const orders = await this.orderModel.find({ orderStatus: status });
    if (!orders) {
      throw new NotFoundException('Orders not found');
    }
    return orders;
  }

  async deleteOrder(orderId: string): Promise<String> {
    const order = await this.orderModel.findByIdAndDelete(orderId);
    if (!order) {
      throw new NotFoundException('Order not found');
    }
    return 'Delete Successfully';
  }
}
