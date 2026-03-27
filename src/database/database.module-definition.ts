import { ConfigurableModuleBuilder } from '@nestjs/common';
import { DatabaseModuleOptions } from './database.module-interface';

export const {
  ConfigurableModuleClass: ConfigurableDatabaseModule,
  MODULE_OPTIONS_TOKEN: DATABASE_OPTIONS_TOKEN,
} = new ConfigurableModuleBuilder<DatabaseModuleOptions>().build();
