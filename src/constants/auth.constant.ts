import * as zod from 'zod';
export const LOCAL_STRATEGY_NAME = 'local';
export const JWT_ACCESS_STRATEGY_NAME = 'jwt-access';
export const JWT_REFRESH_STRATEGY_NAME = 'jwt-refresh';
export const CONFIG_FILENAME = 'rbac_model.conf';

/**
 * Grace period (in seconds) for refresh token rotation.
 *
 * During this window, clients may retry with an old refresh token after rotation.
 * If a request arrives within this buffer after token rotation:
 * - The old token is still accepted (prevents forced logout due to network/timing issues)
 * - A new access token is issued
 * - The rotated refresh token is returned (idempotent behavior)
 * - The family is NOT marked as compromised
 *
 * After the grace period expires, reusing old tokens indicates possible token theft
 * and triggers family invalidation and denial.
 */
export const REFRESH_TOKEN_GRACE_PERIOD_BUFFER = 30; // 30 seconds

// Default roles to seed into the database
// These roles cannot be deleted and are used as fallbacks for users with missing/invalid roles
export enum DefaultRole {
  Admin = 'admin',
  Guest = 'guest',
}

// Validation schema for user passwords, used in both seeding and user registration
export const PASSWORD_POLICY = zod
  .string()
  .min(8, 'Password must be at least 8 characters')
  .max(15, 'Password cannot exceed 15 characters')
  .regex(/[A-Z]/, 'Must contain at least one uppercase letter')
  .regex(/[a-z]/, 'Must contain at least one lowercase letter')
  .regex(/[0-9]/, 'Must contain at least one number')
  .regex(/[^a-zA-Z0-9]/, 'Must contain at least one special character');

export const DEFAULT_SIGNIN_ATTEMPTS_BEFORE_LOCKOUT = 5;
export const DEFAULT_LOCKOUT_DURATION_SECONDS = 15 * 60;

export const AuthnThrottleConfig = {
  // 15 minutes window for login attempts
  ttl: 15 * 60,
  // Allow max 5 login attempts within the window before throttling
  limit: 5,
};
