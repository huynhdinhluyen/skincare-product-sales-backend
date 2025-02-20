import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, SchemaTypes } from 'mongoose';
import { User } from 'src/auth/schema/user.schema';
import { Product } from 'src/product/schema/product.schema';

@Schema({
  timestamps: true,
})
export class Cart {
  @Prop({
    type: SchemaTypes.ObjectId,
    ref: 'User',
    required: true,
  })
  user: User;

  @Prop([
    {
      product: {
        type: SchemaTypes.ObjectId,
        ref: 'Product',
        required: true,
      },
      quantity: { type: Number, required: true, min: 1, default: 1 },
    },
  ])
  items: {
    product: Product;
    quantity: number;
  }[];

  @Prop({ default: 0 })
  totalPrice: number;
}

export type CartDocument = Cart & Document;
export const CartSchema = SchemaFactory.createForClass(Cart);
