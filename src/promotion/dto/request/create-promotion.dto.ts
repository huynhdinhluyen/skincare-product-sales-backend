import { ApiProperty } from '@nestjs/swagger';
import {
  IsDateString,
  IsNotEmpty,
  IsNumber,
  IsString,
  Max,
  Min,
} from 'class-validator';

export class CreatePromotionDto {
  @IsString()
  @IsNotEmpty()
  @ApiProperty({
    example: 'name',
  })
  name: string;

  @IsNumber()
  @Min(0)
  @Max(100)
  @ApiProperty({ example: 0 })
  discountRate: number;

  @IsDateString()
  @ApiProperty({
    example: 'date',
  })
  startDate: Date;

  @IsDateString()
  @ApiProperty({
    example: 'date',
  })
  endDate: Date;
}
