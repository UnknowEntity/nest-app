import { Module } from '@nestjs/common';
import { DatabaseService } from './database.service';
import { drizzle } from 'drizzle-orm/node-postgres';
import { startupLogger } from 'src/logger/logger';
import { sql } from 'drizzle-orm';
import { GlobalCache } from './cache';
import { ConfigurationInterface } from 'src/configuration/configuration.interface';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { isProduction } from 'src/utils/app.util';

@Module({
  imports: [ConfigModule],
  providers: [
    {
      provide: DatabaseService,
      inject: [ConfigService],
      useFactory(config: ConfigService<ConfigurationInterface>) {
        const databaseConfig = config.getOrThrow('database', {
          infer: true,
        });

        if (isProduction() && !databaseConfig.redis_connection_string) {
          throw new Error('Redis connection string is required in production');
        }

        const database = drizzle({
          connection: {
            connectionString: databaseConfig.connection_string,
            ssl: isProduction() ? true : databaseConfig.ssl || false,
          },
          cache: new GlobalCache(
            databaseConfig.redis_connection_string,
            isProduction(),
            databaseConfig.cache_ttl_ms,
          ),
        });

        try {
          database.execute(sql`SELECT 1`);
        } catch (error) {
          startupLogger.error('Failed to connect to the database', {
            error: error instanceof Error ? error.message : String(error),
            module: DatabaseModule.name,
          });
          throw new Error('Failed to connect to the database');
        }

        startupLogger.info('Successfully connected to the database', {
          module: DatabaseModule.name,
        });

        return database;
      },
    },
  ],
  exports: [DatabaseService],
})
export class DatabaseModule {}
