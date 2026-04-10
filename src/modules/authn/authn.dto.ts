import { PASSWORD_POLICY } from 'src/constants/auth.constant';
import { RequestUser } from 'src/database/schema';
import * as zod from 'zod';

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

export const ReqSignUpSchema = zod.object({
  email: zod.email().transform((str) => str.trim().toLowerCase()),
  name: zod.string().min(2).max(50),
  password: PASSWORD_POLICY,
});

export type ReqSignUpDto = zod.infer<typeof ReqSignUpSchema>;
