import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable } from '@nestjs/common';
import { ConfigurationInterface } from 'src/configuration/configuration.interface';
import { AccessTokenPayload } from 'src/interfaces/auth.interface';
import { DatabaseService } from 'src/database/database.service';
import { JWT_ACCESS_STRATEGY_NAME } from 'src/constants/auth.constant';
import { ConfigService } from '@nestjs/config';
import { AuthnService } from '../authn.service';
import { UserIdNotFoundError } from 'src/interfaces/error.interface';

@Injectable()
export class JwtAccessStrategy extends PassportStrategy(
  Strategy,
  JWT_ACCESS_STRATEGY_NAME,
) {
  constructor(
    private readonly configService: ConfigService<ConfigurationInterface>,
    private readonly db: DatabaseService,
    private readonly authnService: AuthnService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.getOrThrow('auth.access.secret', {
        infer: true,
      }),
    });
  }

  async validate(payload: AccessTokenPayload) {
    const user = await this.authnService.getUserById(payload.sub);
    if (!user) {
      throw new UserIdNotFoundError();
    }
    return user;
  }
}
