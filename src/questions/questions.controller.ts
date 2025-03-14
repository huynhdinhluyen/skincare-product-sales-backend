import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import { QuestionsService } from './questions.service';
import { CreateQuestionDto } from './dto/create-questions.dto';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { UpdateQuestionDto } from './dto/update-questions.dto';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../auth/enums/role.enum';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../auth/guards/role.guards';

@ApiTags('Questions')
@ApiBearerAuth()
@Controller('questions')
export class QuestionsController {
  constructor(private readonly questionsService: QuestionsService) {}

  @Post()
  @Roles(Role.MANAGER)
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @ApiOperation({
    summary: 'Create skin type assessment question',
    description:
      'Creates a new question for skin type assessment quiz with options and point values',
  })
  @ApiBody({ type: CreateQuestionDto })
  @ApiResponse({
    status: 201,
    description: 'Question created successfully',
    schema: {
      type: 'object',
      properties: {
        _id: { type: 'string' },
        question: { type: 'string' },
        options: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              option: { type: 'string' },
              point: { type: 'number' },
            },
          },
        },
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Invalid question data' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - requires MANAGER role',
  })
  async createQuestion(@Body() createQuestionDto: CreateQuestionDto) {
    return this.questionsService.createQuestion(createQuestionDto);
  }

  @Get()
  @ApiOperation({
    summary: 'Get all skin type assessment questions',
    description: 'Retrieves all questions for skin type assessment quiz',
  })
  @ApiResponse({
    status: 200,
    description: 'Questions retrieved successfully',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          _id: { type: 'string' },
          question: { type: 'string' },
          options: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                option: { type: 'string' },
                point: { type: 'number' },
              },
            },
          },
        },
      },
    },
  })
  async getQuestions() {
    return this.questionsService.getQuestions();
  }

  @Put(':id')
  @Roles(Role.MANAGER)
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @ApiOperation({
    summary: 'Update skin type assessment question',
    description: 'Updates an existing question for skin type assessment quiz',
  })
  @ApiParam({ name: 'id', description: 'Question ID' })
  @ApiBody({ type: UpdateQuestionDto })
  @ApiResponse({
    status: 200,
    description: 'Question updated successfully',
    schema: {
      type: 'object',
      properties: {
        _id: { type: 'string' },
        question: { type: 'string' },
        options: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              option: { type: 'string' },
              point: { type: 'number' },
            },
          },
        },
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Invalid question data' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - requires MANAGER role',
  })
  @ApiResponse({ status: 404, description: 'Question not found' })
  async updateQuestion(
    @Param('id') id: string,
    @Body() updateQuestionDto: UpdateQuestionDto,
  ) {
    return this.questionsService.updateQuestion(id, updateQuestionDto);
  }

  @Delete(':id')
  @Roles(Role.MANAGER)
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @ApiOperation({
    summary: 'Delete skin type assessment question',
    description:
      'Permanently deletes a question from skin type assessment quiz',
  })
  @ApiParam({ name: 'id', description: 'Question ID' })
  @ApiResponse({ status: 200, description: 'Question deleted successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - requires MANAGER role',
  })
  @ApiResponse({ status: 404, description: 'Question not found' })
  async deleteQuestion(@Param('id') id: string) {
    return this.questionsService.deleteQuestion(id);
  }
}
