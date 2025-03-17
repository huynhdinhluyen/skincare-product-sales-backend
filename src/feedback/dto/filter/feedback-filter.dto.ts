import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsOptional, Min } from 'class-validator';
import { Type } from 'class-transformer';

export enum FeedbackSortOption {
  NEWEST = 'newest',
  OLDEST = 'oldest',
  HIGHEST_RATING = 'highest_rating',
  LOWEST_RATING = 'lowest_rating',
}

export class GetFeedbackFilterDto {
  @Type(() => Number)
  @IsOptional()
  @ApiProperty({
    required: false,
    description: 'Page number',
  })
  page?: number;

  @Type(() => Number)
  @IsOptional()
  @ApiProperty({
    required: false,
    description: 'Items per page',
  })
  limit?: number;

  @IsOptional()
  @Min(1)
  @Type(() => Number)
  @ApiProperty({
    required: false,
    description: 'Filter by rating value (1-5)',
  })
  rating?: number;

  @IsOptional()
  @IsEnum(FeedbackSortOption)
  @ApiProperty({
    required: false,
    enum: FeedbackSortOption,
    description: 'Sort option for feedback',
  })
  sortBy?: FeedbackSortOption;
}
