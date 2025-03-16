import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { TransactionService } from './transaction.service';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Request, Response } from 'express';
import { CreateVnPayPaymentDto } from '../vnpay/dto/create-vnpay-payment.dto';
import { CreatePaymentDto } from './dto/CreatePaymentDto';
import { VnPayService } from '../vnpay/vnpay.service';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';
import * as qs from 'qs';

@ApiTags('Payments')
@ApiBearerAuth()
@Controller('payments')
export class TransactionController {
  constructor(
    private readonly transactionService: TransactionService,
    private readonly vnpayService: VnPayService,
    private readonly configService: ConfigService,
  ) {}

  @Post('vnpay/create')
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({
    summary: 'Create VNPay payment URL',
    description: 'Generates a VNPay payment URL for the order',
  })
  @ApiResponse({ status: 200, description: 'Payment URL generated' })
  @ApiResponse({ status: 404, description: 'Order or payment not found' })
  async createVnPayUrl(
    @Body() createVnPayDto: CreateVnPayPaymentDto,
    @Req() req: Request,
  ) {
    // Get client IP address exactly like in the template
    const ipAddr =
      req.headers['x-forwarded-for'] ||
      req.connection.remoteAddress ||
      req.socket.remoteAddress ||
      req.connection['socket']?.remoteAddress ||
      '127.0.0.1';

    // Set ipAddr from request
    createVnPayDto.ipAddr = Array.isArray(ipAddr) ? ipAddr[0] : String(ipAddr);

    const paymentUrl =
      await this.transactionService.createVnPayPaymentUrl(createVnPayDto);

    return {
      success: true,
      data: {
        paymentUrl,
      },
      message: 'VNPay payment URL generated successfully',
    };
  }

  @Get('order/:orderId')
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({
    summary: 'Get payment by order ID',
    description: 'Returns payment details for a specific order',
  })
  @ApiResponse({ status: 200, description: 'Payment found' })
  @ApiResponse({ status: 404, description: 'Payment not found' })
  async getPaymentByOrderId(@Param('orderId') orderId: string) {
    return {
      success: true,
      data: await this.transactionService.getPaymentByOrderId(orderId),
      message: 'Payment details retrieved successfully',
    };
  }

  @Get('vnpay/ipn')
  @ApiOperation({
    summary: 'Handle VNPay IPN URL',
    description:
      'Process server-to-server notification from VNPay about payment status',
  })
  @ApiResponse({ status: 200, description: 'IPN processed' })
  async handleVnPayIPN(@Query() vnpParams: any, @Res() res: Response) {
    const secureHash = vnpParams['vnp_SecureHash'];

    delete vnpParams['vnp_SecureHash'];
    delete vnpParams['vnp_SecureHashType'];

    // Sort the parameters
    const sortedParams = this.vnpayService.sortObject(vnpParams);

    // Verify signature exactly like template - but fix the Buffer usage
    const signData = qs.stringify(sortedParams, { encode: false });
    const hmac = crypto.createHmac(
      'sha512',
      this.configService.get('VNPAY_HASH_SECRET'),
    );
    const signed = hmac.update(Buffer.from(signData, 'utf-8')).digest('hex');

    if (secureHash === signed) {
      // Process payment via service - removed unused variables
      await this.transactionService.processVnPayIPN(vnpParams);

      // Return expected format
      return res.status(200).json({ RspCode: '00', Message: 'success' });
    } else {
      return res.status(200).json({ RspCode: '97', Message: 'Fail checksum' });
    }
  }

  @Get('vnpay/return')
  @ApiOperation({
    summary: 'Handle VNPay return URL',
    description: 'Handles user redirection after payment at VNPay',
  })
  @ApiResponse({
    status: 302,
    description: 'Redirect to frontend with payment result',
  })
  async handleVnPayReturn(@Query() vnpParams: any, @Res() res: Response) {
    const secureHash = vnpParams['vnp_SecureHash'];

    delete vnpParams['vnp_SecureHash'];
    delete vnpParams['vnp_SecureHashType'];

    // Sort the parameters
    const sortedParams = this.vnpayService.sortObject(vnpParams);

    // Verify signature exactly like template - but fix the Buffer usage
    const signData = qs.stringify(sortedParams, { encode: false });
    const hmac = crypto.createHmac(
      'sha512',
      this.configService.get('VNPAY_HASH_SECRET'),
    );
    const signed = hmac.update(Buffer.from(signData, 'utf-8')).digest('hex');

    if (secureHash === signed) {
      // Redirect to success page with response code
      return res.redirect(
        `${this.configService.get('FRONTEND_URL')}/payment/success?code=${vnpParams['vnp_ResponseCode']}`,
      );
    } else {
      // Redirect to failure page with error code 97 (checksum fail)
      return res.redirect(
        `${this.configService.get('FRONTEND_URL')}/payment/failure?code=97`,
      );
    }
  }

  @Post('online')
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({
    summary: 'Process online payment',
    description:
      'Updates payment and order statuses after successful online payment',
  })
  @ApiResponse({ status: 200, description: 'Payment processed successfully' })
  @ApiResponse({ status: 404, description: 'Order or payment not found' })
  async processOnlinePayment(@Body() createPaymentDto: CreatePaymentDto) {
    const payment =
      await this.transactionService.processOnlinePayment(createPaymentDto);

    return {
      success: true,
      data: payment,
      message: 'Payment processed successfully',
    };
  }
}
