import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsMongoId,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  Max,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';

export class ProductFilterDto {
  @ApiPropertyOptional({ description: 'Page number', minimum: 1 })
  @IsOptional()
  @IsNumber()
  @IsPositive()
  @Type(() => Number)
  page?: number = 1;

  @ApiPropertyOptional({
    description: 'Number of items per page',
    minimum: 1,
    maximum: 50,
  })
  @IsOptional()
  @IsNumber()
  @IsPositive()
  @Max(50)
  @Type(() => Number)
  limit?: number = 10;

  @ApiPropertyOptional({
    description: 'Search term for product name or description',
  })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ description: 'Category ID to filter by' })
  @IsOptional()
  @IsMongoId()
  categoryId?: string;

  @ApiPropertyOptional({ description: 'Minimum price filter' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  minPrice?: number;

  @ApiPropertyOptional({ description: 'Maximum price filter' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  maxPrice?: number;

  @ApiPropertyOptional({
    description: 'Field to sort by',
    enum: ['price', 'name', 'createdAt'],
  })
  @IsOptional()
  @IsEnum(['price', 'name', 'createdAt'])
  sortBy?: string = 'createdAt';

  @ApiPropertyOptional({ description: 'Sort order', enum: ['asc', 'desc'] })
  @IsOptional()
  @IsEnum(['asc', 'desc'])
  sortOrder?: 'asc' | 'desc' = 'desc';
}
