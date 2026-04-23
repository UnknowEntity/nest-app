import { Injectable } from '@nestjs/common';
import { DatabaseService } from './database.service';
import { HealthIndicatorService } from '@nestjs/terminus';
import { sql } from 'drizzle-orm';
import { Logger } from 'winston';
import { MasterLogger } from 'src/logger/logger';

@Injectable()
export class DatabaseHealthService {
  private logger: Logger;
  constructor(
    private readonly databaseService: DatabaseService,
    private readonly health: HealthIndicatorService,
  ) {
    this.logger = MasterLogger.child({ label: DatabaseHealthService.name });
  }

  async isHealthy() {
    const indicator = this.health.check('database');

    try {
      await this.databaseService.execute(sql`SELECT 1`);
      return indicator.up();
    } catch (error) {
      this.logger.error('Database health check failed', {
        error: error as unknown,
      });
      return indicator.down({ database: 'Failed to connect to database' });
    }
  }
}
