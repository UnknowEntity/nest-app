import * as zod from 'zod';

const AppConfigSchema = zod.object({
  csrf_secret: zod.base64().min(44),
});

const DatabaseSchema = zod.object({
  connection_string: zod.string(),
  ssl: zod.boolean().optional(),
  cache_ttl_ms: zod.number().int().positive(),
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
  email_verification: zod.object({
    secret: zod.base64().min(44),
    expires_in: zod.number(),
  }),
});

const RateLimitSchema = zod.object({
  ttl_seconds: zod.number().int().positive(),
  max_requests_per_window: zod.number().int().positive(),
});

const SmtpSchema = zod.object({
  transport: zod.object({
    host: zod.string().min(1),
    port: zod.number().int().positive(),
    user: zod.string().min(1),
    pass: zod.string().min(1),
  }),
  from_address: zod.email(),
  from_name: zod.string().optional(),
  retry_attempts: zod.number().int().nonnegative().default(3),
});

const CacheConfigSchema = zod.object({
  ttl_ms: zod.number().int().positive(),
  connection_string: zod.string().optional(),
});

// General configuration that doesn't fit into other categories
// Do not include sensitive information here
// This can be used for things like application domain, feature flags, etc.
const GeneralConfigSchema = zod.object({
  domain: zod.string().min(1),
  app_name: zod.string().min(1),
});

export const ConfigurationData = zod.object({
  app: AppConfigSchema,
  database: DatabaseSchema,
  cache: CacheConfigSchema,
  auth: AuthSchema,
  rate_limit: RateLimitSchema,
  smtp: SmtpSchema,
  general: GeneralConfigSchema,
});

export type ConfigurationInterface = zod.infer<typeof ConfigurationData>;
export type DatabaseConfig = zod.infer<typeof DatabaseSchema> & {
  useGlobalCache?: boolean;
};
export type GeneralConfig = zod.infer<typeof GeneralConfigSchema>;
