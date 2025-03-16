import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty } from 'class-validator';
import { Order_Status } from '../enums/order-status.enum';

export class UpdateOrderStatusDto {
  @IsNotEmpty()
  @IsEnum(Order_Status)
  @ApiProperty({
    enum: Order_Status,
    example: Order_Status.PROCESSING,
    description: 'New status for the order',
  })
  status: Order_Status;
}
