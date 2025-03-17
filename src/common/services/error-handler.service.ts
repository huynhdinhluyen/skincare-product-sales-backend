import {
  BadRequestException,
  ConflictException,
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import mongoose from 'mongoose';

@Injectable()
export class ErrorHandlerService {
  private logger = new Logger('ErrorHandler');

  handleError(error: any, context: string): void {
    this.logger.error(`Error in ${context}: ${error.message}`, error.stack);

    if (error instanceof mongoose.Error.ValidationError) {
      throw new BadRequestException(this.formatValidationError(error));
    }

    if (error.code === 11000) {
      throw new ConflictException('Duplicate entry');
    }

    throw new InternalServerErrorException('Something went wrong');
  }

  private formatValidationError(error: mongoose.Error.ValidationError): string {
    const errorMessages = [];

    for (const field in error.errors) {
      errorMessages.push(error.errors[field].message);
    }

    return errorMessages.join(', ');
  }
}
