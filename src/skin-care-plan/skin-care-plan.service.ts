import { Inject, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { CreateSkinCarePlanDto } from './dto/create-skin-care-plan.dto';
import { UpdateSkinCarePlanDto } from './dto/update-skin-care-plan.dto';
import {
  SkinCarePlan,
  SkinCarePlanDocument,
} from './entities/skin-care-plan.entity';
import { InjectModel } from '@nestjs/mongoose';
import {
  SkinTestResult,
  SkinTestResultDocument,
} from 'src/skin-test-result/schema/skin-test-result.schema';
import { Model } from 'mongoose';
import {
  Question,
  QuestionDocument,
} from 'src/questions/schema/question.schema';
import { User, UserDocument } from 'src/auth/schema/user.schema';
import { Product, ProductDocument } from 'src/product/schema/product.schema';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { CompareProductsDto } from 'src/product/dto/compare-product.dto';

@Injectable()
export class SkinCarePlanService {
  private readonly logger = new Logger(SkinCarePlanService.name);

  constructor(
    @InjectModel(SkinTestResult.name)
    private skinTestResultModel: Model<SkinTestResultDocument>,
    @InjectModel(Question.name) private questionModel: Model<QuestionDocument>,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(Product.name)
    private readonly productModel: Model<ProductDocument>,
    @InjectModel(SkinCarePlan.name)
    private readonly skinCarePlanModel: Model<SkinCarePlanDocument>,
    @Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
  ) {}

  async getSkinCarePlan(skinType: string): Promise<SkinCarePlan> {
    const plan = await this.skinCarePlanModel
      .findOne({ skinType })
      .lean()
      .exec();
    if (!plan) {
      throw new NotFoundException(
        `No skin care plan found for skin type: ${skinType}`,
      );
    }
    return plan;
  }

  async getRecommendedProducts(
    skinType: string,
    page: number = 1,
    limit: number = 10,
  ): Promise<{ data: Product[]; totalCount: number; totalPages: number }> {
    const cacheKey = `recommended:${skinType}:page=${page}:limit=${limit}`;

    try {
      const cachedResult = await this.cacheManager.get<{
        data: Product[];
        totalCount: number;
        totalPages: number;
      }>(cacheKey);
      if (cachedResult) {
        return cachedResult;
      }
    } catch (cacheError) {
      this.logger.error(`Cache error for recommended products:`, cacheError);
    }
    const plan = await this.getSkinCarePlan(skinType);
    const criteria = { isActive: true, ...plan.productCriteria };

    const skip = (page - 1) * limit;
    const [products, totalCount] = await Promise.all([
      this.productModel.find(criteria).skip(skip).limit(limit).lean().exec(),
      this.productModel.countDocuments(criteria).exec(),
    ]);

    const result = {
      data: products,
      totalCount,
      totalPages: Math.ceil(totalCount / limit),
    };

    try {
      await this.cacheManager.set(cacheKey, result, 3600);
    } catch (cacheSetError) {
      this.logger.error(
        `Error setting cache for recommended products:`,
        cacheSetError,
      );
    }
    return result;
  }

  async compareProducts(compareDto: CompareProductsDto): Promise<Product[]> {
    const products = await this.productModel
      .find({ _id: { $in: compareDto.productIds }, isActive: true })
      .lean()
      .exec();
    if (!products || products.length === 0) {
      throw new NotFoundException('No products found for comparison');
    }
    return products;
  }
}
