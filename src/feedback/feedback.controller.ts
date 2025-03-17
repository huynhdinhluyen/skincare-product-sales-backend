import {
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  NotFoundException,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../auth/enums/role.enum';

import { FeedbackService } from './feedback.service';
import { CreateFeedbackDto } from './dto/create-feedback.dto';
import { UpdateFeedbackDto } from './dto/update-feedback.dto';
import { ReplyFeedbackDto } from './dto/reply-feedback.dto';
import { GetFeedbackFilterDto } from './dto/filter/feedback-filter.dto';

@ApiTags('Feedbacks')
@Controller('feedbacks')
export class FeedbackController {
  constructor(private readonly feedbackService: FeedbackService) {}

  @Post()
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Create product feedback',
    description: 'Submit a rating and review for a product',
  })
  @ApiResponse({
    status: 201,
    description: 'Feedback created successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Product not found',
  })
  @ApiResponse({
    status: 409,
    description: 'User has already provided feedback for this product',
  })
  async createFeedback(
    @Req() req,
    @Body() createFeedbackDto: CreateFeedbackDto,
  ) {
    const userId = req.user.id;
    return await this.feedbackService.createFeedback(userId, createFeedbackDto);
  }

  @Post(':id/reply')
  @UseGuards(AuthGuard('jwt'))
  @Roles(Role.MANAGER, Role.STAFF)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Reply to customer feedback',
    description: 'Staff and managers can reply to customer feedback',
  })
  @ApiParam({
    name: 'id',
    description: 'ID of the feedback to reply to',
  })
  @ApiResponse({
    status: 200,
    description: 'Reply added successfully',
  })
  async replyToFeedback(
    @Req() req,
    @Param('id') id: string,
    @Body() replyFeedbackDto: ReplyFeedbackDto,
  ) {
    const staffId = req.user.id;
    return await this.feedbackService.addReplyToFeedback(
      id,
      staffId,
      replyFeedbackDto.reply,
    );
  }

  @Get('product/:productId')
  @ApiOperation({
    summary: 'Get product feedback',
    description:
      'Retrieves all feedback for a specific product with filtering and sorting options',
  })
  @ApiParam({
    name: 'productId',
    description: 'ID of the product to get feedback for',
  })
  async getProductFeedback(
    @Param('productId') productId: string,
    @Query() filterDto: GetFeedbackFilterDto,
  ) {
    return await this.feedbackService.getProductFeedback(productId, filterDto);
  }

  @Patch(':id')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Update feedback',
    description:
      'Update rating or review content for previously submitted feedback',
  })
  @ApiParam({
    name: 'id',
    description: 'ID of the feedback to update',
  })
  @ApiResponse({
    status: 200,
    description: 'Feedback updated successfully',
  })
  @ApiResponse({
    status: 403,
    description: 'User is not authorized to update this feedback',
  })
  @ApiResponse({
    status: 404,
    description: 'Feedback not found',
  })
  async updateFeedback(
    @Req() req,
    @Param('id') id: string,
    @Body() updateFeedbackDto: UpdateFeedbackDto,
  ) {
    const userId = req.user.id;
    const feedback = await this.feedbackService.getFeedbackById(id);

    if (!feedback) {
      throw new NotFoundException('Feedback not found');
    }

    // Check if user is the author of the feedback
    if (
      feedback.author.toString() !== userId &&
      req.user.role !== Role.MANAGER
    ) {
      throw new ForbiddenException(
        'You are not authorized to update this feedback',
      );
    }

    return await this.feedbackService.updateFeedback(id, updateFeedbackDto);
  }

  @Delete(':id')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Delete feedback',
    description: 'Soft-delete feedback (mark as deleted)',
  })
  @ApiParam({
    name: 'id',
    description: 'ID of the feedback to delete',
  })
  @ApiResponse({
    status: 200,
    description: 'Feedback deleted successfully',
  })
  @ApiResponse({
    status: 403,
    description: 'User is not authorized to delete this feedback',
  })
  @ApiResponse({
    status: 404,
    description: 'Feedback not found',
  })
  async deleteFeedback(@Req() req, @Param('id') id: string) {
    const userId = req.user.id;
    const feedback = await this.feedbackService.getFeedbackById(id);

    if (!feedback) {
      throw new NotFoundException('Feedback not found');
    }

    if (
      feedback.author.toString() !== userId &&
      req.user.role !== Role.MANAGER
    ) {
      throw new ForbiddenException(
        'You are not authorized to delete this feedback',
      );
    }

    return await this.feedbackService.deleteFeedback(id);
  }
}
