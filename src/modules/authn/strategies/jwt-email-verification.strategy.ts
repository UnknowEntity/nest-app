import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable } from '@nestjs/common';
import { ConfigurationInterface } from 'src/configuration/configuration.interface';
import {
  EmailVerificationTokenPayload,
  EmailVerificationTokenPayloadSchema,
} from 'src/interfaces/auth.interface';
import { ConfigService } from '@nestjs/config';
import { AuthnService } from '../authn.service';
import { JWT_EMAIL_VERIFICATION_STRATEGY_NAME } from '../../../constants/auth.constant';
import {
  JwtInvalidError,
  UserIdNotFoundError,
} from 'src/interfaces/error.interface';
import { Logger } from 'winston';
import { MasterLogger } from 'src/logger/logger';

@Injectable()
export class JwtEmailVerificationStrategy extends PassportStrategy(
  Strategy,
  JWT_EMAIL_VERIFICATION_STRATEGY_NAME,
) {
  logger: Logger;
  constructor(
    private readonly configService: ConfigService<ConfigurationInterface>,
    private readonly authnService: AuthnService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.getOrThrow('auth.email_verification.secret', {
        infer: true,
      }),
      ...authnService.getTokenSharedClaims(),
    });

    this.logger = MasterLogger.child({
      label: JwtEmailVerificationStrategy.name,
    });
  }

  async validate(payload: EmailVerificationTokenPayload) {
    const result = EmailVerificationTokenPayloadSchema.safeParse(payload);

    if (!result.success) {
      this.logger.warn(
        `Invalid JWT payload for email verification: ${result.error}`,
      );
      throw new JwtInvalidError();
    }

    const claims = result.data;

    const user = await this.authnService.getUserById(claims.sub);

    if (!user) {
      this.logger.warn(
        `User ID ${claims.sub} not found for email verification`,
      );
      throw new UserIdNotFoundError();
    }

    return user;
  }
}
