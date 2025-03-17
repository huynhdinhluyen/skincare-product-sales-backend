import { ApiProperty } from '@nestjs/swagger';

export class PromotionDto {
  @ApiProperty({
    description: 'Promotion ID',
    example: '6789e2691cb3650e833ec270',
  })
  _id: string;

  @ApiProperty({
    description: 'Discount percentage',
    example: 20,
  })
  discountRate: number;

  @ApiProperty({
    description: 'Promotion start date',
    example: '2023-01-01T00:00:00.000Z',
  })
  startDate: Date;

  @ApiProperty({
    description: 'Promotion end date',
    example: '2023-12-31T23:59:59.999Z',
  })
  endDate: Date;

  @ApiProperty({
    description: 'Whether the promotion is currently active',
    example: true,
  })
  isActive: boolean;
}
