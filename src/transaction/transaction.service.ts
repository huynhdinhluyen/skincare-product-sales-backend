import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Payment, PaymentDocument } from './schema/transaction.schema';
import { Payment_Status } from './enums/transaction-status.enum';
import { Model } from 'mongoose';
import { Order, OrderDocument } from 'src/order/schema/order.schema';

@Injectable()
export class TransactionService {
  constructor(
    @InjectModel(Payment.name)
    private readonly transactionModel: Model<PaymentDocument>,
    @InjectModel(Order.name)
    private readonly orderModel: Model<OrderDocument>,
  ) {}

  async updateTransactionStatus(
    orderId: string,
    status: Payment_Status,
  ): Promise<Payment> {
    const order = await this.orderModel.findById(orderId);
    if (!order) {
      throw new NotFoundException('Order not found');
    }

    if (!Object.values(Payment_Status).includes(status)) {
      throw new BadRequestException('Invalid status');
    }

    const payment = await this.transactionModel.findById(order.payment);

    if (!payment) {
      throw new Error('Transaction not found');
    }

    payment.paymentStatus = status;

    if (status === Payment_Status.PAID) {
      payment.paymentDate = new Date();
    }

    await payment.save();

    return payment;
  }
}
