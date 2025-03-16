import { Module } from '@nestjs/common';
import { TransactionController } from './transaction.controller';
import { TransactionService } from './transaction.service';
import { AuthModule } from 'src/auth/auth.module';
import { MongooseModule } from '@nestjs/mongoose';
import { Payment, PaymentSchema } from './schema/payment.schema';
import { Order, OrderSchema } from 'src/order/schema/order.schema';
import { ConfigModule } from '@nestjs/config';
import { VnPayService } from '../vnpay/vnpay.service';

@Module({
  imports: [
    AuthModule,
    ConfigModule,
    MongooseModule.forFeature([{ name: Payment.name, schema: PaymentSchema }]),
    MongooseModule.forFeature([{ name: Order.name, schema: OrderSchema }]),
  ],
  controllers: [TransactionController],
  providers: [TransactionService, VnPayService],
  exports: [TransactionService],
})
export class TransactionModule {}
