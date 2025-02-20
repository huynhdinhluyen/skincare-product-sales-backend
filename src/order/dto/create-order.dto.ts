import { Type } from 'class-transformer';
import {
  IsArray,
  IsEnum,
  IsMongoId,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  Min,
  ValidateNested,
} from 'class-validator';
import { OrderItemDto } from './order-details.dto';
import { Payment_Method } from 'src/transaction/enums/transaction-method.enum';
import { Payment_Status } from 'src/transaction/enums/transaction-status.enum';
import { Order_Status } from '../enums/order-status.enum';
import { ApiProperty } from '@nestjs/swagger';

export class CreateOrderDto {
  @IsMongoId()
  @IsNotEmpty()
  @ApiProperty({
    example: '6789e2691cb3650e833ec269',
    description: 'Unique ID of the user placing the order',
  })
  userId: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OrderItemDto)
  @ApiProperty({
    example: [
      {
        productId: '6789d4fe76a3a69fcc611c57',
        quantity: 5,
      },
    ],
    description: 'List of products in the order',
  })
  items: OrderItemDto[];

  @IsOptional()
  @IsEnum(Order_Status, { message: 'Invalid order status ' })
  @ApiProperty({
    example: 'PENDING',
    description: 'Current status of the order',
    enum: Order_Status,
  })
  orderStatus: Order_Status;

  @IsEnum(Payment_Method, { message: 'Invalid payment method' })
  @IsNotEmpty()
  @ApiProperty({
    example: 'COD',
    description: 'Payment method used for the order',
    enum: Payment_Method,
  })
  paymentMethod: Payment_Method;

  @IsEnum(Payment_Status, { message: 'Invalid payment status' })
  @IsOptional()
  @ApiProperty({
    example: 'UNPAID',
    description: 'Current payment status of the order',
    enum: Payment_Status,
  })
  paymentStatus: Payment_Status;

  @IsNumber()
  @Min(0)
  @ApiProperty({
    example: 50,
    description: 'Shipping fee for the order',
  })
  shippingFee: number;

  @IsNumber()
  @Min(0)
  @ApiProperty({
    example: 20,
    description: 'Discount applied to the order',
  })
  discount: number;
}
