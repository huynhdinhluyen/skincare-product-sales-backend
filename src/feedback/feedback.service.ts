import {
  BadRequestException,
  ConflictException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Feedback, FeedbackDocument } from './schema/feedback.schema';
import { Product, ProductDocument } from '../product/schema/product.schema';
import { CreateFeedbackDto } from './dto/create-feedback.dto';
import { UpdateFeedbackDto } from './dto/update-feedback.dto';
import {
  FeedbackSortOption,
  GetFeedbackFilterDto,
} from './dto/filter/feedback-filter.dto';

@Injectable()
export class FeedbackService {
  private readonly logger = new Logger(FeedbackService.name);

  constructor(
    @InjectModel(Feedback.name) private feedbackModel: Model<FeedbackDocument>,
    @InjectModel(Product.name) private productModel: Model<ProductDocument>,
  ) {}

  async createFeedback(
    userId: string,
    createFeedbackDto: CreateFeedbackDto,
  ): Promise<Feedback> {
    const { productId, rating, content } = createFeedbackDto;

    try {
      // Check if product exists
      const product = await this.productModel.findById(productId);
      if (!product) {
        throw new NotFoundException(`Product with ID ${productId} not found`);
      }

      // Check if user already gave feedback to this product by checking the product's feedback array
      if (product.feedback && product.feedback.length > 0) {
        const existingFeedbacks = await this.feedbackModel.find({
          _id: { $in: product.feedback },
          author: userId,
          isDeleted: false,
        });

        if (existingFeedbacks.length > 0) {
          throw new ConflictException(
            'You have already provided feedback for this product',
          );
        }
      }

      // Create the feedback
      const newFeedback = new this.feedbackModel({
        author: userId,
        rating,
        content,
      });

      const savedFeedback = await newFeedback.save();

      // Update product with feedback reference
      await this.productModel.findByIdAndUpdate(productId, {
        $push: { feedback: savedFeedback._id },
      });

      // Recalculate product rating
      await this.updateProductRating(productId);

      return savedFeedback;
    } catch (error) {
      this.logger.error(
        `Failed to create feedback: ${error.message}`,
        error.stack,
      );
      if (
        error instanceof NotFoundException ||
        error instanceof ConflictException
      ) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to create feedback');
    }
  }

  async addReplyToFeedback(
    feedbackId: string,
    staffId: string,
    reply: string,
  ): Promise<Feedback> {
    try {
      const feedback = await this.feedbackModel.findById(feedbackId);
      if (!feedback) {
        throw new NotFoundException(`Feedback with ID ${feedbackId} not found`);
      }

      feedback.staffReply = reply;
      feedback.repliedAt = new Date();
      feedback.repliedBy = staffId as any;

      return feedback.save();
    } catch (error) {
      this.logger.error(`Failed to add reply: ${error.message}`, error.stack);
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to add reply to feedback');
    }
  }

  async getFeedbackById(id: string): Promise<FeedbackDocument | null> {
    try {
      return this.feedbackModel.findById(id).exec();
    } catch (error) {
      this.logger.error(
        `Failed to get feedback by ID: ${error.message}`,
        error.stack,
      );
      throw new InternalServerErrorException('Failed to fetch feedback');
    }
  }

