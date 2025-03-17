import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { SkinType } from '../enum/skin-type.enum';

export enum SkinCareStep {
  CLEANSING = 'cleansing',
  TONING = 'toning',
  SERUM = 'serum',
  MOISTURIZING = 'moisturizing',
  SUNSCREEN = 'sunscreen',
  EXFOLIATION = 'exfoliation',
  MASK = 'mask',
}

@Schema({ timestamps: true })
export class SkinCarePlan {
  @Prop({ required: true })
  name: string;

  @Prop({ required: true, enum: Object.values(SkinType) })
  skinType: string;

  @Prop({ required: true })
  steps: {
    step: SkinCareStep;
    description: string;
    categoryIds: string[];
    frequency: string;
  }[];

  @Prop({ default: true })
  isActive: boolean;

  @Prop()
  description: string;
}

export type SkinCarePlanDocument = SkinCarePlan & Document;
export const SkinCarePlanSchema = SchemaFactory.createForClass(SkinCarePlan);

SkinCarePlanSchema.index({ skinType: 1, isActive: 1 });
