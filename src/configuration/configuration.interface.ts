import * as zod from 'zod';

const AppConfigSchema = zod.object({
  csrf_secret: zod.base64().min(44),
});

const DatabaseSchema = zod.object({
  connection_string: zod.string(),
  ssl: zod.boolean().optional(),
  redis_connection_string: zod.string().optional(),
  cache_ttl_ms: zod.number().int().positive().optional(),
});

const JwtAlgorithmSchema = zod.enum([
  'HS256',
  'HS384',
  'HS512',
  'RS256',
  'RS384',
  'RS512',
  'ES256',
  'ES384',
  'ES512',
  'PS256',
  'PS384',
  'PS512',
]);

// Set min to ensure a strong secret (32 bytes = 44 base64 characters)
const AuthSchema = zod.object({
  issuer: zod.string().min(1),
  audience: zod.string().min(1),
  algorithms: zod.array(JwtAlgorithmSchema).nonempty(),
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

const RateLimitSchema = zod.object({
  ttl_seconds: zod.number().int().positive(),
  max_requests_per_window: zod.number().int().positive(),
});

export const ConfigurationData = zod.object({
  app: AppConfigSchema,
  database: DatabaseSchema,
  auth: AuthSchema,
  rate_limit: RateLimitSchema,
});

export type ConfigurationInterface = zod.infer<typeof ConfigurationData>;
export type DatabaseConfig = zod.infer<typeof DatabaseSchema> & {
  useGlobalCache?: boolean;
};
