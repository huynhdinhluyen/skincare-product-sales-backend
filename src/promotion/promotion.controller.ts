import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { PromotionService } from './promotion.service';
import { CreatePromotionDto } from './dto/request/create-promotion.dto';
import { UpdatePromotionDto } from './dto/request/update-promotion.dto';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from 'src/auth/guards/role.guards';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { Role } from 'src/auth/enums/role.enum';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { PromotionDto } from './dto/response/promotion.dto';

@ApiTags('Promotions')
@ApiBearerAuth()
@Controller('promotions')
export class PromotionController {
  constructor(private readonly promotionService: PromotionService) {}

  @Post()
  @UseGuards(AuthGuard(), RolesGuard)
  @Roles(Role.MANAGER)
  @ApiOperation({
    summary: 'Create promotion',
    description: 'Creates a new promotion with discount rate and date range',
  })
  @ApiBody({ type: CreatePromotionDto })
  @ApiResponse({
    status: 201,
    description: 'Promotion created successfully',
    type: PromotionDto,
  })
  @ApiResponse({
    status: 400,
    description:
      'Invalid promotion data (e.g., start date must be before end date)',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - requires MANAGER role',
  })
  create(@Body() createPromotionDto: CreatePromotionDto) {
    return this.promotionService.create(createPromotionDto);
  }

  @Get()
  @ApiOperation({
    summary: 'Get all promotions',
    description: 'Retrieves all active promotions',
  })
  @ApiResponse({
    status: 200,
    description: 'Promotions retrieved successfully',
    type: [PromotionDto],
  })
  findAll() {
    return this.promotionService.findAll();
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get promotion by ID',
    description: 'Retrieves promotion details by ID',
  })
  @ApiParam({ name: 'id', description: 'Promotion ID' })
  @ApiResponse({
    status: 200,
    description: 'Promotion retrieved successfully',
    type: PromotionDto,
  })
  @ApiResponse({ status: 404, description: 'Promotion not found' })
  findOne(@Param('id') id: string) {
    return this.promotionService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(AuthGuard(), RolesGuard)
  @Roles(Role.MANAGER)
  @ApiOperation({
    summary: 'Update promotion',
    description: 'Updates an existing promotion',
  })
  @ApiParam({ name: 'id', description: 'Promotion ID' })
  @ApiBody({ type: UpdatePromotionDto })
  @ApiResponse({
    status: 200,
    description: 'Promotion updated successfully',
    type: PromotionDto,
  })
  @ApiResponse({ status: 400, description: 'Invalid promotion data' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - requires MANAGER role',
  })
  @ApiResponse({ status: 404, description: 'Promotion not found' })
  update(
    @Param('id') id: string,
    @Body() updatePromotionDto: UpdatePromotionDto,
  ) {
    return this.promotionService.update(id, updatePromotionDto);
  }

  @Delete(':id')
  @UseGuards(AuthGuard(), RolesGuard)
  @Roles(Role.MANAGER)
  @ApiOperation({
    summary: 'Delete promotion',
    description: 'Soft deletes a promotion by marking it as inactive',
  })
  @ApiParam({ name: 'id', description: 'Promotion ID' })
  @ApiResponse({
    status: 200,
    description: 'Promotion deleted successfully',
    type: PromotionDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - requires MANAGER role',
  })
  @ApiResponse({ status: 404, description: 'Promotion not found' })
  remove(@Param('id') id: string) {
    return this.promotionService.remove(id);
  }
}
