import { getFilePath } from 'src/utils/app.util';
import * as zod from 'zod';
import * as toml from 'toml';
import { readFileSync } from 'fs';
import { TomlParseError } from 'src/interfaces/error.interface';
import { PASSWORD_POLICY } from 'src/constants/auth.constant';

export const SeedConfigSchema = zod.object({
  seeds_value: zod.object({
    admin_password: PASSWORD_POLICY,
  }),
});

export type SeedConfigInterface = zod.infer<typeof SeedConfigSchema>;

const SEED_CONFIG_FILENAME = 'config.seed.toml';

const configData = readFileSync(getFilePath(SEED_CONFIG_FILENAME), 'utf-8');
let config: Record<string, unknown>;

try {
  config = toml.parse(configData) as Record<string, unknown>;
} catch (e) {
  const error = new TomlParseError(e as Error);
  throw error;
}

export const configValue = SeedConfigSchema.parse(config);