  async getProductFeedback(productId: string, filterDto: GetFeedbackFilterDto) {
    try {
      const { page = 1, limit = 10, rating, sortBy } = filterDto;
      const skip = (page - 1) * limit;

      // First, get the product to access its feedback array
      const product = await this.productModel.findById(productId);
      if (!product) {
        throw new NotFoundException(`Product with ID ${productId} not found`);
      }

      if (!product.feedback || product.feedback.length === 0) {
        return {
          data: [],
          totalCount: 0,
          totalPages: 0,
          currentPage: page,
        };
      }

      // Base query to find non-deleted feedback IDs that are in the product's feedback array
      const query: any = {
        _id: { $in: product.feedback },
        isDeleted: false,
      };

      // Filter by rating if provided
      if (rating !== undefined) {
        query.rating = rating;
      }

      // Build sort options
      let sort: any = { createdAt: -1 }; // Default: newest first

      if (sortBy) {
        switch (sortBy) {
          case FeedbackSortOption.OLDEST:
            sort = { createdAt: 1 };
            break;
          case FeedbackSortOption.HIGHEST_RATING:
            sort = { rating: -1, createdAt: -1 };
            break;
          case FeedbackSortOption.LOWEST_RATING:
            sort = { rating: 1, createdAt: -1 };
            break;
        }
      }

      // Execute queries with pagination
      const [feedback, totalCount] = await Promise.all([
        this.feedbackModel
          .find(query)
          .skip(skip)
          .limit(limit)
          .populate('author', 'username fullName')
          .populate('repliedBy', 'username fullName')
          .sort(sort)
          .exec(),
        this.feedbackModel.countDocuments(query),
      ]);

      return {
        data: feedback,
        totalCount,
        totalPages: Math.ceil(totalCount / limit),
        currentPage: page,
      };
    } catch (error) {
      this.logger.error(
        `Failed to get product feedback: ${error.message}`,
        error.stack,
      );
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException(
        'Failed to fetch product feedback',
      );
    }
  }

  async updateFeedback(
    id: string,
    updateFeedbackDto: UpdateFeedbackDto,
  ): Promise<Feedback> {
    try {
      const feedback = await this.feedbackModel.findById(id);
      if (!feedback) {
        throw new NotFoundException(`Feedback with ID ${id} not found`);
      }

      // Update only allowed fields
      if (updateFeedbackDto.rating !== undefined) {
        feedback.rating = updateFeedbackDto.rating;
      }

      if (updateFeedbackDto.content) {
        feedback.content = updateFeedbackDto.content;
      }

      const updatedFeedback = await feedback.save();

      // Find product containing this feedback to update ratings
      const product = await this.productModel.findOne({ feedback: id });
      if (product) {
        await this.updateProductRating(product._id.toString());
      }

      return updatedFeedback;
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      this.logger.error(
        `Failed to update feedback: ${error.message}`,
        error.stack,
      );
      throw new InternalServerErrorException('Failed to update feedback');
    }
  }

  async deleteFeedback(id: string): Promise<void> {
    try {
      const feedback = await this.feedbackModel.findById(id);
      if (!feedback) {
        throw new NotFoundException(`Feedback with ID ${id} not found`);
      }

      const product = await this.productModel.findOne({ feedback: id });

      feedback.isDeleted = true;
      await feedback.save();

      if (product) {
        await this.productModel.findByIdAndUpdate(product._id, {
          $pull: { feedback: id },
        });

        await this.updateProductRating(product._id.toString());
      }
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error(
        `Failed to delete feedback: ${error.message}`,
        error.stack,
      );
      throw new InternalServerErrorException('Failed to delete feedback');
    }
  }

  private async updateProductRating(productId: string): Promise<void> {
    try {
      const product = await this.productModel.findById(productId);
      if (!product) {
        throw new NotFoundException(`Product with ID ${productId} not found`);
      }

      const feedbackList = await this.feedbackModel.find({
        _id: { $in: product.feedback },
        isDeleted: false,
      });

      const count = feedbackList.length;
      let sum = 0;

      feedbackList.forEach((item) => {
        sum += item.rating;
      });

      const averageRating = count > 0 ? sum / count : 0;

      await this.productModel.findByIdAndUpdate(productId, {
        $set: {
          averageRating: Math.round(averageRating * 10) / 10, // Round to 1 decimal place
          reviewCount: count,
        },
      });
    } catch (error) {
      this.logger.error(
        `Failed to update product rating: ${error.message}`,
        error.stack,
      );
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to update product rating');
    }
  }
}
