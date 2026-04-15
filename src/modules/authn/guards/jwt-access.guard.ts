import { ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';
import { Observable } from 'rxjs';
import { JWT_ACCESS_STRATEGY_NAME } from 'src/constants/auth.constant';
import { SKIP_AUTHN } from 'src/decorators/auth.decorator';
import { JwtInvalidError } from 'src/interfaces/error.interface';

@Injectable()
export class JwtAccessGuard extends AuthGuard(JWT_ACCESS_STRATEGY_NAME) {
  constructor(private reflector: Reflector) {
    super();
  }

  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    const skipAuthn = this.reflector.getAllAndOverride<boolean>(SKIP_AUTHN, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (skipAuthn) {
      return true;
    }

    return super.canActivate(context);
  }
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  handleRequest(err: any, user: any, info: any): any {
    // You can throw an exception based on either "info" or "err" arguments
    if (err || !user) {
      throw err || new JwtInvalidError();
    }
    return user;
  }
}
