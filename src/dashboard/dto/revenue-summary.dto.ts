import { ApiProperty } from '@nestjs/swagger';

export class RevenueSummaryDto {
  @ApiProperty({ example: 12500 })
  current: number;

  @ApiProperty({ example: 10000 })
  previous: number;

  @ApiProperty({ example: 25 })
  change: number;
}
