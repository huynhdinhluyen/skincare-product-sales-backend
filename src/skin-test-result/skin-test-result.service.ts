import { SaveSkinTestResultDto } from './dto/skin-type-result.dto';
import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import {
  SkinTestResult,
  SkinTestResultDocument,
} from './schema/skin-test-result.schema';
import { Model } from 'mongoose';
import {
  Question,
  QuestionDocument,
} from 'src/questions/schema/question.schema';
import { User, UserDocument } from 'src/auth/schema/user.schema';

@Injectable()
export class SkinTestResultService {
  constructor(
    @InjectModel(SkinTestResult.name)
    private skinTestResultModel: Model<SkinTestResultDocument>,
    @InjectModel(Question.name) private questionModel: Model<QuestionDocument>,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
  ) {}

  async calculateSkinType(
    saveSkinTestResultDto: SaveSkinTestResultDto,
  ): Promise<string> {
    const questionIds = saveSkinTestResultDto.answers.map(
      (answer) => answer.questionId,
    );

    const questions = await this.questionModel.find({
      _id: { $in: questionIds },
    });

    if (questions.length !== questionIds.length) {
      throw new BadRequestException('One or more questions not found');
    }

    let totalScore = 0;

    for (const answer of saveSkinTestResultDto.answers) {
      const question = questions.find(
        (q) => q._id.toString() === answer.questionId,
      );

      if (!question) {
        throw new BadRequestException(
          `Question with ID ${answer.questionId} not found`,
        );
      }

      const option = question.options[answer.optionIndex];

      if (!option) {
        throw new BadRequestException(
          `Invalid option index ${answer.optionIndex} for question ${answer.questionId}`,
        );
      }

      totalScore += option.point;
    }

    const skinType = this.determineSkinType(totalScore);

    const result = await this.skinTestResultModel.findOneAndUpdate(
      { userId: saveSkinTestResultDto.userId },
      { userId: saveSkinTestResultDto.userId, totalScore, skinType },
      { new: true, upsert: true },
    );

    return result.skinType;
  }

  private determineSkinType(score: number): string {
    if (score >= 20) {
      return 'Da dầu';
    } else if (score >= 15) {
      return 'Da hỗn hợp';
    } else if (score >= 10) {
      return 'Da thường';
    } else {
      return 'Da khô';
    }
  }
}
