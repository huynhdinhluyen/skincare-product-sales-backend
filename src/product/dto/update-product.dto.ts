import { PartialType } from '@nestjs/mapped-types';
import { CreateProductDto } from './create-product.dto';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateProductDto extends PartialType(CreateProductDto) {
  @ApiPropertyOptional({
    example: 'Updated Face Cream',
    description: 'Updated name of the product',
    required: false,
  })
  name?: string;

  @ApiPropertyOptional({
    example: 34.99,
    description: 'Updated price of the product',
    required: false,
  })
  price?: number;

  @ApiPropertyOptional({
    example: 80,
    description: 'Updated stock quantity',
    required: false,
  })
  stockQuantity?: number;
}
