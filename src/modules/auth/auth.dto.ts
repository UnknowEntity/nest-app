import { RequestUser } from 'src/database/schema';

export class CreateRefreshTokenDto {
  userId: number;

  withFamily?: {
    id: string;
    token: string;
  };
}

export type RefreshRequestUser = RequestUser & {
  familyId: string;
};
