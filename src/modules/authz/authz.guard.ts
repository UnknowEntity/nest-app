import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { AuthzService } from './authz.service';
import { AuthRequest } from 'src/interfaces/auth.interface';
import { Logger } from 'winston';
import { MasterLogger } from 'src/logger/logger';

@Injectable()
export class AuthzGuard implements CanActivate {
  authzLogger: Logger;
  constructor(private readonly authzService: AuthzService) {
    this.authzLogger = MasterLogger.child({ label: 'AuthzGuard' });
  }
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const ctx = context.switchToHttp();
    const request = ctx.getRequest<AuthRequest>();

    const object = request.url;
    const action = request.method;
    const subject = request.user.role;
    const isValid = await this.authzService.enforce(subject, object, action);

    if (!isValid) {
      this.authzLogger.warn(
        `Access denied for user ${subject} on ${object} with action ${action}`,
        {
          path: request.path,
          method: request.method,
          userRole: subject,
          email: request.user.email,
        },
      );
    }

    return isValid;
  }
}
