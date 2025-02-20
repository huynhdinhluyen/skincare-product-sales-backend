import { Body, Controller, Param, Patch, UseGuards } from '@nestjs/common';
import { TransactionService } from './transaction.service';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from 'src/auth/guards/role.guards';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { Role } from 'src/auth/enums/role.enum';
import { Payment_Status } from './enums/transaction-status.enum';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

@ApiTags('Transaction')
@ApiBearerAuth()
@Controller('transaction')
export class TransactionController {
  constructor(private readonly transactionService: TransactionService) {}

  @Patch(':transactionId/status')
  @Roles(Role.STAFF, Role.MANAGER)
  @UseGuards(AuthGuard(), RolesGuard)
  async updateTransactionStatus(
    @Param('transactionId') orderId: string,
    @Body('status') status: Payment_Status,
  ) {
    return this.transactionService.updateTransactionStatus(orderId, status);
  }
}
