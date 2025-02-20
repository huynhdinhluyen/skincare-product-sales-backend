import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';
import { User } from 'src/auth/schema/user.schema';

@Schema({
  timestamps: true,
})
export class SkinTestResult {
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', required: false })
  userId: User;

  @Prop({ required: true })
  totalScore: number;

  @Prop({ required: true })
  skinType: string;
}

export type SkinTestResultDocument = SkinTestResult & Document;
export const SkinTestResultSchema =
  SchemaFactory.createForClass(SkinTestResult);
