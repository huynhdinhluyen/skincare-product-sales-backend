import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { CreateOrderDto } from './dto/create-order.dto';
import { OrderService } from './order.service';
import { AuthGuard } from '@nestjs/passport';
import { Role } from 'src/auth/enums/role.enum';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { RolesGuard } from 'src/auth/guards/role.guards';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';
import { OrderFilterDto } from './dto/filter/order-filter.dto';

@ApiTags('Orders')
@ApiBearerAuth()
@Controller('orders')
export class OrderController {
  constructor(private readonly orderService: OrderService) {}

  @Post()
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({ summary: 'Create a new order' })
  @ApiResponse({ status: 201, description: 'Order created successfully' })
  @ApiResponse({
    status: 400,
    description: 'Invalid order data or insufficient stock',
  })
  async createOrder(@Body() createOrderDto: CreateOrderDto, @Req() req) {
    const user = req.user;

    if (
      user.role !== Role.MANAGER &&
      user.role !== Role.STAFF &&
      createOrderDto.userId !== user.id
    ) {
      throw new Error('You can only create orders for your own account');
    }

    return await this.orderService.createOrder(createOrderDto);
  }

  @Get()
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({
    summary: 'Get all orders with filtering and pagination',
    description: 'Retrieve orders with optional filtering by status and user',
  })
  @ApiResponse({ status: 200, description: 'Orders retrieved successfully' })
  async getAllOrders(@Query() filterDto: OrderFilterDto, @Req() req) {
    const user = req.user;
    if (user.role !== Role.MANAGER && user.role !== Role.STAFF) {
      filterDto.userId = user.id;
    }
    return this.orderService.getAllOrders(filterDto);
  }

  @Get(':orderId')
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({ summary: 'Get order details by ID' })
  @ApiParam({ name: 'orderId', description: 'Order ID' })
  @ApiResponse({
    status: 200,
    description: 'Order details retrieved successfully',
  })
  @ApiResponse({ status: 404, description: 'Order not found' })
  async getOrder(@Param('orderId') orderId: string, @Req() req) {
    const user = req.user;
    const order = await this.orderService.getOrderById(orderId);

    const orderUserId = order.user
      ? typeof order.user === 'object' && order.user._id
        ? order.user._id.toString()
        : order.user.toString()
      : null;

    if (
      user.role !== Role.MANAGER &&
      user.role !== Role.STAFF &&
      orderUserId !== user.id
    ) {
      throw new BadRequestException('You can only view your own orders');
    }

    return order;
  }

  @Patch(':orderId/status')
  @Roles(Role.MANAGER, Role.STAFF)
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @ApiOperation({
    summary: 'Update order status',
    description: 'Progress the order through the fulfillment process',
  })
  @ApiParam({ name: 'orderId', description: 'Order ID' })
  @ApiResponse({
    status: 200,
    description: 'Order status updated successfully',
  })
  @ApiResponse({ status: 400, description: 'Invalid status transition' })
  async updateOrderStatus(
    @Param('orderId') orderId: string,
    @Body() updateStatusDto: UpdateOrderStatusDto,
  ) {
    return await this.orderService.updateOrderStatus(
      orderId,
      updateStatusDto.status,
    );
  }

  @Delete(':orderId')
  @Roles(Role.MANAGER, Role.STAFF)
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @ApiOperation({ summary: 'Delete an order' })
  @ApiParam({ name: 'orderId', description: 'Order ID' })
  @ApiResponse({ status: 200, description: 'Order deleted successfully' })
  @ApiResponse({ status: 400, description: 'Cannot delete order in process' })
  async deleteOrder(@Param('orderId') orderId: string) {
    return await this.orderService.deleteOrder(orderId);
  }
}
