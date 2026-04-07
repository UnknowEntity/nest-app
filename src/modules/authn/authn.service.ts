import { Injectable } from '@nestjs/common';
import { DatabaseService } from 'src/database/database.service';
import { refreshTokens, RequestUser, users } from 'src/database/schema';
import { and, eq, getTableColumns, sql } from 'drizzle-orm';
import { Scrypt } from 'src/utils/crypto.util';
import { JwtService } from '@nestjs/jwt';
import { ConfigurationInterface } from 'src/configuration/configuration.interface';
import { ConfigService } from '@nestjs/config';
import { CreateRefreshTokenDto } from './authn.dto';
import { getCurrentUnixTimestamp, toUnixTimestamp } from 'src/utils/time.util';
import {
  RefreshTokenFamilyInvalidError,
  RefreshTokenMaxAgeExceededError,
} from 'src/interfaces/error.interface';

@Injectable()
export class AuthnService {
  constructor(
    private readonly db: DatabaseService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService<ConfigurationInterface>,
  ) {}

  async validateUser(
    email: string,
    password: string,
  ): Promise<RequestUser | null> {
    const [user] = await this.db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .execute();

    if (!user) {
      return null;
    }

    const isPasswordValid = await Scrypt.verify(password, user.password);
    if (!isPasswordValid) {
      return null;
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password: _, ...result } = user;

    return result;
  }

  async login(user: RequestUser) {
    const [refreshToken, accessToken] = await Promise.all([
      this.createRefreshToken({ userId: user.id }),
      this.createAccessToken(user.id),
    ]);

    return { refreshToken, accessToken };
  }

  async refresh(
    user: RequestUser,
    currentRefreshToken: string,
    familyId: string,
  ) {
    const [refreshToken, accessToken] = await Promise.all([
      this.createRefreshToken({
        userId: user.id,
        withFamily: {
          id: familyId,
          token: currentRefreshToken,
        },
      }),
      this.createAccessToken(user.id),
    ]);

    return { refreshToken, accessToken };
  }

  async getUserById(id: number): Promise<RequestUser | null> {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password, ...userColumns } = getTableColumns(users);

    const [user] = await this.db
      .select(userColumns)
      .from(users)
      .where(eq(users.id, id))
      .limit(1)
      .execute();

    return user;
  }

  private async createAccessToken(userId: number) {
    const payload = { sub: userId };
    return this.jwtService.signAsync(payload, {
      secret: this.configService.getOrThrow('auth.access.secret', {
        infer: true,
      }),
      expiresIn: this.configService.getOrThrow('auth.access.expires_in', {
        infer: true,
      }),
    });
  }

  private async createRefreshToken({
    userId,
    withFamily,
  }: CreateRefreshTokenDto) {
    // If withFamily is provided, it means we are trying to reuse an existing refresh token family.
    if (withFamily) {
      const { id, token } = withFamily;

      const [latestRefreshToken] = await this.db
        .select({
          token: refreshTokens.token,
          maxExpiresAt: refreshTokens.maxExpiresAt,
        })
        .from(refreshTokens)
        .where(
          and(eq(refreshTokens.userId, userId), eq(refreshTokens.familyId, id)),
        )
        .orderBy(sql`${refreshTokens.createdAt} DESC`)
        .limit(1)
        .execute();

      // If the provided token doesn't match the latest token in the family,
      // it means the family has been compromised.
      if (!latestRefreshToken || latestRefreshToken.token !== token) {
        await this.db
          .delete(refreshTokens)
          .where(
            and(
              eq(refreshTokens.userId, userId),
              eq(refreshTokens.familyId, id),
            ),
          )
          .execute();

        throw new RefreshTokenFamilyInvalidError();
      }

      // If the latest refresh token in the family has expired,
      // we also consider the family compromised and delete it.
      if (getCurrentUnixTimestamp() > latestRefreshToken.maxExpiresAt) {
        await this.db
          .delete(refreshTokens)
          .where(
            and(
              eq(refreshTokens.userId, userId),
              eq(refreshTokens.familyId, id),
            ),
          )
          .execute();

        throw new RefreshTokenMaxAgeExceededError();
      }
    } else {
      // If withFamily is not provided, we create a new refresh token family.
      withFamily = {
        id: crypto.randomUUID(),
        token: '',
      };
    }

    const refresh = this.configService.getOrThrow('auth.refresh', {
      infer: true,
    });

    const payload = { sub: userId, familyId: withFamily.id };
    const token = await this.jwtService.signAsync(payload, {
      secret: refresh.secret,
      expiresIn: refresh.expires_in,
    });

    await this.db.insert(refreshTokens).values({
      userId,
      familyId: withFamily.id,
      token,
      maxExpiresAt: toUnixTimestamp(
        new Date(Date.now() + refresh.max_expires_in * 1000),
      ),
    });

    return token;
  }
}
