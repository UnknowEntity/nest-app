import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createCache, Cache as CacheManager } from 'cache-manager';
import { ConfigurationInterface } from 'src/configuration/configuration.interface';
import { createKeyv } from 'cacheable';
import { createKeyv as createKeyvRedis } from '@keyv/redis';
import { DBCacheClient } from './client-interfaces/cache.client-db';
import { ThrottleCacheClient } from './client-interfaces/cache.client-throttle';
import { isProduction } from 'src/utils/app.util';
import { MasterLogger, startupLogger } from 'src/logger/logger';
import { HealthIndicatorService } from '@nestjs/terminus';
import { Logger } from 'winston';

@Injectable()
export class CacheService {
  private cacheManager: CacheManager;
  private dbClient: DBCacheClient | null = null;
  private throttleClient: ThrottleCacheClient | null = null;
  private logger: Logger;

  constructor(
    private readonly configService: ConfigService<ConfigurationInterface>,
    private readonly health: HealthIndicatorService,
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

    this.logger = MasterLogger.child({ label: CacheService.name });
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

  async isHealthy() {
    const indicator = this.health.check('cache');
    try {
      await this.cacheManager.set('health_check', 'ok', 5000);

      const value = await this.cacheManager.get('health_check');
      return value === 'ok'
        ? indicator.up()
        : indicator.down({ cache: 'Unexpected value from cache' });
    } catch (error) {
      this.logger.error('Cache health check failed', {
        error: error as unknown,
      });
      return indicator.down({ cache: 'Failed to connect to cache' });
    }
  }
}
