import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { Document } from 'mongoose';
import { Payment_Status } from '../enums/transaction-status.enum';
import { Payment_Method } from '../enums/transaction-method.enum';

@Schema({
  timestamps: true,
})
export class Payment {
  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'Order', required: true })
  order: mongoose.Schema.Types.ObjectId;

  @Prop({
    type: String,
    enum: Payment_Method,
  })
  paymentMethod: Payment_Method;

  @Prop()
  paymentDate: Date;

  @Prop({ required: true })
  amount: number;

  @Prop()
  transactionId: string;

  @Prop({
    type: String,
    enum: Payment_Status,
    default: Payment_Status.UNPAID,
  })
  paymentStatus: Payment_Status;
}

export type PaymentDocument = Payment & Document;
export const PaymentSchema = SchemaFactory.createForClass(Payment);
