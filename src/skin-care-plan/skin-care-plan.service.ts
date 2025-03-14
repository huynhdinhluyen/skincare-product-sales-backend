import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  SkinCarePlan,
  SkinCarePlanDocument,
} from './schema/skin-care-plan.schema';
import { Product, ProductDocument } from '../product/schema/product.schema';
import { CacheService } from '../common/services/cache.service';
import { CreateSkinCarePlanDto } from './dto/request/create-skin-care-plan.dto';
import { UpdateSkinCarePlanDto } from './dto/request/update-skin-care-plan.dto';
import { SkinType } from './enum/skin-type.enum';

@Injectable()
export class SkinCarePlanService {
  private readonly logger = new Logger(SkinCarePlanService.name);

  constructor(
    @InjectModel(SkinCarePlan.name)
    private readonly skinCarePlanModel: Model<SkinCarePlanDocument>,
    @InjectModel(Product.name)
    private readonly productModel: Model<ProductDocument>,
    private readonly cacheService: CacheService,
  ) {}

  async createSkinCarePlan(
    createDto: CreateSkinCarePlanDto,
  ): Promise<SkinCarePlan> {
    const skinType = createDto.skinType.toUpperCase();

    if (!Object.values(SkinType).includes(skinType as SkinType)) {
      throw new BadRequestException(
        `Invalid skin type. Must be one of: ${Object.values(SkinType).join(', ')}`,
      );
    }

    const existingPlan = await this.skinCarePlanModel.findOne({
      skinType,
      isActive: true,
    });

    if (existingPlan) {
      throw new BadRequestException(
        `An active skin care plan for ${skinType} already exists. Please deactivate it first or update it.`,
      );
    }

    const newPlan = new this.skinCarePlanModel({
      ...createDto,
      skinType: skinType,
    });

    const savedPlan = await newPlan.save();

    await this.cacheService.del(`skin-care-plan:${skinType}`);

    return savedPlan;
  }

  async getSkinCarePlanBySkinType(skinType: string): Promise<SkinCarePlan> {
    const skinTypeUpper = skinType.toUpperCase();
    const cacheKey = `skin-care-plan:${skinTypeUpper}`;
    const cachedPlan = await this.cacheService.get<SkinCarePlan>(cacheKey);

    if (cachedPlan) {
      return cachedPlan;
    }

    const plan = await this.skinCarePlanModel
      .findOne({ skinType: skinTypeUpper, isActive: true })
      .lean()
      .exec();

    if (!plan) {
      throw new NotFoundException(
        `No skin care plan found for skin type: ${skinTypeUpper}`,
      );
    }

    await this.cacheService.set(cacheKey, plan, 3600); // Cache for 1 hour

    return plan;
  }

  async getRecommendedProducts(
    skinType: string,
    step?: string,
    page: number = 1,
    limit: number = 10,
  ): Promise<{ data: any[]; totalCount: number; totalPages: number }> {
    const skinTypeUpper = skinType.toUpperCase();

    const cacheKey = `recommended-products:${skinTypeUpper}:${step || 'all'}:${page}:${limit}`;
    const cachedResult = await this.cacheService.get<{
      data: any[];
      totalCount: number;
      totalPages: number;
    }>(cacheKey);

    if (cachedResult) {
      return cachedResult;
    }

    const plan = await this.getSkinCarePlanBySkinType(skinTypeUpper);

    const relevantSteps = step
      ? plan.steps.filter((s) => s.step === step)
      : plan.steps;

    if (relevantSteps.length === 0) {
      throw new NotFoundException(
        `Step "${step}" not found in skin care plan for ${skinTypeUpper}`,
      );
    }

    const categoryIds = relevantSteps.flatMap((step) => step.categoryIds);

    const skip = (page - 1) * limit;

    const [products, totalCount] = await Promise.all([
      this.productModel
        .find({
          category: { $in: categoryIds },
          isActive: true,
        })
        .skip(skip)
        .limit(limit)
        .populate('category', 'name')
        .populate('promotionId', 'discountRate startDate endDate isActive')
        .lean()
        .exec(),
      this.productModel.countDocuments({
        category: { $in: categoryIds },
        isActive: true,
      }),
    ]);

    const processedProducts = products.map((product) =>
      this.applyPromotion(product),
    );

    const result = {
      data: processedProducts,
      totalCount,
      totalPages: Math.ceil(totalCount / limit),
    };

    await this.cacheService.set(cacheKey, result, 1800); // Cache for 30 minutes

    return result;
  }

  async updateSkinCarePlan(
    id: string,
    updateDto: UpdateSkinCarePlanDto,
  ): Promise<SkinCarePlan> {
    const plan = await this.skinCarePlanModel.findById(id);

    if (!plan) {
      throw new NotFoundException(`Skin care plan with ID ${id} not found`);
    }

    if (updateDto.skinType) {
      const skinTypeUpper = updateDto.skinType.toUpperCase();
      updateDto.skinType = skinTypeUpper;

      if (skinTypeUpper !== plan.skinType) {
        const existingPlan = await this.skinCarePlanModel.findOne({
          skinType: skinTypeUpper,
          isActive: true,
          _id: { $ne: id },
        });

        if (existingPlan) {
          throw new BadRequestException(
            `An active skin care plan for ${skinTypeUpper} already exists.`,
          );
        }
      }
    }

    Object.assign(plan, updateDto);
    const savedPlan = await plan.save();

    await this.cacheService.del(`skin-care-plan:${plan.skinType}`);
    if (updateDto.skinType && updateDto.skinType !== plan.skinType) {
      await this.cacheService.del(`skin-care-plan:${updateDto.skinType}`);
    }

    return savedPlan;
  }

  private applyPromotion(product: any): any {
    if (product.promotionId && product.promotionId.isActive) {
      const now = new Date();
      const { discountRate, startDate, endDate } = product.promotionId;

      if (now >= new Date(startDate) && now <= new Date(endDate)) {
        const discountedPrice =
          product.price - (product.price * discountRate) / 100;
        return {
          ...product,
          originalPrice: product.price,
          discountedPrice: Math.max(0, discountedPrice),
        };
      }
    }

    return {
      ...product,
      originalPrice: product.price,
      discountedPrice: product.price,
    };
  }
}
