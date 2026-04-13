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

@Injectable()
export class JwtRefreshStrategy extends PassportStrategy(
  Strategy,
  JWT_REFRESH_STRATEGY_NAME,
) {
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
      issuer: configService.getOrThrow('auth.refresh.issuer', {
        infer: true,
      }),
      audience: configService.getOrThrow('auth.refresh.audience', {
        infer: true,
      }),
      algorithms: configService.getOrThrow('auth.refresh.algorithms', {
        infer: true,
      }),
    });
  }

  async validate(payload: RefreshTokenPayload) {
    const result = RefreshTokenPayloadSchema.safeParse(payload);

    if (!result.success) {
      throw new JwtInvalidError();
    }

    const claims = result.data;

    const user = await this.authnService.getUserById(claims.sub);

    if (!user) {
      throw new UserIdNotFoundError();
    }

    return {
      ...user,
      familyId: claims.familyId,
    };
  }
}
