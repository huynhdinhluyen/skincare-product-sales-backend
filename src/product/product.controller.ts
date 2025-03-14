import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { ProductService } from './product.service';
import { UpdateProductDto } from './dto/request/update-product.dto';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { Role } from 'src/auth/enums/role.enum';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from 'src/auth/guards/role.guards';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { CreateProductDto } from './dto/request/create-product.dto';
import { ProductFilterDto } from './dto/filter/product-filter.dto';
import { CompareProductsDto } from './dto/request/compare-product.dto';
import { ProductResponseDto } from './dto/response/product.dto';

@ApiTags('Products')
@ApiBearerAuth()
@Controller('products')
export class ProductController {
  constructor(private readonly productService: ProductService) {}

  @Post()
  @Roles(Role.MANAGER)
  @UseGuards(AuthGuard(), RolesGuard)
  @ApiOperation({
    summary: 'Create product',
    description: 'Creates a new skincare product (requires MANAGER role)',
  })
  @ApiResponse({
    status: 201,
    description: 'Product created successfully',
    type: ProductResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Invalid product data' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - requires MANAGER role',
  })
  @ApiResponse({ status: 404, description: 'Category not found' })
  create(@Body() createProductDto: CreateProductDto) {
    return this.productService.create(createProductDto);
  }

  @Get()
  @ApiOperation({
    summary: 'Get products with filters and sorting',
    description:
      'Retrieves products with options for pagination, filtering, sorting, and search',
  })
  @ApiQuery({
    name: 'page',
    description: 'Page number',
    required: false,
    type: Number,
  })
  @ApiQuery({
    name: 'limit',
    description: 'Number of items per page',
    required: false,
    type: Number,
  })
  @ApiQuery({
    name: 'search',
    description: 'Search term for product name or description',
    required: false,
  })
  @ApiQuery({
    name: 'categoryId',
    description: 'Filter by category ID',
    required: false,
  })
  @ApiQuery({
    name: 'minPrice',
    description: 'Minimum price filter',
    required: false,
    type: Number,
  })
  @ApiQuery({
    name: 'maxPrice',
    description: 'Maximum price filter',
    required: false,
    type: Number,
  })
  @ApiQuery({
    name: 'sortBy',
    description: 'Field to sort by (price, name, sold, createdAt)',
    required: false,
  })
  @ApiQuery({
    name: 'sortOrder',
    description: 'Sort order (asc or desc)',
    required: false,
    enum: ['asc', 'desc'],
  })
  @ApiResponse({
    status: 200,
    description: 'Products retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        data: {
          type: 'array',
          items: { $ref: '#/components/schemas/ProductResponseDto' },
        },
        totalCount: { type: 'number' },
        totalPages: { type: 'number' },
      },
    },
  })
  @UsePipes(new ValidationPipe({ transform: true }))
  async findAll(@Query() filterDto: ProductFilterDto) {
    return this.productService.findAll(filterDto);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get product by ID',
    description:
      'Retrieves detailed information about a specific product by its unique identifier',
  })
  @ApiParam({ name: 'id', description: 'Product ID' })
  @ApiResponse({
    status: 200,
    description: 'Product retrieved successfully',
    type: ProductResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Product not found' })
  findOne(@Param('id') id: string) {
    return this.productService.getProductById(id);
  }

  @Patch(':id')
  @Roles(Role.MANAGER)
  @UseGuards(AuthGuard(), RolesGuard)
  @ApiOperation({
    summary: 'Update product',
    description: 'Updates an existing product (requires MANAGER role)',
  })
  @ApiParam({ name: 'id', description: 'Product ID' })
  @ApiResponse({
    status: 200,
    description: 'Product updated successfully',
    type: ProductResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - requires MANAGER role',
  })
  @ApiResponse({ status: 404, description: 'Product not found' })
  update(@Param('id') id: string, @Body() updateProductDto: UpdateProductDto) {
    return this.productService.update(id, updateProductDto);
  }

  @Delete(':id')
  @Roles(Role.MANAGER)
  @UseGuards(AuthGuard(), RolesGuard)
  @ApiOperation({
    summary: 'Delete product',
    description:
      'Soft deletes a product by marking it inactive (requires MANAGER role)',
  })
  @ApiParam({ name: 'id', description: 'Product ID' })
  @ApiResponse({
    status: 200,
    description: 'Product deleted successfully',
    type: ProductResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - requires MANAGER role',
  })
  @ApiResponse({ status: 404, description: 'Product not found' })
  remove(@Param('id') id: string) {
    return this.productService.remove(id);
  }

  @Post('compare')
  @ApiOperation({
    summary: 'Compare products',
    description:
      'Compare 2-4 products side by side with detailed specifications',
  })
  @ApiResponse({
    status: 200,
    description: 'Products compared successfully',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        data: {
          type: 'array',
          items: { $ref: '#/components/schemas/ProductResponseDto' },
        },
        message: { type: 'string' },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid request (must select 2-4 products)',
  })
  @ApiResponse({ status: 404, description: 'One or more products not found' })
  async compareProducts(@Body() compareDto: CompareProductsDto) {
    const comparisonData = await this.productService.compareProducts(
      compareDto.productIds,
    );
    return {
      success: true,
      data: comparisonData,
      message: 'Products compared successfully',
    };
  }
}
