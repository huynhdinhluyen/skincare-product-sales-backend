import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Payment, PaymentDocument } from './schema/payment.schema';
import { Payment_Status } from './enums/transaction-status.enum';
import { Model } from 'mongoose';
import { Order, OrderDocument } from 'src/order/schema/order.schema';
import { Order_Status } from 'src/order/enums/order-status.enum';
import { VnPayService } from '../vnpay/vnpay.service';
import { CreatePaymentDto } from './dto/CreatePaymentDto';
import {
  CreateVnPayPaymentDto,
  VnPayReturnDto,
} from '../vnpay/dto/create-vnpay-payment.dto';
import { Payment_Method } from './enums/payment-method.enum';

@Injectable()
export class TransactionService {
  private txnRefToOrderIdMap = new Map<string, string>();
  constructor(
    @InjectModel(Payment.name)
    private readonly transactionModel: Model<PaymentDocument>,
    @InjectModel(Order.name) private readonly orderModel: Model<OrderDocument>,
    private readonly vnpayService: VnPayService,
  ) {}

  async getPaymentByOrderId(orderId: string): Promise<Payment> {
    const payment = await this.transactionModel.findOne({ order: orderId });
    if (!payment) {
      throw new NotFoundException(`Payment for order ${orderId} not found`);
    }
    return payment;
  }

  async updateTransactionStatus(
    paymentId: string,
    status: Payment_Status,
  ): Promise<Payment> {
    if (!Object.values(Payment_Status).includes(status)) {
      throw new BadRequestException(`Invalid payment status: ${status}`);
    }

    const payment = await this.transactionModel.findById(paymentId);
    if (!payment) {
      throw new NotFoundException('Payment not found');
    }

    payment.paymentStatus = status;

    if (status === Payment_Status.PAID) {
      payment.paymentDate = new Date();

      const order = await this.orderModel.findById(payment.order);
      if (order && order.orderStatus === Order_Status.PENDING) {
        order.orderStatus = Order_Status.CONFIRMED;
        await order.save();
      }
    }

    if (status === Payment_Status.FAILED) {
      const order = await this.orderModel.findById(payment.order);
      if (order && order.orderStatus === Order_Status.PENDING) {
        order.orderStatus = Order_Status.FAILED;
        await order.save();
      }
    }

    return payment.save();
  }

  async processOnlinePayment(paymentDto: CreatePaymentDto): Promise<Payment> {
    const { orderId, transactionId } = paymentDto;

    const order = await this.orderModel.findById(orderId);
    if (!order) {
      throw new NotFoundException(`Order with ID ${orderId} not found`);
    }

    const payment = await this.transactionModel.findOne({ order: orderId });
    if (!payment) {
      throw new NotFoundException(`Payment for order ${orderId} not found`);
    }

    payment.transactionId = transactionId;
    payment.paymentStatus = Payment_Status.PAID;
    payment.paymentDate = new Date();

    order.orderStatus = Order_Status.CONFIRMED;
    await order.save();

    return payment.save();
  }

  async createVnPayPaymentUrl(
    paymentDto: CreateVnPayPaymentDto,
  ): Promise<string> {
    const { orderId, amount, ipAddr } = paymentDto;

    const order = await this.orderModel.findById(orderId);
    if (!order) {
      throw new NotFoundException(`Order with ID ${orderId} not found`);
    }

    const existingPayment = await this.transactionModel.findOne({
      order: orderId,
    });
    if (!existingPayment) {
      throw new NotFoundException(`Payment for order ${orderId} not found`);
    }

    // Update payment method
    existingPayment.paymentMethod = Payment_Method.VNPAY;
    await existingPayment.save();

    // Clean IP address if it's IPv6 localhost
    let clientIpAddr = ipAddr;
    if (clientIpAddr === '::1') {
      clientIpAddr = '127.0.0.1';
    }

    // Generate a short transaction reference
    const shortId = Math.floor(Math.random() * 1000).toString();

    // Store mapping between short ID and real order ID
    this.txnRefToOrderIdMap.set(shortId, orderId);

    // Let VnPayService handle the URL creation with short ID
    const paymentUrl = this.vnpayService.createPaymentUrl(
      shortId, // Send short ID instead of MongoDB ID
      amount,
      clientIpAddr,
    );

    return paymentUrl;
  }

