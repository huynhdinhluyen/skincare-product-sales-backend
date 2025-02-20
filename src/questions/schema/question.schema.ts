import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

@Schema()
class Option {
  @Prop({ required: true })
  option: string;

  @Prop({ required: true })
  point: number;
}

@Schema()
export class Question {
  @Prop({ required: true })
  question: string;

  @Prop({ type: [Option], required: true })
  options: Option[];
}

export type QuestionDocument = Question & Document;
export const QuestionSchema = SchemaFactory.createForClass(Question);
