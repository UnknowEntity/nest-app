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

export type AuthRequest = Request & {
  user: SelectUser;
};
