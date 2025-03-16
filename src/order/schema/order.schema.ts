import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { Document, Types } from 'mongoose';
import { OrderDetails, OrderDetailsSchema } from './order-details.schema';
import { Order_Status } from '../enums/order-status.enum';

@Schema({
  timestamps: true,
})
export class Order {
  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true })
  user: Types.ObjectId;

  @Prop({ type: [OrderDetailsSchema], required: true })
  items: OrderDetails[];

  @Prop({ type: Number, required: true })
  totalQuantity: number;

  @Prop({ type: Number, required: true })
  totalPrice: number;

  @Prop({ type: Number, default: 0 })
  discount: number;

  @Prop({ type: Number, default: 0 })
  shippingFee: number;

  @Prop({ type: String, enum: Order_Status, default: Order_Status.PENDING })
  orderStatus: Order_Status;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'Payment' })
  payment: Types.ObjectId;
}

export type OrderDocument = Order & Document;
export const OrderSchema = SchemaFactory.createForClass(Order);
OrderSchema.index({ createdAt: 1, orderStatus: 1 });
