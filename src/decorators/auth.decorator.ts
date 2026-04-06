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

export const Token = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest<Request>();

    const authHeader = request.headers['authorization'] as string | undefined;
    if (!authHeader) {
      return null;
    }

    const [, token] = authHeader.split(' ');
    return token;
  },
);
