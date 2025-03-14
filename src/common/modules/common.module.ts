import { Module } from '@nestjs/common';
import { ErrorHandlerService } from '../services/error-handler.service';
import { CacheService } from '../services/cache.service';

@Module({
  providers: [ErrorHandlerService, CacheService],
  exports: [ErrorHandlerService, CacheService],
})
export class CommonModule {}
