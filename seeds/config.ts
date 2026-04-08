import { getFilePath } from 'src/utils/app.util';
import * as zod from 'zod';
import * as toml from 'toml';
import { readFileSync } from 'fs';
import { TomlParseError } from 'src/interfaces/error.interface';

export const SeedConfigSchema = zod.object({
  seeds_value: zod.object({
    admin_password: zod
      .string()
      .min(8, 'Password must be at least 8 characters')
      .max(15, 'Password cannot exceed 15 characters')
      .regex(/[A-Z]/, 'Must contain at least one uppercase letter')
      .regex(/[a-z]/, 'Must contain at least one lowercase letter')
      .regex(/[0-9]/, 'Must contain at least one number')
      .regex(/[^a-zA-Z0-9]/, 'Must contain at least one special character'),
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
