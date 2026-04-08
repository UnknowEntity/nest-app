import { Strategy } from 'passport-local';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable } from '@nestjs/common';
import { AuthnService } from '../authn.service';
import { InvalidCredentialsError } from 'src/interfaces/error.interface';

@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy) {
  constructor(private authnService: AuthnService) {
    super({ usernameField: 'email' }); // Use 'email' instead of 'username'
  }

  async validate(email: string, password: string): Promise<any> {
    const user = await this.authnService.validateUser(email, password);
    if (!user) {
      throw new InvalidCredentialsError();
    }
    return user;
  }
}
