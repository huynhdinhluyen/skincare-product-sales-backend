import { ApiProperty } from '@nestjs/swagger';
import {
  IsMongoId,
  IsNotEmpty,
  IsNumber,
  IsString,
  Max,
  Min,
} from 'class-validator';

export class CreateFeedbackDto {
  @IsMongoId()
  @IsNotEmpty()
  @ApiProperty({
    example: '64f7e94d01297f5d1ccd7e58',
    description: 'ID of the product being reviewed',
  })
  productId: string;

  @IsNumber()
  @Min(1)
  @Max(5)
  @IsNotEmpty()
  @ApiProperty({
    example: 4,
    description: 'Rating from 1 to 5',
    minimum: 1,
    maximum: 5,
  })
  rating: number;

  @IsString()
  @IsNotEmpty()
  @ApiProperty({
    example: 'This product was excellent for my dry skin!',
    description: 'Content of the feedback',
  })
  content: string;
}
