import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { AuthzService } from './authz.service';
import { AuthRequest } from 'src/interfaces/auth.interface';

@Injectable()
export class AuthzGuard implements CanActivate {
  constructor(private readonly authzService: AuthzService) {}
  canActivate(context: ExecutionContext): Promise<boolean> {
    const ctx = context.switchToHttp();
    const request = ctx.getRequest<AuthRequest>();

    const object = request.url;
    const action = request.method;
    const subject = request.user.id.toString();
    return this.authzService.enforce(subject, object, action);
  }
}
