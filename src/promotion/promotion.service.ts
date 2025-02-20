import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Promotion, PromotionDocument } from './schema/promotion.schema';
import { CreatePromotionDto } from './dto/create-promotion.dto';
import { UpdatePromotionDto } from './dto/update-promotion.dto';
import { Cron, CronExpression } from '@nestjs/schedule';

@Injectable()
export class PromotionService {
  private readonly logger = new Logger(PromotionService.name);

  constructor(
    @InjectModel(Promotion.name)
    private readonly promotionModel: Model<PromotionDocument>,
  ) {}

  async create(createPromotionDto: CreatePromotionDto): Promise<Promotion> {
    if (
      new Date(createPromotionDto.startDate) >=
      new Date(createPromotionDto.endDate)
    ) {
      throw new BadRequestException('Start date must be before end date');
    }
    return this.promotionModel.create({
      ...createPromotionDto,
      isDeleted: false,
    });
  }

  async findAll(): Promise<Promotion[]> {
    return this.promotionModel.find({ isDeleted: false }).exec();
  }

  async findOne(id: string): Promise<Promotion> {
    const promotion = await this.promotionModel.findById(id).exec();
    if (!promotion || promotion.isDeleted) {
      throw new NotFoundException(`Promotion with ID ${id} not found`);
    }
    return promotion;
  }

  async update(
    id: string,
    updatePromotionDto: UpdatePromotionDto,
  ): Promise<Promotion> {
    if (updatePromotionDto.startDate && updatePromotionDto.endDate) {
      if (
        new Date(updatePromotionDto.startDate) >=
        new Date(updatePromotionDto.endDate)
      ) {
        throw new BadRequestException('Start date must be before end date');
      }
    }
    const updatedPromotion = await this.promotionModel
      .findByIdAndUpdate(id, updatePromotionDto, { new: true })
      .exec();
    if (!updatedPromotion) {
      throw new NotFoundException(`Promotion with ID ${id} not found`);
    }
    return updatedPromotion;
  }

  async remove(id: string): Promise<Promotion> {
    const promotion = await this.promotionModel.findById(id).exec();
    if (!promotion) {
      throw new NotFoundException(`Promotion with ID ${id} not found`);
    }
    promotion.isDeleted = true;
    return promotion.save();
  }

  @Cron(CronExpression.EVERY_5_MINUTES)
  async updatePromotionStatus(): Promise<void> {
    const now = new Date();

    const activateResult = await this.promotionModel
      .updateMany(
        {
          startDate: { $lte: now },
          endDate: { $gte: now },
          isActive: false,
          isDeleted: false,
        },
        { $set: { isActive: true } },
      )
      .exec();
    if (activateResult.modifiedCount > 0) {
      this.logger.log(
        `Activated ${activateResult.modifiedCount} promotion(s).`,
      );
    }

    const deactivateResult = await this.promotionModel
      .updateMany(
        {
          $or: [{ endDate: { $lt: now } }, { startDate: { $gt: now } }],
          isActive: true,
          isDeleted: false,
        },
        { $set: { isActive: false } },
      )
      .exec();
    if (deactivateResult.modifiedCount > 0) {
      this.logger.log(
        `Deactivated ${deactivateResult.modifiedCount} promotion(s).`,
      );
    }
  }
}
