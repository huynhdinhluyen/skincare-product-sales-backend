import { ApiProperty } from '@nestjs/swagger';
import {
  IsMongoId,
  IsNotEmpty,
  IsNumber,
  IsString,
  Min,
} from 'class-validator';

export class CreateVnPayPaymentDto {
  @IsMongoId()
  @IsNotEmpty()
  @ApiProperty({
    example: '64f7e94d01297f5d1ccd7e58',
    description: 'The ID of the order to pay for',
  })
  orderId: string;

  @IsNumber()
  @Min(1000)
  @ApiProperty({
    example: 100000,
    description: 'Payment amount in VND',
  })
  amount: number;

  @IsString()
  @IsNotEmpty()
  @ApiProperty({
    example: '127.0.0.1',
    description: 'Client IP address for payment logging',
  })
  ipAddr: string;
}

export class VnPayReturnDto {
  @ApiProperty({
    description: 'VNPay transaction reference',
  })
  vnp_TxnRef: string;

  @ApiProperty({
    description: 'Order information',
  })
  vnp_OrderInfo: string;

  @ApiProperty({
    description: 'Response code from VNPay',
  })
  vnp_ResponseCode: string;

  @ApiProperty({
    description: 'Transaction ID from VNPay',
  })
  vnp_TransactionNo: string;

  @ApiProperty({
    description: 'Bank code',
  })
  vnp_BankCode: string;

  @ApiProperty({
    description: 'Payment amount (already multiplied by 100)',
  })
  vnp_Amount: number;

  @ApiProperty({
    description: 'Payment date',
  })
  vnp_PayDate: string;

  @ApiProperty({
    description: 'Secure hash for verification',
  })
  vnp_SecureHash: string;
}
