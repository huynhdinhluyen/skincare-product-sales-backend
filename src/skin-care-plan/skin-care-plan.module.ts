import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { SkinCarePlanController } from './skin-care-plan.controller';
import { SkinCarePlanService } from './skin-care-plan.service';
import {
  SkinCarePlan,
  SkinCarePlanSchema,
} from './schema/skin-care-plan.schema';
import { Product, ProductSchema } from '../product/schema/product.schema';
import { CommonModule } from '../common/modules/common.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: SkinCarePlan.name, schema: SkinCarePlanSchema },
      { name: Product.name, schema: ProductSchema },
    ]),
    CommonModule,
    AuthModule,
  ],
  controllers: [SkinCarePlanController],
  providers: [SkinCarePlanService],
  exports: [SkinCarePlanService],
})
export class SkinCarePlanModule {}
