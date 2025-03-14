import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, SchemaTypes, Types } from 'mongoose';
import { Category } from 'src/category/schema/category.schema';

@Schema({ timestamps: true })
export class Product {
  @Prop({ required: true, index: true })
  name: string;

  @Prop()
  brand: string;

  @Prop({ type: [String], default: [] })
  images: string[];

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
  description: string;

  @Prop({ type: SchemaTypes.ObjectId, ref: 'Category', required: true })
  category: Category;

  @Prop({ type: SchemaTypes.ObjectId, ref: 'Promotion', default: null })
  promotionId: Types.ObjectId | null;

  @Prop({ default: true })
  isActive: boolean;
}

export type ProductDocument = Product & Document;
export const ProductSchema = SchemaFactory.createForClass(Product);
ProductSchema.index({ name: 'text', description: 'text' }); // Text search index
ProductSchema.index({ category: 1 }); // For category filtering
ProductSchema.index({ price: 1 }); // For price filtering
ProductSchema.index({ isActive: 1 }); // Since we query by isActive in most requests
ProductSchema.index({ sold: -1 }); // For sorting by popularity
ProductSchema.index({ createdAt: -1 }); // For sorting by newest
ProductSchema.index({ name: 1 }); // For sorting alphabetically