  async processVnPayReturn(
    vnpayReturn: VnPayReturnDto,
  ): Promise<{ success: boolean; message: string }> {
    // Log params for debugging
    console.log('VNPay return parameters:', vnpayReturn);

    const isValidSignature = this.vnpayService.verifyReturnUrl(vnpayReturn);
    console.log('Is signature valid:', isValidSignature);

    if (!isValidSignature) {
      throw new BadRequestException('Invalid signature from VNPay');
    }

    if (vnpayReturn.vnp_ResponseCode !== '00') {
      return {
        success: false,
        message: 'Payment failed or cancelled by user',
      };
    }

    try {
      // Since we're using direct order IDs now, no need to split
      const orderId = vnpayReturn.vnp_TxnRef;

      const order = await this.orderModel.findById(orderId);
      if (!order) {
        throw new NotFoundException(`Order with ID ${orderId} not found`);
      }

      const payment = await this.transactionModel.findOne({ order: orderId });
      if (!payment) {
        throw new NotFoundException(`Payment for order ${orderId} not found`);
      }

      payment.transactionId = vnpayReturn.vnp_TransactionNo;
      payment.paymentStatus = Payment_Status.PAID;
      payment.paymentDate = this.parseVnPayDate(vnpayReturn.vnp_PayDate);

      order.orderStatus = Order_Status.CONFIRMED;

      await payment.save();
      await order.save();

      return {
        success: true,
        message: 'Payment processed successfully',
      };
    } catch (error) {
      console.error('VNPay return processing error:', error);
      throw error;
    }
  }

  async processVnPayIPN(
    vnpayParams: any,
  ): Promise<{ RspCode: string; Message: string }> {
    // Log IPN params for debugging
    console.log('Processing VNPay IPN callback:', vnpayParams);

    try {
      // Step 1: Verify signature integrity
      const isValidSignature = this.vnpayService.verifyReturnUrl(vnpayParams);
      console.log('IPN Signature valid:', isValidSignature);

      if (!isValidSignature) {
        return { RspCode: '97', Message: 'Invalid signature' };
      }

      // Step 2: Check if this is a successful transaction
      if (
        vnpayParams.vnp_ResponseCode !== '00' ||
        vnpayParams.vnp_TransactionStatus !== '00'
      ) {
        console.log('Payment not successful:', vnpayParams.vnp_ResponseCode);
        return { RspCode: '99', Message: 'Payment transaction failed' };
      }

      // Step 3: Find and update the order and payment
      const shortId = vnpayParams.vnp_TxnRef;
      // Get the real order ID from the mapping
      const orderId = this.txnRefToOrderIdMap.get(shortId) || shortId;

      const order = await this.orderModel.findById(orderId);
      if (!order) {
        console.log(`Order ${orderId} not found`);
        return { RspCode: '01', Message: `Order ${orderId} not found` };
      }

      const payment = await this.transactionModel.findOne({ order: orderId });
      if (!payment) {
        console.log(`Payment for order ${orderId} not found`);
        return {
          RspCode: '01',
          Message: `Payment for order ${orderId} not found`,
        };
      }

      // Step 4: Check if already processed to avoid duplicate processing
      if (payment.paymentStatus === Payment_Status.PAID) {
        console.log(`Payment ${payment._id} already marked as paid`);
        return { RspCode: '02', Message: 'Order already paid' };
      }

      // Step 5: Update payment record
      payment.transactionId = vnpayParams.vnp_TransactionNo;
      payment.paymentStatus = Payment_Status.PAID;
      payment.paymentDate = this.parseVnPayDate(vnpayParams.vnp_PayDate);

      // Step 6: Update order status
      order.orderStatus = Order_Status.CONFIRMED;

      // Step 7: Save changes
      await payment.save();
      await order.save();

      console.log(`Successfully processed IPN for order ${orderId}`);
      return { RspCode: '00', Message: 'Confirmed successful' };
    } catch (error) {
      console.error('Error processing VNPay IPN:', error);
      return {
        RspCode: '99',
        Message: error.message || 'Unknown error processing payment',
      };
    }
  }

  // Helper method to parse VNPay date format
  parseVnPayDate(dateString: string): Date {
    // Format from VNPay is yyyyMMddHHmmss
    if (!dateString || dateString.length !== 14) {
      return new Date();
    }

    const year = parseInt(dateString.substring(0, 4));
    const month = parseInt(dateString.substring(4, 6)) - 1; // Months are 0-based
    const day = parseInt(dateString.substring(6, 8));
    const hour = parseInt(dateString.substring(8, 10));
    const minute = parseInt(dateString.substring(10, 12));
    const second = parseInt(dateString.substring(12, 14));

    return new Date(year, month, day, hour, minute, second);
  }
}
