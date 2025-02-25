import {
  IsArray,
  IsMongoId,
  IsNotEmpty,
  IsNumber,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

class AnswerDto {
  @IsMongoId()
  @IsNotEmpty()
  @ApiProperty({
    example: '65b8fbd9b15e4e4567f1a2b3',
    description: 'ID của câu hỏi',
  })
  questionId: string;

  @IsNumber()
  @IsNotEmpty()
  @ApiProperty({
    example: 1,
    description: 'Chỉ mục của câu trả lời đã chọn',
  })
  optionIndex: number;
}

export class SaveSkinTestResultDto {
  @IsMongoId()
  @IsNotEmpty()
  @ApiProperty({
    example: '65b8fbd9b15e4e4567f1a2b9',
    description: 'ID của người dùng thực hiện bài test',
  })
  userId: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AnswerDto)
  @ApiProperty({
    example: [
      { questionId: '65b8fbd9b15e4e4567f1a2b3', optionIndex: 1 },
      { questionId: '65b8fbd9b15e4e4567f1a2b4', optionIndex: 2 },
    ],
    description: 'Danh sách các câu trả lời',
  })
  answers: AnswerDto[];
}
