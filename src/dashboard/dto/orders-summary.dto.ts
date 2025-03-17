import { ApiProperty } from '@nestjs/swagger';

export class OrdersSummaryDto {
  @ApiProperty({ example: 85 })
  current: number;

  @ApiProperty({ example: 72 })
  previous: number;

  @ApiProperty({ example: 18.05 })
  change: number;

  @ApiProperty({ example: 12 })
  pending: number;
}
