import { readFileSync } from 'node:fs';
import { getTomlConfig } from 'src/constants/application.constant';
import { TomlParseError } from 'src/interfaces/error.interface';
import * as toml from 'toml';
import { drizzle } from 'drizzle-orm/node-postgres';
import { ConfigurationData } from 'src/configuration/configuration.interface';

const configData = readFileSync(getTomlConfig(), 'utf-8');
let config: Record<string, unknown>;

try {
  config = toml.parse(configData) as Record<string, unknown>;
} catch (e) {
  const error = new TomlParseError(e as Error);
  throw error;
}

const configValue = ConfigurationData.parse(config);

export const database = drizzle({
  connection: {
    connectionString: configValue.database.connection_string,
    ssl: configValue.database.ssl || false,
  },
});
