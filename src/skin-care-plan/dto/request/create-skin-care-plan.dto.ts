import { ApiProperty } from '@nestjs/swagger';
import {
  IsArray,
  IsEnum,
  IsMongoId,
  IsNotEmpty,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { SkinCareStep } from '../../schema/skin-care-plan.schema';
import { SkinType } from '../../enum/skin-type.enum';

class StepDto {
  @IsEnum(SkinCareStep)
  @ApiProperty({
    enum: SkinCareStep,
    example: SkinCareStep.CLEANSING,
    description: 'Step type in skin care routine',
  })
  step: SkinCareStep;

  @IsString()
  @IsNotEmpty()
  @ApiProperty({
    example: 'Use a gentle, low-foam cleanser',
    description: 'Detailed description of what to do in this step',
  })
  description: string;

  @IsArray()
  @IsMongoId({ each: true })
  @ApiProperty({
    example: ['6456e16f1234567890123456', '6456e16f1234567890123457'],
    description: 'Array of category IDs applicable for this step',
  })
  categoryIds: string[];

  @IsString()
  @IsNotEmpty()
  @ApiProperty({
    example: 'Morning-Evening',
    description: 'Recommended frequency for this step',
  })
  frequency: string;
}

export class CreateSkinCarePlanDto {
  @IsString()
  @IsNotEmpty()
  @ApiProperty({
    example: 'Oily Skin Care Routine',
    description: 'Name of the skin care plan',
  })
  name: string;

  @IsNotEmpty()
  @ApiProperty({
    example: 'OILY',
    description: 'Skin type that this plan is designed for',
    enum: SkinType,
  })
  skinType: string;

  @IsOptional()
  @IsString()
  @ApiProperty({
    example:
      'A routine to balance oil production, minimize breakouts and reduce pore size',
    description: 'Detailed description of the skin care plan',
    required: false,
  })
  description?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => StepDto)
  @ApiProperty({
    type: [StepDto],
    description: 'Steps in the skin care routine',
  })
  steps: StepDto[];
}
