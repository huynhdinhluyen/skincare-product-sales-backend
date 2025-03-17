import { Module, ValidationPipe } from '@nestjs/common';
import { UserController } from './user.controller';
import { UserService } from './user.service';
import { MongooseModule } from '@nestjs/mongoose';
import { User, UserSchema } from '../auth/schema/user.schema';
import { Order, OrderSchema } from '../order/schema/order.schema';
import { APP_PIPE } from '@nestjs/core';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: Order.name, schema: OrderSchema },
    ]),
  ],
  controllers: [UserController],
  providers: [
    UserService,
    {
      provide: APP_PIPE,
      useClass: ValidationPipe,
    },
  ],
  exports: [UserService],
})
export class UserModule {}
