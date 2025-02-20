import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { SkinCarePlanService } from './skin-care-plan.service';
import { CreateSkinCarePlanDto } from './dto/create-skin-care-plan.dto';
import { UpdateSkinCarePlanDto } from './dto/update-skin-care-plan.dto';
import { CompareProductsDto } from 'src/product/dto/compare-product.dto';

@Controller('skin-care-plan')
export class SkinCarePlanController {
  constructor(private readonly skinCarePlanService: SkinCarePlanService) {}

  @Get('skin-care-plan/:skinType')
  async getSkinCarePlan(@Param('skinType') skinType: string) {
    const plan = await this.skinCarePlanService.getSkinCarePlan(
      skinType as any,
    );
    return {
      success: true,
      data: plan,
      message: 'Skin care plan retrieved successfully',
    };
  }

  @Get('recommendations/:skinType')
  async getRecommendedProducts(
    @Param('skinType') skinType: string,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
  ) {
    const result = await this.skinCarePlanService.getRecommendedProducts(
      skinType as any,
      page,
      limit,
    );
    return {
      success: true,
      data: result.data,
      totalCount: result.totalCount,
      totalPages: result.totalPages,
      message: 'Recommended products retrieved successfully',
    };
  }

  @Post('compare')
  async compareProducts(@Body() compareDto: CompareProductsDto) {
    const products = await this.skinCarePlanService.compareProducts(compareDto);
    return {
      success: true,
      data: products,
      message: 'Products compared successfully',
    };
  }

  @Post()
  create(@Body() createSkinCarePlanDto: CreateSkinCarePlanDto) {
    return this.skinCarePlanService.create(createSkinCarePlanDto);
  }

  @Get()
  findAll() {
    return this.skinCarePlanService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.skinCarePlanService.findOne(+id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateSkinCarePlanDto: UpdateSkinCarePlanDto,
  ) {
    return this.skinCarePlanService.update(+id, updateSkinCarePlanDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.skinCarePlanService.remove(+id);
  }
}
