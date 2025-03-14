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
import { CreateOrderDto } from './dto/create-order.dto';
import { OrderService } from './order.service';
import { Order_Status } from './enums/order-status.enum';
import { AuthGuard } from '@nestjs/passport';
import { Role } from 'src/auth/enums/role.enum';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { RolesGuard } from 'src/auth/guards/role.guards';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

@ApiTags('Orders')
@ApiBearerAuth()
@Controller('orders')
export class OrderController {
  constructor(private readonly orderService: OrderService) {}

  @Post()
  @UseGuards(AuthGuard())
  async createOrder(@Body() createOrderDto: CreateOrderDto) {
    return this.orderService.createOrder(createOrderDto);
  }

  @Get('user/:userId')
  @UseGuards(AuthGuard())
  async getOrders(@Param('userId') userId: string) {
    return this.orderService.getOrders(userId);
  }

  @Get(':orderId')
  @UseGuards(AuthGuard())
  async getOrder(@Param('orderId') orderId: string) {
    return this.orderService.getOrderById(orderId);
  }

  @Get('status/:status')
  @UseGuards(AuthGuard())
  async getOrderByStatus(@Param('status') status: Order_Status) {
    return this.orderService.getOrderByStatus(status);
  }

  @Patch(':orderId/status')
  @Roles(Role.MANAGER, Role.STAFF)
  @UseGuards(AuthGuard(), RolesGuard)
  async updateOrderStatus(
    @Param('orderId') orderId: string,
    @Body('status') status: Order_Status,
  ) {
    return this.orderService.updateOrderStatus(orderId, status);
  }

  @Delete(':orderId')
  @Roles(Role.MANAGER, Role.STAFF)
  @UseGuards(AuthGuard(), RolesGuard)
  async deleteOrder(@Param('orderId') orderId: string) {
    return this.orderService.deleteOrder(orderId);
  }
}
