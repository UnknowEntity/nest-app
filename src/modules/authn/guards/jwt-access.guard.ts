import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { JWT_ACCESS_STRATEGY_NAME } from 'src/constants/auth.constant';
import { JwtInvalidError } from 'src/interfaces/error.interface';

@Injectable()
export class JwtAccessGuard extends AuthGuard(JWT_ACCESS_STRATEGY_NAME) {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  handleRequest(err: any, user: any, info: any): any {
    // You can throw an exception based on either "info" or "err" arguments
    if (err || !user) {
      throw err || new JwtInvalidError();
    }
    return user;
  }
}
