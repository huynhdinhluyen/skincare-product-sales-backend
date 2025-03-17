import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';
import * as moment from 'moment';
import * as qs from 'qs';

@Injectable()
export class VnPayService {
  private readonly vnpTmnCode =
    this.configService.get<string>('VNPAY_TMN_CODE');
  private readonly vnpHashSecret =
    this.configService.get<string>('VNPAY_HASH_SECRET');
  private readonly vnpUrl = this.configService.get<string>('VNPAY_URL');
  private readonly vnpReturnUrl =
    this.configService.get<string>('VNPAY_RETURN_URL');

  constructor(private configService: ConfigService) {}

  createPaymentUrl(orderId: string, amount: number, clientIp: string): string {
    // Set timezone to match VNPay
    process.env.TZ = 'Asia/Ho_Chi_Minh';

    // Format date exactly like the template
    const date = new Date();
    const createDate = moment(date).format('YYYYMMDDHHmmss');

    // Create params object exactly like template
    const vnp_Params = {};
    vnp_Params['vnp_Version'] = '2.1.0';
    vnp_Params['vnp_Command'] = 'pay';
    vnp_Params['vnp_TmnCode'] = this.vnpTmnCode;
    vnp_Params['vnp_Locale'] = 'vn';
    vnp_Params['vnp_CurrCode'] = 'VND';
    vnp_Params['vnp_TxnRef'] = orderId;
    vnp_Params['vnp_OrderInfo'] = `Thanh toan don hang :${orderId.slice(-1)}`;
    vnp_Params['vnp_OrderType'] = 'other';
    vnp_Params['vnp_Amount'] = amount * 100;
    vnp_Params['vnp_ReturnUrl'] = this.vnpReturnUrl;
    vnp_Params['vnp_IpAddr'] = clientIp;
    vnp_Params['vnp_CreateDate'] = createDate;

    const sortedParams = this.sortObject(vnp_Params);

    const signData = qs.stringify(sortedParams, { encode: false });
    const hmac = crypto.createHmac('sha512', this.vnpHashSecret);
    const signed = hmac.update(Buffer.from(signData, 'utf-8')).digest('hex');

    sortedParams['vnp_SecureHash'] = signed;

    let baseUrl = this.vnpUrl + '?';
    const keys = Object.keys(sortedParams);

    keys.forEach((key, index) => {
      // Use regexp to replace %20 with + in the encoded string
      const encodedValue = encodeURIComponent(sortedParams[key]).replace(
        /%20/g,
        '+',
      );
      baseUrl += `${key}=${encodedValue}`;
      if (index < keys.length - 1) {
        baseUrl += '&';
      }
    });

    return baseUrl;
  }

  verifyReturnUrl(vnpParams: any): boolean {
    const secureHash = vnpParams['vnp_SecureHash'];

    delete vnpParams['vnp_SecureHash'];
    delete vnpParams['vnp_SecureHashType'];

    const sortedParams = this.sortObject(vnpParams);

    const signData = qs.stringify(sortedParams, { encode: false });
    const hmac = crypto.createHmac('sha512', this.vnpHashSecret);
    const calculatedHash = hmac
      .update(Buffer.from(signData, 'utf-8'))
      .digest('hex');

    return secureHash === calculatedHash;
  }

  sortObject(obj: any): any {
    const sorted = {};
    const keys = Object.keys(obj).sort();

    for (const key of keys) {
      sorted[key] = obj[key];
    }

    return sorted;
  }
}
