import { Module } from '@nestjs/common';
import { OrderController } from './order.controller';
import { OrderService } from './order.service';
import { MongooseModule } from '@nestjs/mongoose';
import { Product, ProductSchema } from 'src/product/schema/product.schema';
import { Order, OrderSchema } from './schema/order.schema';
import { Payment, PaymentSchema } from 'src/transaction/schema/payment.schema';
import { AuthModule } from 'src/auth/auth.module';
import { CartModule } from '../cart/cart.module';

@Module({
  imports: [
    AuthModule,
    CartModule,
    MongooseModule.forFeature([{ name: Product.name, schema: ProductSchema }]),
    MongooseModule.forFeature([{ name: Order.name, schema: OrderSchema }]),
    MongooseModule.forFeature([{ name: Payment.name, schema: PaymentSchema }]),
  ],
  controllers: [OrderController],
  providers: [OrderService],
  exports: [OrderService],
})
export class OrderModule {}
