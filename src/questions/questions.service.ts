import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Question, QuestionDocument } from './schema/question.schema';
import { Model } from 'mongoose';
import { CreateQuestionDto } from './dto/create-questions.dto';
import { UpdateQuestionDto } from './dto/update-questions.dto';

@Injectable()
export class QuestionsService {
  constructor(
    @InjectModel(Question.name)
    private readonly questionsModel: Model<QuestionDocument>,
  ) {}

  async createQuestion(
    createQuestionDto: CreateQuestionDto,
  ): Promise<Question> {
    const { question, options } = createQuestionDto;

    let parsedOptions = options;
    if (typeof options === 'string') {
      try {
        parsedOptions = JSON.parse(options);
      } catch (error) {
        throw new BadRequestException('Options must be a valid array');
      }
    }

    if (!Array.isArray(parsedOptions) || !parsedOptions.length) {
      throw new BadRequestException('Options must be a non-empty array');
    }

    const createdQuestion = new this.questionsModel({
      question,
      options: parsedOptions,
    });

    return await createdQuestion.save();
  }

  async getQuestions(): Promise<Question[]> {
    return this.questionsModel.find().exec();
  }

  async updateQuestion(
    id: string,
    updateQuestionDto: UpdateQuestionDto,
  ): Promise<Question> {
    // Kiểm tra nếu updateQuestionDto có chứa options không
    if (updateQuestionDto.options) {
      // Kiểm tra xem options có chứa dữ liệu hợp lệ không
      if (!Array.isArray(updateQuestionDto.options)) {
        throw new Error('Options must be an array.');
      }

      // Kiểm tra nếu tất cả các options đều có giá trị point hợp lệ
      for (const option of updateQuestionDto.options) {
        if (!option.option || option.point === undefined) {
          throw new Error(
            'Each option must contain both option text and a point.',
          );
        }
      }
    }

    // Cập nhật câu hỏi
    const updatedQuestion = await this.questionsModel.findByIdAndUpdate(
      id,
      updateQuestionDto,
      { new: true },
    );

    if (!updatedQuestion) {
      throw new NotFoundException('Question not found.');
    }

    return updatedQuestion;
  }

  async deleteQuestion(id: string): Promise<String> {
    const deletedQuestion = await this.questionsModel.findByIdAndDelete(id);

    if (!deletedQuestion) {
      throw new NotFoundException('Question not found.');
    }

    return 'Question deleted.';
  }
}
