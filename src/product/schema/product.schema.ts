import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { Document, SchemaTypes, Types } from 'mongoose';
import { Category } from 'src/category/schema/category.schema';
import { SkinType } from '../../skin-care-plan/enum/skin-type.enum';

@Schema({ timestamps: true })
export class Product {
  @Prop({ required: true, index: true })
  name: string;

  @Prop()
  brand: string;

  @Prop({ type: [String], default: [] })
  images: string[];

  @Prop({ type: [String], enum: Object.values(SkinType), default: [] })
  skinTypes: string[];

  @Prop({ required: true })
  origin: string;

  @Prop({ required: true, min: 0 })
  capacity: number;

  @Prop({ required: true, min: 0 })
  price: number;

  @Prop({ min: 0 })
  stockQuantity: number;

  @Prop({ default: 0 })
  sold: number;

  @Prop({ default: '' })
  ingredients: string;

  @Prop({ default: '' })
  description: string;

  @Prop({ type: SchemaTypes.ObjectId, ref: 'Category', required: true })
  category: Category;

  @Prop({ type: SchemaTypes.ObjectId, ref: 'Promotion', default: null })
  promotionId: Types.ObjectId | null;

  @Prop({
    type: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Feedback',
      },
    ],
    default: [],
  })
  feedback: Types.ObjectId[];

  @Prop({ default: 0 })
  averageRating: number;

  @Prop({ default: 0 })
  reviewCount: number;

  @Prop({ default: true })
  isActive: boolean;
}

export type ProductDocument = Product & Document;
export const ProductSchema = SchemaFactory.createForClass(Product);
ProductSchema.index({ name: 'text', description: 'text' });
ProductSchema.index({ category: 1 });
ProductSchema.index({ price: 1 });
ProductSchema.index({ isActive: 1 });
ProductSchema.index({ sold: -1 });
ProductSchema.index({ createdAt: -1 });
ProductSchema.index({ name: 1 });
ProductSchema.index({ averageRating: -1 });
