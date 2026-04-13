import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable } from '@nestjs/common';
import { ConfigurationInterface } from 'src/configuration/configuration.interface';
import {
  AccessTokenPayload,
  AccessTokenPayloadSchema,
} from 'src/interfaces/auth.interface';
import { JWT_ACCESS_STRATEGY_NAME } from 'src/constants/auth.constant';
import { ConfigService } from '@nestjs/config';
import { AuthnService } from '../authn.service';
import {
  JwtInvalidError,
  UserIdNotFoundError,
} from 'src/interfaces/error.interface';

@Injectable()
export class JwtAccessStrategy extends PassportStrategy(
  Strategy,
  JWT_ACCESS_STRATEGY_NAME,
) {
  constructor(
    private readonly configService: ConfigService<ConfigurationInterface>,
    private readonly authnService: AuthnService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.getOrThrow('auth.access.secret', {
        infer: true,
      }),
      ...authnService.getTokenSharedClaims(),
    });
  }

  async validate(payload: AccessTokenPayload) {
    const result = AccessTokenPayloadSchema.safeParse(payload);

    if (!result.success) {
      throw new JwtInvalidError();
    }

    const claims = result.data;

    const user = await this.authnService.getUserById(claims.sub);
    if (!user) {
      throw new UserIdNotFoundError();
    }
    return user;
  }
}
