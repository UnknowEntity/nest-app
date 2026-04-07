import { RequestUser } from 'src/database/schema';

export type CreateRefreshTokenDto = {
  userId: number;

  withFamily?: {
    id: string;
    token: string;
  };
};

export type RefreshRequestUser = RequestUser & {
  familyId: string;
};
