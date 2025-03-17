import { ApiProperty, OmitType, PartialType } from '@nestjs/swagger';
import { IsNumber, IsOptional, IsString, Max, Min } from 'class-validator';
import { CreateFeedbackDto } from './create-feedback.dto';

export class UpdateFeedbackDto extends PartialType(
  OmitType(CreateFeedbackDto, ['productId'] as const),
) {
  @IsNumber()
  @Min(1)
  @Max(5)
  @IsOptional()
  @ApiProperty({
    example: 4.5,
    description: 'Updated rating from 1 to 5',
    minimum: 1,
    maximum: 5,
    required: false,
  })
  rating?: number;

  @IsString()
  @IsOptional()
  @ApiProperty({
    example: 'After using this product for a month, I still love it!',
    description: 'Updated content of the feedback',
    required: false,
  })
  content?: string;
}
