import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createCache, Cache as CacheManager } from 'cache-manager';
import { ConfigurationInterface } from 'src/configuration/configuration.interface';
import { createKeyv } from 'cacheable';
import { createKeyv as createKeyvRedis } from '@keyv/redis';
import { DBCacheClient } from './client-interfaces/cache.client-db';
import { ThrottleCacheClient } from './client-interfaces/cache.client-throttle';
import { isProduction } from 'src/utils/app.util';
import { startupLogger } from 'src/logger/logger';

@Injectable()
export class CacheService {
  private cacheManager: CacheManager;
  private dbClient: DBCacheClient | null = null;
  private throttleClient: ThrottleCacheClient | null = null;

  constructor(
    private readonly configService: ConfigService<ConfigurationInterface>,
  ) {
    const connectionString = this.configService.get<string>('cache.redis_url', {
      infer: true,
    });

    if (isProduction() && !connectionString) {
      startupLogger.error('Redis connection string is required in production', {
        module: CacheService.name,
      });

      throw new Error('Redis connection string is required in production');
    }

    const store = connectionString
      ? createKeyvRedis(connectionString)
      : createKeyv();
    this.cacheManager = createCache(store);
  }

  getOrCreateDBClient(useGlobally = false, globalTtl = 60_000): DBCacheClient {
    if (!this.dbClient) {
      this.dbClient = new DBCacheClient(
        this.cacheManager,
        useGlobally,
        globalTtl,
      );
    }
    return this.dbClient;
  }

  getOrCreateThrottleClient(): ThrottleCacheClient {
    if (!this.throttleClient) {
      this.throttleClient = new ThrottleCacheClient(this.cacheManager);
    }

    return this.throttleClient;
  }
}
