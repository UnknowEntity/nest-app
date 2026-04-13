import * as zod from 'zod';

const DatabaseSchema = zod.object({
  connection_string: zod.string(),
  ssl: zod.boolean().optional(),
  redis_connection_string: zod.string().optional(),
  cache_ttl_ms: zod.number().int().positive().optional(),
});

// Set min to ensure a strong secret (32 bytes = 44 base64 characters)
const AuthSchema = zod.object({
  access: zod.object({
    secret: zod.base64().min(44),
    expires_in: zod.number(),
  }),
  refresh: zod.object({
    secret: zod.base64().min(44),
    expires_in: zod.number(),
    max_expires_in: zod.number(),
  }),
  forgot_password: zod.object({
    secret: zod.base64().min(44),
    expires_in: zod.number(),
  }),
});

export const ConfigurationData = zod.object({
  database: DatabaseSchema,
  auth: AuthSchema,
});

export type ConfigurationInterface = zod.infer<typeof ConfigurationData>;
export type DatabaseConfig = zod.infer<typeof DatabaseSchema> & {
  useGlobalCache?: boolean;
};
