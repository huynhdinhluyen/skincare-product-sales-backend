import { Module } from '@nestjs/common';
import { QuestionsController } from './questions.controller';
import { QuestionsService } from './questions.service';
import { MongooseModule } from '@nestjs/mongoose';
import { Question, QuestionSchema } from './schema/question.schema';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: Question.name,
        schema: QuestionSchema,
      },
    ]),
    AuthModule,
  ],
  controllers: [QuestionsController],
  providers: [QuestionsService],
})
export class QuestionsModule {}
