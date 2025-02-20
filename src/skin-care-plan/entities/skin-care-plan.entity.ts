import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true })
export class SkinCarePlan {
  @Prop({
    required: true,
    index: true,
  })
  skinType: string;

  @Prop({ required: true })
  description: string;

  @Prop({ type: [String], required: true })
  steps: string[];

  @Prop({ type: Object, default: {} })
  productCriteria: Record<string, any>;
}

export type SkinCarePlanDocument = SkinCarePlan & Document;
export const SkinCarePlanSchema = SchemaFactory.createForClass(SkinCarePlan);
