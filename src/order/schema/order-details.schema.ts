import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';
import { Product } from 'src/product/schema/product.schema';

@Schema({ timestamps: true })
export class OrderDetails {
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Product', required: true })
  productId: Product;

  @Prop({ type: Number, required: true, min: 1 })
  quantity: number;

  @Prop({ type: Number, required: true })
  price: number;

  @Prop({ type: Number, required: true })
  subTotal: number;
}

export type OrderDetailsDocument = OrderDetails & Document;
export const OrderDetailsSchema = SchemaFactory.createForClass(OrderDetails);
