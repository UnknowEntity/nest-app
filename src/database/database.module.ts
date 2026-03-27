import { Module } from '@nestjs/common';
import { DatabaseService } from './database.service';
import {
  ConfigurableDatabaseModule,
  DATABASE_OPTIONS_TOKEN,
} from './database.module-definition';
import { DatabaseModuleOptions } from './database.module-interface';
import { drizzle } from 'drizzle-orm/node-postgres';
import { startupLogger } from 'src/logger/logger';
import { sql } from 'drizzle-orm';

@Module({
  providers: [
    {
      provide: DatabaseService,
      inject: [DATABASE_OPTIONS_TOKEN],
      useFactory(options: DatabaseModuleOptions) {
        const database = drizzle({
          connection: {
            connectionString: options.connectionString,
            ssl: options.ssl || false,
          },
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
export class DatabaseModule extends ConfigurableDatabaseModule {}
