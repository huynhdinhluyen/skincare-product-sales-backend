import { ApiProperty } from '@nestjs/swagger';

export class VnPayReturnDto {
  @ApiProperty({ description: 'VNPay transaction reference' })
  vnp_TxnRef: string;

  @ApiProperty({ description: 'Order information' })
  vnp_OrderInfo: string;

  @ApiProperty({ description: 'Response code from VNPay' })
  vnp_ResponseCode: string;

  @ApiProperty({ description: 'Transaction ID from VNPay' })
  vnp_TransactionNo: string;

  @ApiProperty({ description: 'Bank code' })
  vnp_BankCode: string;

  @ApiProperty({ description: 'Bank transaction number' })
  vnp_BankTranNo?: string;

  @ApiProperty({ description: 'Card type' })
  vnp_CardType?: string;

  @ApiProperty({ description: 'Payment amount (already multiplied by 100)' })
  vnp_Amount: number;

  @ApiProperty({ description: 'Payment date' })
  vnp_PayDate: string;

  @ApiProperty({ description: 'Transaction status' })
  vnp_TransactionStatus?: string;

  @ApiProperty({ description: 'Currency code' })
  vnp_CurrCode?: string;

  @ApiProperty({ description: 'Terminal code' })
  vnp_TmnCode?: string;

  @ApiProperty({ description: 'Secure hash for verification' })
  vnp_SecureHash: string;
}
