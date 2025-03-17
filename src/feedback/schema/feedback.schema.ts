import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { Document } from 'mongoose';
import { User } from '../../auth/schema/user.schema';

@Schema({ timestamps: true })
export class Feedback {
  @Prop({
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  })
  author: User;

  @Prop({ required: true, min: 1, max: 5 })
  rating: number;

  @Prop({ required: true })
  content: string;

  @Prop({ type: String, default: null })
  staffReply: string;

  @Prop({ type: Date, default: null })
  repliedAt: Date;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null })
  repliedBy: User;

  @Prop({ default: false })
  isDeleted: boolean;
}

export type FeedbackDocument = Feedback & Document;
export const FeedbackSchema = SchemaFactory.createForClass(Feedback);
FeedbackSchema.index({ author: 1, isDeleted: 1 });
FeedbackSchema.index({ isDeleted: 1 });
