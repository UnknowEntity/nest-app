import * as toml from 'toml';
import { ConfigurationData } from './configuration.interface';
import { TOML_CONFIG_PATH } from 'src/constants/application.constant';
import { TomlParseError } from 'src/interfaces/error.interface';
import { startupLogger } from 'src/logger/logger';
import { readFileSync } from 'node:fs';

export default () => {
  const configData = readFileSync(TOML_CONFIG_PATH, 'utf-8');
  let config: Record<string, unknown>;

  try {
    config = toml.parse(configData) as Record<string, unknown>;
  } catch (e) {
    const error = new TomlParseError(e as Error);
    startupLogger.error(
      'Parsing error on line ' +
        error.line +
        ', column ' +
        error.column +
        ': ' +
        error.message,
    );

    throw error;
  }

  startupLogger.info('Configuration loaded successfully', {
    configPath: TOML_CONFIG_PATH,
    module: 'Configuration',
  });

  return ConfigurationData.parse(config);
};
