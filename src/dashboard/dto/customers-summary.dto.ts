import { ApiProperty } from '@nestjs/swagger';

export class CustomersSummaryDto {
  @ApiProperty({ example: 250 })
  total: number;

  @ApiProperty({ example: 15 })
  new: number;
}
