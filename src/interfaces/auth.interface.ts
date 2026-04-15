import { SelectUser } from 'src/database/schema';
import { Request } from 'express';
import * as zod from 'zod';

export const AccessTokenPayloadSchema = zod.object({
  sub: zod.number(),
  jti: zod.string(),
  type: zod.literal('access'),
});

export type AccessTokenPayload = zod.infer<typeof AccessTokenPayloadSchema>;

export const RefreshTokenPayloadSchema = zod.object({
  sub: zod.number(),
  jti: zod.string(),
  type: zod.literal('refresh'),
  familyId: zod.string(),
});

export type RefreshTokenPayload = zod.infer<typeof RefreshTokenPayloadSchema>;

export const ResetPasswordTokenPayloadSchema = zod.object({
  sub: zod.number(),
  jti: zod.string(),
  type: zod.literal('reset'),
});

export type ResetPasswordTokenPayload = zod.infer<
  typeof ResetPasswordTokenPayloadSchema
>;

export const EmailVerificationTokenPayloadSchema = zod.object({
  sub: zod.number(),
  jti: zod.string(),
  type: zod.literal('email_verification'),
});

export type EmailVerificationTokenPayload = zod.infer<
  typeof EmailVerificationTokenPayloadSchema
>;

export type AuthRequest = Request & {
  user: SelectUser;
};
