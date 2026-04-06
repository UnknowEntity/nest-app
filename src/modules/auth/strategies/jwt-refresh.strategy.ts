import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable } from '@nestjs/common';
import { ConfigurationInterface } from 'src/configuration/configuration.interface';
import { RefreshTokenPayload } from 'src/interfaces/auth.interface';
import { DatabaseService } from 'src/database/database.service';
import { JWT_REFRESH_STRATEGY_NAME } from 'src/constants/auth.constant';
import { ConfigService } from '@nestjs/config';
import { AuthService } from '../auth.service';
import { UserIdNotFoundError } from 'src/interfaces/error.interface';

@Injectable()
export class JwtRefreshStrategy extends PassportStrategy(
  Strategy,
  JWT_REFRESH_STRATEGY_NAME,
) {
  constructor(
    private readonly configService: ConfigService<ConfigurationInterface>,
    private readonly db: DatabaseService,
    private readonly authService: AuthService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.getOrThrow('auth.refresh.secret', {
        infer: true,
      }),
    });
  }

  async validate(payload: RefreshTokenPayload) {
    const user = await this.authService.getUserById(payload.sub);

    if (!user) {
      throw new UserIdNotFoundError();
    }

    return {
      ...user,
      familyId: payload.familyId,
    };
  }
}
