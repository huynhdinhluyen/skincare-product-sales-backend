import { ApiProperty } from '@nestjs/swagger';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsMongoId,
} from 'class-validator';

export class CompareProductsDto {
  @IsArray()
  @ArrayMinSize(2, {
    message: 'At least 2 products must be selected for comparison',
  })
  @ArrayMaxSize(4, { message: 'Maximum 4 products can be compared at once' })
  @IsMongoId({ each: true })
  @ApiProperty({
    example: ['6789d4fe76a3a69fcc611c57', '6789d4fe76a3a69fcc611c58'],
    description: 'Array of product IDs to compare (2-4 products)',
    minItems: 2,
    maxItems: 4,
  })
  productIds: string[];
}
