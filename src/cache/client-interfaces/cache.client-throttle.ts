import { ThrottlerStorage } from '@nestjs/throttler';
import { Cache as CacheManager } from 'cache-manager';

interface ThrottleEntry {
  totalHits: Record<string, number>;
  expiresAt: number;
  isBlocked: boolean;
  blockExpiresAt: number;
}

interface ThrottleRecord {
  totalHits: number;
  timeToExpire: number;
  isBlocked: boolean;
  timeToBlockExpire: number;
}

export class ThrottleCacheClient implements ThrottlerStorage {
  private cache: CacheManager;

  constructor(cacheManager: CacheManager) {
    this.cache = cacheManager;
  }

  async increment(
    key: string,
    ttl: number,
    limit: number,
    blockDuration: number,
    throttlerName: string,
  ): Promise<ThrottleRecord> {
    const now = Date.now();

    let entry = (await this.cache.get<ThrottleEntry>(key)) ?? {
      totalHits: {},
      expiresAt: now + ttl,
      isBlocked: false,
      blockExpiresAt: 0,
    };

    if (entry.expiresAt <= now) {
      entry = {
        totalHits: {},
        expiresAt: now + ttl,
        isBlocked: false,
        blockExpiresAt: 0,
      };
    }

    if (entry.isBlocked && entry.blockExpiresAt <= now) {
      entry.isBlocked = false;
      entry.blockExpiresAt = 0;
      entry.totalHits[throttlerName] = 0;
    }

    if (!entry.isBlocked) {
      entry.totalHits[throttlerName] =
        (entry.totalHits[throttlerName] ?? 0) + 1;
    }

    if (entry.totalHits[throttlerName] > limit && !entry.isBlocked) {
      entry.isBlocked = true;
      entry.blockExpiresAt = now + blockDuration;
    }

    const timeToExpire = Math.max(
      0,
      Math.ceil((entry.expiresAt - Date.now()) / 1000),
    );
    const timeToBlockExpire = entry.isBlocked
      ? Math.max(0, Math.ceil((entry.blockExpiresAt - Date.now()) / 1000))
      : 0;

    const ttlForStore = Math.max(
      entry.expiresAt - now,
      entry.blockExpiresAt - now,
      1,
    );
    await this.cache.set(key, entry, ttlForStore);

    return {
      totalHits: entry.totalHits[throttlerName] ?? 0,
      timeToExpire,
      isBlocked: entry.isBlocked,
      timeToBlockExpire,
    };
  }
}
