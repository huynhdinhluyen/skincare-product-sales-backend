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
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { GetUser } from '../auth/decorators/user.decorator';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';

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
  async createOrder(@Body() createOrderDto: CreateOrderDto, @GetUser() user) {
    if (
      user.role !== Role.MANAGER &&
      user.role !== Role.STAFF &&
      createOrderDto.userId !== user.id
    ) {
      throw new Error('You can only create orders for your own account');
    }

    return {
      success: true,
      data: await this.orderService.createOrder(createOrderDto),
      message: 'Order created successfully',
    };
  }

  @Get('user/:userId')
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({ summary: 'Get all orders for a user' })
  @ApiParam({ name: 'userId', description: 'User ID' })
  @ApiResponse({ status: 200, description: 'Orders retrieved successfully' })
  async getOrders(@Param('userId') userId: string, @GetUser() user) {
    if (
      user.role !== Role.MANAGER &&
      user.role !== Role.STAFF &&
      userId !== user.id
    ) {
      throw new Error('You can only view your own orders');
    }

    return {
      success: true,
      data: await this.orderService.getOrders(userId),
      message: 'Orders retrieved successfully',
    };
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
  async getOrder(@Param('orderId') orderId: string, @GetUser() user) {
    const order = await this.orderService.getOrderById(orderId);

    // Fix the permission check with proper ObjectId handling
    const orderUserId = order.user
      ? typeof order.user === 'object' && order.user._id
        ? order.user._id.toString()
        : order.user.toString()
      : null;

    // Only check permissions for regular users, not staff/managers
    if (
      user.role !== Role.MANAGER &&
      user.role !== Role.STAFF &&
      orderUserId !== user.id
    ) {
      throw new Error('You can only view your own orders');
    }

    return {
      success: true,
      data: order,
      message: 'Order details retrieved successfully',
    };
  }

  @Get('status/:status')
  @Roles(Role.MANAGER, Role.STAFF)
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @ApiOperation({ summary: 'Get all orders by status' })
  @ApiParam({ name: 'status', description: 'Order status' })
  @ApiResponse({ status: 200, description: 'Orders retrieved successfully' })
  async getOrderByStatus(@Param('status') status: Order_Status) {
    return {
      success: true,
      data: await this.orderService.getOrderByStatus(status),
      message: `Orders with status ${status} retrieved successfully`,
    };
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
    return {
      success: true,
      data: await this.orderService.updateOrderStatus(
        orderId,
        updateStatusDto.status,
      ),
      message: `Order status updated to ${updateStatusDto.status}`,
    };
  }

  @Delete(':orderId')
  @Roles(Role.MANAGER, Role.STAFF)
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @ApiOperation({ summary: 'Delete an order' })
  @ApiParam({ name: 'orderId', description: 'Order ID' })
  @ApiResponse({ status: 200, description: 'Order deleted successfully' })
  @ApiResponse({ status: 400, description: 'Cannot delete order in process' })
  async deleteOrder(@Param('orderId') orderId: string) {
    return {
      success: true,
      message: await this.orderService.deleteOrder(orderId),
    };
  }
}
