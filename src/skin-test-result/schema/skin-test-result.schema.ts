import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';
import { User } from 'src/auth/schema/user.schema';

@Schema({
  timestamps: true,
})
export class SkinTestResult {
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', required: false })
  userId: User;

  @Prop({ type: Array, required: true })
  answers: {
    questionId: string;
    optionIndex: number;
  }[];

  @Prop({ required: true })
  score: number;

  @Prop({ required: true })
  skinType: string;
}

export type SkinTestResultDocument = SkinTestResult & Document;
export const SkinTestResultSchema =
  SchemaFactory.createForClass(SkinTestResult);
