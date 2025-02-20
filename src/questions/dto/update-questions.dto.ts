import { PartialType } from '@nestjs/mapped-types';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsOptional, IsString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { CreateQuestionDto } from './create-questions.dto';
import { OptionDto } from './option.dto';

export class UpdateQuestionDto extends PartialType(CreateQuestionDto) {
  @IsString()
  @IsOptional()
  @ApiPropertyOptional({
    example: 'What is the capital of Japan?',
    description: 'Updated question text',
    required: false,
  })
  question?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OptionDto)
  @IsOptional()
  @ApiPropertyOptional({
    example: [
      { option: 'Tokyo', point: 10 },
      { option: 'Kyoto', point: 5 },
      { option: 'Osaka', point: 0 },
    ],
    description: 'Updated list of options with corresponding points',
    required: false,
  })
  options?: OptionDto[];
}
