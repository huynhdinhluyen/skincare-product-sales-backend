import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  SkinTestResult,
  SkinTestResultDocument,
} from './schema/skin-test-result.schema';
import { SaveSkinTestResultDto } from './dto/skin-type-result.dto';
import {
  Question,
  QuestionDocument,
} from '../questions/schema/question.schema';
import { User, UserDocument } from '../auth/schema/user.schema';
import { CacheService } from '../common/services/cache.service';
import { SkinType } from '../skin-care-plan/enum/skin-type.enum';

@Injectable()
export class SkinTestResultService {
  constructor(
    @InjectModel(SkinTestResult.name)
    private readonly skinTestResultModel: Model<SkinTestResultDocument>,
    @InjectModel(Question.name)
    private readonly questionModel: Model<QuestionDocument>,
    @InjectModel(User.name)
    private readonly userModel: Model<UserDocument>,
    private readonly cacheService: CacheService,
  ) {}

  async saveSkinTestResult(
    dto: SaveSkinTestResultDto,
  ): Promise<SkinTestResult> {
    const { userId, answers } = dto;

    // Validate user exists
    const user = await this.userModel.findById(userId);
    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }

    const questionIds = answers.map((answer) => answer.questionId);
    const questions = await this.questionModel
      .find({
        _id: { $in: questionIds },
      })
      .lean();

    if (questions.length !== questionIds.length) {
      throw new NotFoundException('One or more questions not found');
    }

    // Calculate total score
    let totalScore = 0;
    for (const answer of answers) {
      const question = questions.find(
        (q) => q._id.toString() === answer.questionId,
      );
      if (!question || !question.options[answer.optionIndex]) {
        throw new NotFoundException(
          `Option not found for question ${answer.questionId}`,
        );
      }

      totalScore += question.options[answer.optionIndex].point;
    }

    // Determine skin type - using uppercase English
    const skinType = this.determineSkinType(totalScore);

    // Save or update test result
    let skinTestResult = await this.skinTestResultModel.findOne({ userId });

    if (skinTestResult) {
      skinTestResult.answers = answers;
      skinTestResult.score = totalScore;
      skinTestResult.skinType = skinType;
    } else {
      skinTestResult = new this.skinTestResultModel({
        userId,
        answers,
        score: totalScore,
        skinType,
      });
    }

    const savedResult = await skinTestResult.save();

    // Invalidate any cached results for this user
    await this.cacheService.del(`skin-test-result:${userId}`);

    return savedResult;
  }

  async getUserSkinType(userId: string): Promise<string> {
    // Try to get from cache
    const cacheKey = `skin-test-result:${userId}`;
    const cachedResult = await this.cacheService.get<string>(cacheKey);

    if (cachedResult) {
      return cachedResult;
    }

    // Get from database
    const result = await this.skinTestResultModel.findOne({ userId }).lean();

    if (!result) {
      throw new NotFoundException('No skin test result found for this user');
    }

    // Cache the result
    await this.cacheService.set(cacheKey, result.skinType, 86400); // Cache for 24 hours

    return result.skinType;
  }

  private determineSkinType(score: number): string {
    if (score >= 20) {
      return SkinType.OILY;
    } else if (score >= 15) {
      return SkinType.COMBINATION;
    } else if (score >= 10) {
      return SkinType.NORMAL;
    } else {
      return SkinType.DRY;
    }
  }
}
