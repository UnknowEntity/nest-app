import { ThrottlerGenerateKeyFunction } from '@nestjs/throttler';

export interface ThrottleConfig {
  ttl: number; // Time to live in seconds
  limit: number; // Maximum number of requests within the ttl

  generateKey?: ThrottlerGenerateKeyFunction; // Optional custom key generator function
}
