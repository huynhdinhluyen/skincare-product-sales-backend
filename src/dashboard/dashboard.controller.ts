import {
  Controller,
  DefaultValuePipe,
  Get,
  ParseIntPipe,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../auth/enums/role.enum';
import { RolesGuard } from '../auth/guards/role.guards';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { DashboardService } from './dashboard.service';

@ApiTags('Dashboard')
@ApiBearerAuth()
@Controller('dashboard')
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Roles(Role.MANAGER, Role.STAFF)
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('sales-summary')
  @ApiOperation({
    summary: 'Get sales summary',
    description: 'Retrieves sales data for a specified number of days',
  })
  @ApiQuery({
    name: 'days',
    required: false,
    description: 'Number of past days to include in the report (default: 30)',
  })
  @ApiResponse({
    status: 200,
    description: 'Sales summary retrieved successfully',
  })
  async getSalesSummary(
    @Query('days', new DefaultValuePipe(30), ParseIntPipe) days: number,
  ) {
    return await this.dashboardService.getSalesSummary(days);
  }

  @Get('top-selling-products')
  @ApiOperation({
    summary: 'Get top selling products',
    description: 'Retrieves the best selling products',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    description: 'Number of products to return (default: 10)',
  })
  @ApiResponse({
    status: 200,
    description: 'Top selling products retrieved successfully',
  })
  async getTopSellingProducts(
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
  ) {
    return await this.dashboardService.getTopSellingProducts(limit);
  }

  @Get('order-status-distribution')
  @ApiOperation({
    summary: 'Get order status distribution',
    description: 'Retrieves the count of orders grouped by status',
  })
  @ApiResponse({
    status: 200,
    description: 'Order status distribution retrieved successfully',
  })
  async getOrderStatusDistribution() {
    return await this.dashboardService.getOrderStatusDistribution();
  }

  @Get('customer-growth')
  @ApiOperation({
    summary: 'Get customer growth',
    description: 'Retrieves customer registration data over time',
  })
  @ApiQuery({
    name: 'months',
    required: false,
    description: 'Number of past months to include in the report (default: 6)',
  })
  @ApiResponse({
    status: 200,
    description: 'Customer growth data retrieved successfully',
  })
  async getCustomerGrowth(
    @Query('months', new DefaultValuePipe(6), ParseIntPipe) months: number,
  ) {
    return await this.dashboardService.getCustomerGrowth(months);
  }

  @Get('revenue-trends')
  @ApiOperation({
    summary: 'Get revenue trends',
    description:
      'Retrieves revenue trends by daily, weekly, or monthly periods',
  })
  @ApiQuery({
    name: 'period',
    required: false,
    description: 'Time period (daily, weekly, monthly) (default: monthly)',
    enum: ['daily', 'weekly', 'monthly'],
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    description: 'Number of periods to return (default: 12)',
  })
  @ApiResponse({
    status: 200,
    description: 'Revenue trends retrieved successfully',
  })
  async getRevenueTrends(
    @Query('period', new DefaultValuePipe('monthly'))
    period: 'daily' | 'weekly' | 'monthly',
    @Query('limit', new DefaultValuePipe(12), ParseIntPipe) limit: number,
  ) {
    return await this.dashboardService.getRevenueTrends(period, limit);
  }

  @Get('product-analytics')
  @ApiOperation({
    summary: 'Get product analytics',
    description: 'Retrieves product analytics including view count and ratings',
  })
  @ApiResponse({
    status: 200,
    description: 'Product analytics retrieved successfully',
  })
  async getProductAnalytics() {
    return await this.dashboardService.getProductAnalytics();
  }

  @Get('category-performance')
  @ApiOperation({
    summary: 'Get category performance',
    description: 'Retrieves sales performance data grouped by product category',
  })
  @ApiResponse({
    status: 200,
    description: 'Category performance data retrieved successfully',
  })
  async getCategoryPerformance() {
    return await this.dashboardService.getCategoryPerformance();
  }

  @Get('customer-spending-analysis')
  @ApiOperation({
    summary: 'Get customer spending analysis',
    description: 'Retrieves analysis of customer spending patterns',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    description: 'Number of top customers to analyze (default: 10)',
  })
  @ApiResponse({
    status: 200,
    description: 'Customer spending analysis retrieved successfully',
  })
  async getCustomerSpendingAnalysis(
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
  ) {
    return await this.dashboardService.getCustomerSpendingAnalysis(limit);
  }

  @Get('summary')
  @ApiOperation({
    summary: 'Get dashboard summary',
    description: 'Retrieves a summary of key metrics for the dashboard',
  })
  @ApiResponse({
    status: 200,
    description: 'Dashboard summary retrieved successfully',
  })
  async getDashboardSummary() {
    return await this.dashboardService.getDashboardSummary();
  }
}
