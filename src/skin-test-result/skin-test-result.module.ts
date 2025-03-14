import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { SkinTestResultController } from './skin-test-result.controller';
import { SkinTestResultService } from './skin-test-result.service';
import {
  SkinTestResult,
  SkinTestResultSchema,
} from './schema/skin-test-result.schema';
import { Question, QuestionSchema } from '../questions/schema/question.schema';

import { AuthModule } from '../auth/auth.module';
import { User, UserSchema } from '../auth/schema/user.schema';
import { CommonModule } from '../common/modules/common.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: SkinTestResult.name, schema: SkinTestResultSchema },
      { name: Question.name, schema: QuestionSchema },
      { name: User.name, schema: UserSchema },
    ]),
    CommonModule,
    AuthModule,
  ],
  controllers: [SkinTestResultController],
  providers: [SkinTestResultService],
  exports: [SkinTestResultService],
})
export class SkinTestResultModule {}
