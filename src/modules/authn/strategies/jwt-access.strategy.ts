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
import { Logger } from 'winston';
import { MasterLogger } from 'src/logger/logger';

@Injectable()
export class JwtAccessStrategy extends PassportStrategy(
  Strategy,
  JWT_ACCESS_STRATEGY_NAME,
) {
  logger: Logger;
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

    this.logger = MasterLogger.child({ label: JwtAccessStrategy.name });
  }

  async validate(payload: AccessTokenPayload) {
    const result = AccessTokenPayloadSchema.safeParse(payload);

    if (!result.success) {
      this.logger.warn(`Invalid JWT payload for access token: ${result.error}`);
      throw new JwtInvalidError();
    }

    const claims = result.data;

    const user = await this.authnService.getUserById(claims.sub);
    if (!user) {
      this.logger.warn(`User ID ${claims.sub} not found for access token`);
      throw new UserIdNotFoundError();
    }
    return user;
  }
}
