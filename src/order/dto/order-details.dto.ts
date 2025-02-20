import { ApiProperty } from '@nestjs/swagger';
import { IsMongoId, IsNotEmpty, IsNumber, Min } from 'class-validator';

export class OrderItemDto {
  @IsMongoId()
  @IsNotEmpty()
  @ApiProperty({ example: 'productId' })
  productId: string;

  @IsNumber()
  @Min(1)
  @IsNotEmpty()
  @ApiProperty({ example: '1' })
  quantity: number;
}
