import { PASSWORD_POLICY } from 'src/constants/auth.constant';
import * as zod from 'zod';

export const ReqCreateUserSchema = zod.object({
  email: zod.email().transform((str) => str.trim().toLowerCase()),
  name: zod.string().min(2).max(50),
  password: PASSWORD_POLICY,
  role: zod.string().min(2).max(50),
});

export type ReqCreateUserDto = zod.infer<typeof ReqCreateUserSchema>;
