import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Role } from '../enums/role.enum';
import { Document } from 'mongoose';

@Schema({
  timestamps: true,
})
export class User {
  @Prop({ unique: true, required: true })
  username: string;

  @Prop({
    required: true,
  })
  email: string;

  @Prop({ required: true })
  password: string;

  @Prop({ required: true })
  fullName: string;

  @Prop({
    required: true,
    unique: true,
  })
  phone: string;

  @Prop()
  city: string;

  @Prop()
  address: string;

  @Prop({ min: 0 })
  point: number;

  @Prop({ default: true })
  isActive: boolean;

  @Prop({
    type: String,
    enum: Role,
    default: Role.CUSTOMER,
  })
  role: Role;
}

export type UserDocument = User & Document;
export const UserSchema = SchemaFactory.createForClass(User);
