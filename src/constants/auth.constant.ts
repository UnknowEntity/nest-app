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
