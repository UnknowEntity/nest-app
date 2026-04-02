import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { RequestUser } from 'src/database/schema';

export const User = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx
      .switchToHttp()
      .getRequest<Request & { user: RequestUser }>();
    return request.user;
  },
);
