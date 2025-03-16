import { ApiProperty } from '@nestjs/swagger';
import { IsMongoId, IsNotEmpty, IsString } from 'class-validator';

export class CreatePaymentDto {
  @IsMongoId()
  @IsNotEmpty()
  @ApiProperty({
    example: '64f7e94d01297f5d1ccd7e58',
    description: 'The ID of the order this payment belongs to',
  })
  orderId: string;

  @IsString()
  @IsNotEmpty()
  @ApiProperty({
    example: 'TXN-12345678',
    description: 'Transaction ID from the payment provider',
  })
  transactionId: string;
}
