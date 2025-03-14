import { ApiProperty } from '@nestjs/swagger';
import { PromotionDto } from '../../../promotion/dto/response/promotion.dto';
import { CategoryDto } from '../../../category/dto/response/category.dto';

export class ProductResponseDto {
  @ApiProperty({
    description: 'Product ID',
    example: '6789d4fe76a3a69fcc611c57',
  })
  _id: string;

  @ApiProperty({
    description: 'Product name',
    example: 'Hydrating Face Cream',
  })
  name: string;

  @ApiProperty({
    description: 'Brand name',
    example: 'LuxeSkin',
  })
  brand: string;

  @ApiProperty({
    description: 'Product images URLs',
    example: [
      'https://example.com/image1.jpg',
      'https://example.com/image2.jpg',
    ],
  })
  images: string[];

  @ApiProperty({
    description: 'Country of origin',
    example: 'France',
  })
  origin: string;

  @ApiProperty({
    description: 'Product capacity in ml',
    example: 50,
  })
  capacity: number;

  @ApiProperty({
    description: 'Original price',
    example: 29.99,
  })
  originalPrice: number;

  @ApiProperty({
    description: 'Current price after discount (if applicable)',
    example: 23.99,
  })
  discountedPrice: number;

  @ApiProperty({
    description: 'Available quantity in stock',
    example: 100,
  })
  stockQuantity: number;

  @ApiProperty({
    description: 'Number of units sold',
    example: 25,
  })
  sold: number;

  @ApiProperty({
    description: 'Detailed product description',
    example: 'A deeply hydrating face cream that nourishes the skin.',
  })
  description: string;

  @ApiProperty({
    description: 'Product category',
    type: CategoryDto,
  })
  category: CategoryDto;

  @ApiProperty({
    description: 'Applied promotion (if available)',
    type: PromotionDto,
    required: false,
    nullable: true,
  })
  promotionId: PromotionDto | null;

  @ApiProperty({
    description: 'Creation timestamp',
    example: '2023-10-15T14:30:00.000Z',
  })
  createdAt: Date;

  @ApiProperty({
    description: 'Last update timestamp',
    example: '2023-10-20T09:15:00.000Z',
  })
  updatedAt: Date;
}
