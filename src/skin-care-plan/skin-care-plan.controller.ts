import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { SkinCarePlanService } from './skin-care-plan.service';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { CreateSkinCarePlanDto } from './dto/request/create-skin-care-plan.dto';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../auth/guards/role.guards';
import { Role } from '../auth/enums/role.enum';
import { Roles } from '../auth/decorators/roles.decorator';
import { UpdateSkinCarePlanDto } from './dto/request/update-skin-care-plan.dto';
import { SkinType } from './enum/skin-type.enum';

@ApiTags('Skin Care Plans')
@Controller('skincare-plans')
export class SkinCarePlanController {
  constructor(private readonly skinCarePlanService: SkinCarePlanService) {}

  @Post()
  @ApiBearerAuth()
  @Roles(Role.MANAGER)
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @ApiOperation({
    summary: 'Create a new skin care plan',
    description:
      'Creates a new skin care routine plan for a specific skin type',
  })
  @ApiBody({ type: CreateSkinCarePlanDto })
  @ApiResponse({
    status: 201,
    description: 'Skin care plan created successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - e.g. duplicate plan for this skin type',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - requires MANAGER role',
  })
  async createSkinCarePlan(@Body() createDto: CreateSkinCarePlanDto) {
    const plan = await this.skinCarePlanService.createSkinCarePlan(createDto);
    return {
      success: true,
      data: plan,
      message: 'Skin care plan created successfully',
    };
  }

  @Get(':skinType')
  @ApiOperation({
    summary: 'Get skin care plan by skin type',
    description:
      'Retrieves the recommended skin care plan for a specific skin type',
  })
  @ApiParam({
    name: 'skinType',
    description:
      'The skin type code in uppercase English (e.g., "OILY", "DRY")',
    enum: SkinType,
    example: 'OILY',
  })
  @ApiResponse({
    status: 200,
    description: 'Skin care plan retrieved successfully',
  })
  @ApiResponse({ status: 404, description: 'Skin care plan not found' })
  async getSkinCarePlan(@Param('skinType') skinType: string) {
    const plan =
      await this.skinCarePlanService.getSkinCarePlanBySkinType(skinType);
    return {
      success: true,
      data: plan,
      message: 'Skin care plan retrieved successfully',
    };
  }

  @Get(':skinType/products')
  @ApiOperation({
    summary: 'Get recommended products for skin type',
    description:
      'Retrieves products recommended for a specific skin type and optional care step',
  })
  @ApiParam({
    name: 'skinType',
    description:
      'The skin type code in uppercase English (e.g., "OILY", "DRY")',
    enum: SkinType,
    example: 'OILY',
  })
  @ApiQuery({
    name: 'step',
    required: false,
    description: 'Optional skin care step (e.g., "cleansing", "toning")',
  })
  @ApiQuery({ name: 'page', required: false, description: 'Page number' })
  @ApiQuery({
    name: 'limit',
    required: false,
    description: 'Number of items per page',
  })
  @ApiResponse({
    status: 200,
    description: 'Recommended products retrieved successfully',
  })
  async getRecommendedProducts(
    @Param('skinType') skinType: string,
    @Query('step') step?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    const result = await this.skinCarePlanService.getRecommendedProducts(
      skinType,
      step,
      page || 1,
      limit || 10,
    );

    return {
      success: true,
      data: result.data,
      totalCount: result.totalCount,
      totalPages: result.totalPages,
      message: 'Recommended products retrieved successfully',
    };
  }

  @Patch(':id')
  @ApiBearerAuth()
  @Roles(Role.MANAGER)
  @UseGuards(AuthGuard(), RolesGuard)
  @ApiOperation({
    summary: 'Update a skin care plan',
    description: 'Updates an existing skin care plan',
  })
  @ApiParam({ name: 'id', description: 'Skin care plan ID' })
  @ApiBody({ type: UpdateSkinCarePlanDto })
  @ApiResponse({
    status: 200,
    description: 'Skin care plan updated successfully',
  })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - requires MANAGER role',
  })
  @ApiResponse({ status: 404, description: 'Skin care plan not found' })
  async updateSkinCarePlan(
    @Param('id') id: string,
    @Body() updateDto: UpdateSkinCarePlanDto,
  ) {
    const plan = await this.skinCarePlanService.updateSkinCarePlan(
      id,
      updateDto,
    );
    return {
      success: true,
      data: plan,
      message: 'Skin care plan updated successfully',
    };
  }
}
