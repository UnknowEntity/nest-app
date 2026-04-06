export type AccessTokenPayload = {
  sub: number; // user ID
};

export type RefreshTokenPayload = {
  sub: number; // user ID
  familyId: string; // refresh token family ID
};
