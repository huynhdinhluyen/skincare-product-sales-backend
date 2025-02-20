import { Module } from '@nestjs/common';
import { SkinTestResultController } from './skin-test-result.controller';
import { SkinTestResultService } from './skin-test-result.service';
import { MongooseModule } from '@nestjs/mongoose';
import {
  SkinTestResult,
  SkinTestResultSchema,
} from './schema/skin-test-result.schema';
import { Question, QuestionSchema } from 'src/questions/schema/question.schema';
import { User, UserSchema } from 'src/auth/schema/user.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: SkinTestResult.name, schema: SkinTestResultSchema },
      { name: Question.name, schema: QuestionSchema },
      { name: User.name, schema: UserSchema },
    ]),
  ],
  controllers: [SkinTestResultController],
  providers: [SkinTestResultService],
})
export class SkinTestResultModule {}
