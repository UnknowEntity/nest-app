import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable } from '@nestjs/common';
import { ConfigurationInterface } from 'src/configuration/configuration.interface';
import { AccessTokenPayload } from 'src/interfaces/auth.interface';
import { DatabaseService } from 'src/database/database.service';
import { eq, getTableColumns } from 'drizzle-orm';
import { users } from 'src/database/schema';
import { JWT_ACCESS_STRATEGY_NAME } from 'src/constants/auth.constant';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class JwtAccessStrategy extends PassportStrategy(
  Strategy,
  JWT_ACCESS_STRATEGY_NAME,
) {
  constructor(
    private readonly configService: ConfigService<ConfigurationInterface>,
    private readonly db: DatabaseService,
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
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password, ...userColumns } = getTableColumns(users);

    const [user] = await this.db
      .select(userColumns)
      .from(users)
      .where(eq(users.id, payload.sub))
      .limit(1);

    return user;
  }
}
