import { ApiProperty } from '@nestjs/swagger';
import { RevenueSummaryDto } from './revenue-summary.dto';
import { OrdersSummaryDto } from './orders-summary.dto';
import { CustomersSummaryDto } from './customers-summary.dto';
import { ProductsSummaryDto } from './product-summary.dto';

export class DashboardSummaryDto {
  @ApiProperty({ type: RevenueSummaryDto })
  revenue: RevenueSummaryDto;

  @ApiProperty({ type: OrdersSummaryDto })
  orders: OrdersSummaryDto;

  @ApiProperty({ type: CustomersSummaryDto })
  customers: CustomersSummaryDto;

  @ApiProperty({ type: ProductsSummaryDto })
  products: ProductsSummaryDto;
}
