import * as toml from 'toml';
import { ConfigurationData } from './configuration.interface';
import { TomlParseError } from 'src/interfaces/error.interface';
import { startupLogger } from 'src/logger/logger';
import { readFileSync } from 'node:fs';
import { getTomlConfig } from 'src/constants/application.constant';

export default () => {
  const configData = readFileSync(getTomlConfig(), 'utf-8');
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
    configPath: getTomlConfig(),
    module: 'Configuration',
  });

  return ConfigurationData.parse(config);
};
