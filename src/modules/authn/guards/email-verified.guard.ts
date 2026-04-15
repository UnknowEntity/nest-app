import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { AuthRequest } from 'src/interfaces/auth.interface';
import { Logger } from 'winston';
import { MasterLogger } from 'src/logger/logger';
import { EmailNotVerifiedError } from 'src/interfaces/error.interface';

@Injectable()
export class EmailVerifiedGuard implements CanActivate {
  authzLogger: Logger;
  constructor() {
    this.authzLogger = MasterLogger.child({ label: 'EmailVerifiedGuard' });
  }

  canActivate(context: ExecutionContext): boolean {
    const ctx = context.switchToHttp();
    const request = ctx.getRequest<AuthRequest>();

    if (!request.user.verifiedAt) {
      this.authzLogger.warn(
        `Access denied for user ${request.user.email} because email is not verified`,
        {
          path: request.path,
          method: request.method,
          email: request.user.email,
        },
      );
      throw new EmailNotVerifiedError();
    }

    return true;
  }
}
