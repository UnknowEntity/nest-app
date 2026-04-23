import { Module } from '@nestjs/common';
import { DatabaseService } from './database.service';
import { drizzle } from 'drizzle-orm/node-postgres';
import { startupLogger } from 'src/logger/logger';
import { sql } from 'drizzle-orm';
import { ConfigurationInterface } from 'src/configuration/configuration.interface';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { isProduction } from 'src/utils/app.util';
import { CacheModule } from 'src/cache/cache.module';
import { CacheService } from 'src/cache/cache.service';

@Module({
  imports: [ConfigModule, CacheModule],
  providers: [
    {
      provide: DatabaseService,
      inject: [ConfigService, CacheService],
      useFactory(
        config: ConfigService<ConfigurationInterface>,
        cacheService: CacheService,
      ) {
        const databaseConfig = config.getOrThrow('database', {
          infer: true,
        });

        const dbClient = cacheService.getOrCreateDBClient(
          isProduction(),
          databaseConfig.cache_ttl_ms,
        );

        const database = drizzle({
          connection: {
            connectionString: databaseConfig.connection_string,
            ssl: isProduction() ? true : databaseConfig.ssl || false,
          },
          cache: dbClient,
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
