import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class ReplyFeedbackDto {
  @IsString()
  @IsNotEmpty()
  @ApiProperty({
    example: 'Thank you for your feedback! We appreciate your support.',
    description: 'Reply to customer feedback',
  })
  reply: string;
}
