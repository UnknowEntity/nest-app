import { minutes } from '@nestjs/throttler';
import { ThrottleConfig } from 'src/interfaces/app.interface';
import { ThrottleKeyFactory } from 'src/utils/security.util';
import * as zod from 'zod';

export const LOCAL_STRATEGY_NAME = 'local';
export const JWT_ACCESS_STRATEGY_NAME = 'jwt-access';
export const JWT_REFRESH_STRATEGY_NAME = 'jwt-refresh';
export const JWT_RESET_PASSWORD_STRATEGY_NAME = 'jwt-reset-password';
export const JWT_EMAIL_VERIFICATION_STRATEGY_NAME = 'jwt-email-verification';
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

export const LoginThrottleConfig: ThrottleConfig = {
  // 15 minutes window for login attempts
  ttl: minutes(15),
  // Allow max 5 login attempts within the window before throttling
  limit: 5,
  generateKey: ThrottleKeyFactory.init('login')
    .addPerEmailInBody()
    .addPerIP()
    .buildGenerateKeyFunction(),
};

export const ForgotPasswordThrottleConfig: ThrottleConfig = {
  // 1 hour window for forgot password attempts
  ttl: minutes(60),
  // Allow max 5 forgot password attempts within the window before throttling
  limit: 5,

  generateKey: ThrottleKeyFactory.init('forgot-password')
    .addPerEmail()
    .addPerIP()
    .buildGenerateKeyFunction(),
};

export const RefreshThrottleConfig: ThrottleConfig = {
  // 15 minutes window for refresh attempts
  ttl: minutes(15),
  // Allow max 30 refresh attempts within the window before throttling
  limit: 30,

  generateKey: ThrottleKeyFactory.init('refresh')
    .addPerFamilyId()
    .buildGenerateKeyFunction(),
};

export const SignupThrottleConfig: ThrottleConfig = {
  // 1 hour window for signup attempts
  ttl: minutes(60),
  // Allow max 3 signup attempts within the window before throttling
  limit: 3,

  generateKey: ThrottleKeyFactory.init('signup')
    .addPerEmailInBody()
    .addPerIP()
    .buildGenerateKeyFunction(),
};

export const ResetPasswordThrottleConfig: ThrottleConfig = {
  // 30 minutes window for reset password attempts
  ttl: minutes(30),
  // Allow max 5 reset password attempts within the window before throttling
  limit: 5,

  generateKey: ThrottleKeyFactory.init('reset-password')
    .addPerToken()
    .addPerIP()
    .buildGenerateKeyFunction(),
};

export const ResendVerificationEmailThrottleConfig: ThrottleConfig = {
  // 1 hour window for resending verification email attempts
  ttl: minutes(60),
  // Allow max 3 resend verification email attempts within the window before throttling
  limit: 3,

  generateKey: ThrottleKeyFactory.init('resend-verification-email')
    .addPerEmail()
    .buildGenerateKeyFunction(),
};

export const VerifyEmailThrottleConfig: ThrottleConfig = {
  // 30 minutes window for email verification attempts
  ttl: minutes(30),
  // Allow max 10 email verification attempts within the window before throttling
  limit: 10,

  generateKey: ThrottleKeyFactory.init('verify-email')
    .addPerToken()
    .addPerIP()
    .buildGenerateKeyFunction(),
};
