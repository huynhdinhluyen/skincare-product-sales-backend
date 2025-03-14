import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Inject, Injectable, Logger } from '@nestjs/common';
import { Cache } from 'cache-manager';

@Injectable()
export class CacheService {
  private readonly logger = new Logger(CacheService.name);

  constructor(@Inject(CACHE_MANAGER) private readonly cacheManager: Cache) {}

  async get<T>(key: string): Promise<T | undefined> {
    try {
      return await this.cacheManager.get<T>(key);
    } catch (error) {
      this.logger.error(`Error getting from cache: ${key}`, error);
      return undefined;
    }
  }

  async set(key: string, value: any, ttl: number = 3600): Promise<void> {
    try {
      await this.cacheManager.set(key, value, ttl);
    } catch (error) {
      this.logger.error(`Error setting cache: ${key}`, error);
    }
  }

  async del(key: string): Promise<void> {
    try {
      await this.cacheManager.del(key);
    } catch (error) {
      this.logger.error(`Error deleting from cache: ${key}`, error);
    }
  }

  async reset(): Promise<void> {
    try {
      await this.cacheManager.reset();
      this.logger.log('Cache has been reset');
    } catch (error) {
      this.logger.error('Error resetting cache', error);
    }
  }

  async invalidateProductCache(productId?: string): Promise<void> {
    try {
      if (productId) {
        await this.del(`product:${productId}`);
      }
      await this.reset();
    } catch (error) {
      this.logger.error('Failed to invalidate product cache', error);
    }
  }
}
