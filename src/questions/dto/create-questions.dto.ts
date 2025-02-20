import { IsArray, IsNotEmpty, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { OptionDto } from './option.dto';

export class CreateQuestionDto {
  @IsNotEmpty()
  @ApiProperty({
    example: 'What is the capital of France?',
    description: 'The question text',
  })
  question: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OptionDto)
  @ApiProperty({
    example: [
      { option: 'Paris', point: 10 },
      { option: 'London', point: 0 },
      { option: 'Berlin', point: 0 },
    ],
    description: 'List of possible options with corresponding points',
  })
  options: OptionDto[];
}
