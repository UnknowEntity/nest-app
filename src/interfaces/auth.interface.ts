import { SelectUser } from 'src/database/schema';

export type AccessTokenPayload = {
  sub: number; // user ID
};

export type RefreshTokenPayload = {
  sub: number; // user ID
  familyId: string; // refresh token family ID
};

export type AuthRequest = Request & {
  user: SelectUser;
};
