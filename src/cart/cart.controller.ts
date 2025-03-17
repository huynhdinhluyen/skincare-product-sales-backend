import { AddToCartDto } from './dto/add-to-cart.dto';
import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import { CartService } from './cart.service';
import { UpdateCartDto } from './dto/update-cart.dto';
import { AuthGuard } from '@nestjs/passport';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { Role } from 'src/auth/enums/role.enum';
import { RolesGuard } from 'src/auth/guards/role.guards';
import { ApiBearerAuth, ApiParam, ApiTags } from '@nestjs/swagger';

@ApiTags('Cart')
@ApiBearerAuth()
@Controller('carts')
export class CartController {
  constructor(private readonly cartService: CartService) {}

  @Post()
  @Roles(Role.CUSTOMER)
  @UseGuards(AuthGuard())
  async addToCart(@Body() addToCartDto: AddToCartDto) {
    return this.cartService.addToCart(addToCartDto);
  }

  @Get(':userId')
  @Roles(Role.CUSTOMER)
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @ApiParam({ name: 'userId', description: 'User ID' })
  async getCart(@Param('userId') userId: string) {
    return this.cartService.getCart(userId);
  }

  @Put(':userId/items/:productId')
  @Roles(Role.CUSTOMER)
  @UseGuards(AuthGuard(), RolesGuard)
  async updateFromCart(
    @Param('userId') userId: string,
    @Param('productId') productId: string,
    @Body() updateCartDto: UpdateCartDto,
  ) {
    return this.cartService.updateItemQuantity(
      userId,
      productId,
      updateCartDto,
    );
  }

  @Delete(':userId/items/:productId')
  @Roles(Role.CUSTOMER)
  @UseGuards(AuthGuard(), RolesGuard)
  async removeFromCart(
    @Param('userId') userId: string,
    @Param('productId') productId: string,
  ) {
    return this.cartService.removeFromCart(userId, productId);
  }
}
