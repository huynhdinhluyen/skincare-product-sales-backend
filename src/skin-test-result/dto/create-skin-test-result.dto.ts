import {
  ArrayNotEmpty,
  IsArray,
  IsMongoId,
  IsNotEmpty,
  IsString,
} from 'class-validator';

export class AnswerDto {
  @IsMongoId()
  questionId: string;

  @IsString()
  @IsNotEmpty()
  selectedOption: string;
}

export class CreateSkinTestResultDto {
  @IsMongoId()
  userId: string;

  @IsArray()
  @ArrayNotEmpty()
  answers: AnswerDto[];
}
