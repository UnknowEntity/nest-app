# kubernetes-node

NestJS API service with authentication, authorization, cache, and PostgreSQL/Drizzle persistence.

## Setup

```bash
npm install
```

## Project Configuration Guide

This project reads runtime configuration from a TOML file and validates it with Zod on startup.

### Local Configuration Setup

1. Create `config.toml` in the project root.
2. Use `config.template.toml` as the source of truth for required values and structure.
3. Fill in values based on your environment.

`config.toml` is ignored by git, so secrets are not committed.

### Seed Configuration Setup

1. Create `config.seed.toml` in the project root.
2. Use `config.seed.template.toml` as the source of truth for required values and structure.
3. Fill in values based on your environment.

`config.seed.toml` is also git-ignored.

### Production Configuration Path

In production mode, config is read from:

`/etc/secret-volume/config.toml`

In non-production mode, config is read from the project root:

`./config.toml`

## Extending Configuration

When adding new configuration, keep schema, templates, and runtime usage aligned.

1. Update schema in `src/configuration/configuration.interface.ts`.
2. Reflect new values in `config.template.toml`.
3. Reflect seed-related values in `config.seed.template.toml` when needed.
4. Set runtime values in `config.toml` and `config.seed.toml`.
5. Consume values through typed `ConfigService` lookups in modules and services.

If parsing fails or required keys are missing, startup fails fast.

## Run

```bash
# development
npm run start:dev

# production build
npm run build
npm run start:prod
```

## Test

```bash
npm run test
npm run test:e2e
npm run test:cov
```

## Migration Guide (Drizzle)

Use Drizzle Kit to create and apply migrations.

```bash
npx drizzle-kit generate --name=add_casbin_table
npx drizzle-kit migrate
```

### Important Note About Reverting Migrations

Drizzle Kit does not provide a built-in migration revert command.

If a migration is faulty, use this recovery flow:

1. Manually adjust the database schema to a safe state.
2. Create a revert migration that undoes the faulty migration.
3. Run migrations so the revert migration is applied.
4. Delete the two migration SQL files (the faulty migration and the revert migration).
5. Delete the two matching files in `migrations/meta/` for those migrations.
6. Generate a new corrected migration.

This keeps migration history and schema snapshots consistent after a bad migration.

## Seeding Guide

This project uses a script-based seeding system in `seeds/run.ts`.

### How Seeding Works

1. The runner scans `seeds/scripts/`.
2. It only executes files that match this pattern:
   - `^[0-9]+_.*\.ts$`
   - Example: `3_init_permissions.ts`
3. Scripts are sorted and executed in filename order.
4. Executed script names are stored in `seed_metadata` table.
5. If a script already exists in `seed_metadata`, it is skipped.

This makes seeding idempotent for previously executed files.

### Seed Configuration

- Seed config file: `config.seed.toml`
- Parsed and validated by `seeds/config.ts`
- Required values and format are defined in `config.seed.template.toml`.

### Add a New Seed

1. Create a new file in `seeds/scripts/` using the numeric prefix format.
2. Export an async `execute` function with this signature:

```ts
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { database } from '../database';
import { SeedConfigInterface } from '../config';

export async function execute(
  db: typeof database,
  config: SeedConfigInterface,
) {
  // your seed logic
}
```

1. Use `db` for inserts/updates and `config` for seed-time configuration.

### Run Seeds

```bash
npm run run:seed
```

This runs `ts-node -r tsconfig-paths/register seeds/run.ts`.

### Re-run a Seed

If you need to run a seed file again:

1. Remove that row from `seed_metadata`.
2. Re-run `npm run run:seed`.

Only do this when the seed script is safe to run again.

## Security Checklist (Implementation Status)

Status below reflects current source code implementation.

- [x] Config schema validation at startup
- [x] Strong auth secret validation (base64 + minimum length)
- [x] Password hashing with scrypt and timing-safe comparison
- [x] Input validation via Zod DTO schemas on write/auth endpoints
- [x] JWT access and refresh token strategies
- [x] Rotating refresh token family with grace period handling
- [x] Authorization guard with Casbin policy enforcement
- [x] Structured exception filters for HTTP and validation errors

- [ ] Rate limiting (global and/or per-route)
  - [x] Rate limit implementation
  - [ ] Rate limit test
- [x] Login timeout increment / account lockout after failed attempts
- [ ] Email workflow (verification / forgot password / reset)
  - [x] Email verification implementation
  - [x] Forgot password implementation
  - [x] Reset password implementation
  - [ ] Email workflow test
- [x] HTTP hardening middleware (Helmet, strict CORS policy)
- [x] JWT claim hardening (issuer, audience, allowed algorithms)
- [x] Explicit logout/revocation endpoint for active refresh token/session
- [ ] Security-focused test coverage for authn/authz paths

## Test Checklist (Per Security Part)

Use this as a verification ledger. Checkboxes are split between implementation review and automated test validation.

| Part | Implementation Rechecked | Automated Test Verified |
| --- | --- | --- |
| Config schema validation at startup | [x] | [ ] |
| Strong auth secret validation (base64 + minimum length) | [x] | [ ] |
| Password hashing and timing-safe comparison | [x] | [ ] |
| Input validation via Zod DTO schemas | [x] | [ ] |
| JWT access/refresh/reset strategies | [x] | [ ] |
| Rotating refresh token family with grace period | [x] | [ ] |
| Authorization guard with Casbin | [x] | [ ] |
| Structured exception filters | [x] | [ ] |
| Rate limiting (global/per-route) | [x] | [ ] |
| Account lockout after failed attempts | [x] | [ ] |
| Email verification flow | [x] | [ ] |
| Forgot password flow | [x] | [ ] |
| Reset password flow | [x] | [ ] |
| HTTP hardening middleware (Helmet/CORS) | [x] | [ ] |
| JWT claim hardening (issuer/audience/algorithms) | [x] | [ ] |
| Logout/session revocation endpoint | [x] | [ ] |
| Security-focused authn/authz coverage | [ ] | [ ] |

## Delivery Roadmap

- [x] Cache
- [x] Authentication
  - [x] Rotating Refresh Token
  - [x] Logout (refresh token family revocation)
- [x] Authorization
- [ ] Rate Limit
- [x] Timeout Increment for Login
- [ ] Email
- [ ] Business Logic
- [ ] CI/CD
- [ ] Deployment
