import { Controller, Get, Req, Res } from '@nestjs/common';
import { AppService } from './app.service';
import { CsrfService } from './csrf/csrf.service';
import { Request, Response } from 'express';
import {
  SkipAuthnDecorator,
  SkipAuthzDecorator,
} from './decorators/auth.decorator';
import {
  HealthCheckService,
  HealthCheck,
  DiskHealthIndicator,
  MemoryHealthIndicator,
} from '@nestjs/terminus';
import { DatabaseHealthService } from './database/database-health.service';
import { CacheService } from './cache/cache.service';

@SkipAuthnDecorator()
@SkipAuthzDecorator()
@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    private readonly csrfService: CsrfService,
    private readonly health: HealthCheckService,
    private readonly disk: DiskHealthIndicator,
    private readonly memory: MemoryHealthIndicator,
    private readonly databaseHealthService: DatabaseHealthService,
    private readonly cacheHealthService: CacheService,
  ) {}

  @Get('health')
  @HealthCheck()
  getReady() {
    const platform = process.platform;
    let storagePath = '/';

    if (platform === 'win32') {
      storagePath = 'D:\\';
    }

    return this.health.check([
      () =>
        this.disk.checkStorage('storage', {
          path: storagePath,
          // Set a high threshold to avoid false positives in health checks
          threshold: 15 * 1024 * 1024 * 1024, // 215 GB
        }),
      () => this.memory.checkHeap('memory_heap', 150 * 1024 * 1024), // 150 MB
      () => this.memory.checkRSS('memory_rss', 300 * 1024 * 1024), // 300 MB
      () => this.databaseHealthService.isHealthy(),
      () => this.cacheHealthService.isHealthy(),
    ]);
  }

  @Get('csrf-token')
  getCsrfToken(@Req() req: Request, @Res() res: Response): void {
    const token = this.csrfService.generateCsrfToken(req, res);
    res.json({ csrfToken: token });
  }
}
