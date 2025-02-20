import { Module } from '@nestjs/common';
import { SkinCarePlanService } from './skin-care-plan.service';
import { SkinCarePlanController } from './skin-care-plan.controller';
import { MongooseModule } from '@nestjs/mongoose';
import {
  SkinTestResult,
  SkinTestResultSchema,
} from 'src/skin-test-result/schema/skin-test-result.schema';
import { Question, QuestionSchema } from 'src/questions/schema/question.schema';
import { User, UserSchema } from 'src/auth/schema/user.schema';
import { Product, ProductSchema } from 'src/product/schema/product.schema';
import {
  SkinCarePlan,
  SkinCarePlanSchema,
} from './entities/skin-care-plan.entity';
import { CacheModule } from '@nestjs/cache-manager';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: SkinTestResult.name, schema: SkinTestResultSchema },
      { name: Question.name, schema: QuestionSchema },
      { name: User.name, schema: UserSchema },
      { name: Product.name, schema: ProductSchema },
      { name: SkinCarePlan.name, schema: SkinCarePlanSchema },
    ]),
    CacheModule.register(),
  ],
  controllers: [SkinCarePlanController],
  providers: [SkinCarePlanService],
})
export class SkinCarePlanModule {}
