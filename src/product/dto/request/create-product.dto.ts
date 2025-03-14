import {
  IsArray,
  IsMongoId,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateProductDto {
  @IsString()
  @IsNotEmpty()
  @ApiProperty({
    example: 'Hydrating Face Cream',
    description: 'Name of the product',
  })
  name: string;

  @IsString()
  @ApiProperty({
    example: 'LuxeSkin',
    description: 'Brand of the product',
  })
  brand: string;

  @IsArray()
  @IsOptional()
  @ApiProperty({
    example: [
      'https://example.com/image1.jpg',
      'https://example.com/image2.jpg',
    ],
    description: 'Array of image URLs',
    required: false,
  })
  images?: string[];

  @IsString()
  @ApiProperty({
    example: 'France',
    description: 'Country of origin',
  })
  origin: string;

  @IsNumber()
  @Min(0)
  @ApiProperty({
    example: 50,
    description: 'Capacity of the product in ml',
  })
  capacity: number;

  @IsNumber()
  @Min(0)
  @ApiProperty({
    example: 29.99,
    description: 'Price of the product in USD',
  })
  price: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  @ApiProperty({
    example: 100,
    description: 'Stock quantity available',
    required: false,
  })
  stockQuantity?: number;

  @IsString()
  @IsOptional()
  @ApiProperty({
    example: 'A deeply hydrating face cream that nourishes the skin.',
    description: 'Description of the product',
    required: false,
  })
  description?: string;

  @IsMongoId()
  @ApiProperty({
    example: '6789e2691cb3650e833ec269',
    description: 'MongoDB ID of the product category',
  })
  category: string;
}
