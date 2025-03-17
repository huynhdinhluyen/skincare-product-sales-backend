import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsMongoId, IsOptional, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { Order_Status } from '../../enums/order-status.enum';

export enum OrderSortBy {
  CREATED_DESC = 'createdAt_desc',
  CREATED_ASC = 'createdAt_asc',
  TOTAL_PRICE_DESC = 'totalPrice_desc',
  TOTAL_PRICE_ASC = 'totalPrice_asc',
}

export class OrderFilterDto {
  @ApiPropertyOptional({
    description: 'Page number',
    default: 1,
    type: Number,
  })
  @IsOptional()
  @Type(() => Number)
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({
    description: 'Items per page',
    default: 10,
    type: Number,
  })
  @IsOptional()
  @Type(() => Number)
  @Min(1)
  limit?: number = 10;

  @ApiPropertyOptional({
    description: 'Filter by order status',
    enum: Order_Status,
  })
  @IsOptional()
  @IsEnum(Order_Status)
  status?: Order_Status;

  @ApiPropertyOptional({
    description: 'Filter by user ID',
  })
  @IsOptional()
  @IsMongoId()
  userId?: string;

  @ApiPropertyOptional({
    description: 'Sort orders by',
    enum: OrderSortBy,
    default: OrderSortBy.CREATED_DESC,
  })
  @IsOptional()
  @IsEnum(OrderSortBy)
  sortBy?: OrderSortBy = OrderSortBy.CREATED_DESC;
}
