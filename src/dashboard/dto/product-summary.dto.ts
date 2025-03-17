import { ApiProperty } from '@nestjs/swagger';

export class ProductsSummaryDto {
  @ApiProperty({ example: 120 })
  total: number;

  @ApiProperty({ example: 8 })
  categories: number;

  @ApiProperty({ example: 4.2 })
  averageRating: number;
}
