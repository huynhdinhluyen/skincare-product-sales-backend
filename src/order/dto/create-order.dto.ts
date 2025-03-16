import { Type } from 'class-transformer';
import {
  IsArray,
  IsEnum,
  IsMongoId,
  IsNotEmpty,
  IsNumber,
  IsObject,
  IsOptional,
  Min,
  ValidateNested,
} from 'class-validator';
import { OrderItemDto } from './order-details.dto';
import { Payment_Method } from 'src/transaction/enums/payment-method.enum';
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

  @IsEnum(Payment_Method, { message: 'Invalid payment method' })
  @IsNotEmpty()
  @ApiProperty({
    example: 'COD',
    description: 'Payment method used for the order',
    enum: Payment_Method,
  })
  paymentMethod: Payment_Method;

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

  @IsObject()
  @IsOptional()
  @ApiProperty({
    description: 'Shipping address information',
    example: {
      addressLine1: '123 Main St',
      city: 'Hanoi',
      province: 'Hanoi',
      phone: '0123456789',
    },
  })
  shippingAddress?: {
    addressLine1: string;
    addressLine2?: string;
    city: string;
    province: string;
    phone: string;
  };
}
