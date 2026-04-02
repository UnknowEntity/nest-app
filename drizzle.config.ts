import * as toml from 'toml';
import { defineConfig } from 'drizzle-kit';
import { readFileSync } from 'node:fs';
import { getTomlConfig } from 'src/constants/application.constant';
import { ConfigurationInterface } from 'src/configuration/configuration.interface';

const configData = readFileSync(getTomlConfig(), 'utf-8');

const config = toml.parse(configData) as ConfigurationInterface;

export default defineConfig({
  out: './migrations',
  schema: './src/database/schema.ts',
  dialect: 'postgresql',
  dbCredentials: {
    url: config.database.connection_string,
  },
});
