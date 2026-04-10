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
  password: zod
    .string()
    .min(8, 'Password must be at least 8 characters')
    .max(15, 'Password cannot exceed 15 characters')
    .regex(/[A-Z]/, 'Must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Must contain at least one number')
    .regex(/[^a-zA-Z0-9]/, 'Must contain at least one special character'),
});

export type ReqSignUpDto = zod.infer<typeof ReqSignUpSchema>;
