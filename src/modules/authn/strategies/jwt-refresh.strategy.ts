import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable } from '@nestjs/common';
import { ConfigurationInterface } from 'src/configuration/configuration.interface';
import {
  RefreshTokenPayload,
  RefreshTokenPayloadSchema,
} from 'src/interfaces/auth.interface';
import { JWT_REFRESH_STRATEGY_NAME } from 'src/constants/auth.constant';
import { ConfigService } from '@nestjs/config';
import { AuthnService } from '../authn.service';
import {
  JwtInvalidError,
  UserIdNotFoundError,
} from 'src/interfaces/error.interface';
import { Logger } from 'winston';
import { MasterLogger } from 'src/logger/logger';

@Injectable()
export class JwtRefreshStrategy extends PassportStrategy(
  Strategy,
  JWT_REFRESH_STRATEGY_NAME,
) {
  logger: Logger;
  constructor(
    private readonly configService: ConfigService<ConfigurationInterface>,
    private readonly authnService: AuthnService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.getOrThrow('auth.refresh.secret', {
        infer: true,
      }),
      ...authnService.getTokenSharedClaims(),
    });

    this.logger = MasterLogger.child({ label: JwtRefreshStrategy.name });
  }

  async validate(payload: RefreshTokenPayload) {
    const result = RefreshTokenPayloadSchema.safeParse(payload);

    if (!result.success) {
      this.logger.warn(
        `Invalid JWT payload for refresh token: ${result.error}`,
      );
      throw new JwtInvalidError();
    }

    const claims = result.data;

    const user = await this.authnService.getUserById(claims.sub);

    if (!user) {
      this.logger.warn(`User ID ${claims.sub} not found for refresh token`);
      throw new UserIdNotFoundError();
    }

    return {
      ...user,
      familyId: claims.familyId,
    };
  }
}
