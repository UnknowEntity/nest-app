import { Injectable } from '@nestjs/common';
import { DatabaseService } from 'src/database/database.service';
import { refreshTokens, RequestUser, users } from 'src/database/schema';
import { and, eq, getTableColumns, sql } from 'drizzle-orm';
import { Scrypt } from 'src/utils/crypto.util';
import { JwtService } from '@nestjs/jwt';
import { ConfigurationInterface } from 'src/configuration/configuration.interface';
import { ConfigService } from '@nestjs/config';
import { CreateRefreshTokenDto, ReqSignUpDto } from './authn.dto';
import { getCurrentUnixTimestamp, toUnixTimestamp } from 'src/utils/time.util';
import {
  RefreshTokenFamilyInvalidError,
  RefreshTokenMaxAgeExceededError,
  UserAlreadyExistsError,
} from 'src/interfaces/error.interface';
const isSameOrBefore =
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  require('dayjs/plugin/isSameOrBefore') as typeof import('dayjs/plugin/isSameOrBefore');
// eslint-disable-next-line @typescript-eslint/no-require-imports
const dayjs = require('dayjs') as typeof import('dayjs');
import {
  DefaultRole,
  REFRESH_TOKEN_GRACE_PERIOD_BUFFER,
} from 'src/constants/auth.constant';

dayjs.extend(isSameOrBefore);

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
      .$withCache()
      .execute();

    return user;
  }

  async signup(dto: ReqSignUpDto) {
    // Query only the 'id' column to minimize data retrieval
    // since we only need to check existence
    const existingUser = await this.db
      .select({
        id: users.id,
      })
      .from(users)
      .where(eq(users.email, dto.email))
      .limit(1)
      .execute();

    if (existingUser.length > 0) {
      throw new UserAlreadyExistsError();
    }

    const hashedPassword = await Scrypt.hash(dto.password);

    const [newUser] = await this.db
      .insert(users)
      .values({
        email: dto.email,
        name: dto.name,
        password: hashedPassword,
        role: DefaultRole.Guest, // default role
      })
      .returning({
        id: users.id,
        email: users.email,
        name: users.name,
        role: users.role,
      })
      .execute();

    return newUser;
  }

  async logout(userId: number, familyId: string) {
    await this.db
      .delete(refreshTokens)
      .where(
        and(
          eq(refreshTokens.userId, userId),
          eq(refreshTokens.familyId, familyId),
        ),
      )
      .execute();
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
    // New family: create a fresh token
    if (!withFamily) {
      return this.generateAndStoreNewToken(userId, crypto.randomUUID());
    }

    // Existing family: validate and check grace period
    const { isLatestToken, latestTokenData, withinGracePeriod } =
      await this.validateAndCheckGracePeriod(userId, withFamily);

    // Stale token retried within grace period: return the latest token.
    // This makes refresh idempotent for client retries/network races.
    if (withinGracePeriod && !isLatestToken) {
      return latestTokenData.token;
    }

    // Latest token reuse (inside or outside grace period): rotate to a new token.
    return this.generateAndStoreNewToken(userId, withFamily.id);
  }

  private async validateAndCheckGracePeriod(
    userId: number,
    withFamily: { id: string; token: string },
  ) {
    const latestTokenData = await this.fetchLatestFamilyToken(
      userId,
      withFamily.id,
    );

    // Family doesn't exist
    if (!latestTokenData) {
      await this.removeRefreshTokenFamily(userId, withFamily.id);
      throw new RefreshTokenFamilyInvalidError();
    }

    // Check if family has exceeded max age
    if (getCurrentUnixTimestamp() > latestTokenData.maxExpiresAt) {
      await this.removeRefreshTokenFamily(userId, withFamily.id);
      throw new RefreshTokenMaxAgeExceededError();
    }

    // Check if request is within grace period of last token rotation
    const withinGracePeriod = this.isWithinGracePeriod(
      latestTokenData.createdAt,
    );
    const isLatestToken = latestTokenData.token === withFamily.token;

    // Token mismatch outside grace period = potential compromise (replay attack)
    if (!withinGracePeriod && !isLatestToken) {
      await this.removeRefreshTokenFamily(userId, withFamily.id);
      throw new RefreshTokenFamilyInvalidError();
    }

    return { isLatestToken, latestTokenData, withinGracePeriod };
  }

  private async fetchLatestFamilyToken(
    userId: number,
    familyId: string,
  ): Promise<{
    token: string;
    maxExpiresAt: number;
    createdAt: Date | null;
  } | null> {
    const [result] = await this.db
      .select({
        token: refreshTokens.token,
        maxExpiresAt: refreshTokens.maxExpiresAt,
        createdAt: refreshTokens.createdAt,
      })
      .from(refreshTokens)
      .where(
        and(
          eq(refreshTokens.userId, userId),
          eq(refreshTokens.familyId, familyId),
        ),
      )
      .orderBy(sql`${refreshTokens.createdAt} DESC`)
      .limit(1)
      .execute();

    return result || null;
  }

  private isWithinGracePeriod(tokenCreatedAt: Date | null): boolean {
    if (!tokenCreatedAt) {
      return false;
    }
    return dayjs().isSameOrBefore(
      dayjs(tokenCreatedAt).add(REFRESH_TOKEN_GRACE_PERIOD_BUFFER, 'second'),
    );
  }

  private async generateAndStoreNewToken(
    userId: number,
    familyId: string,
  ): Promise<string> {
    const refresh = this.configService.getOrThrow('auth.refresh', {
      infer: true,
    });

    const payload = { sub: userId, familyId };
    const token = await this.jwtService.signAsync(payload, {
      secret: refresh.secret,
      expiresIn: refresh.expires_in,
    });

    await this.db.insert(refreshTokens).values({
      userId,
      familyId,
      token,
      maxExpiresAt: toUnixTimestamp(
        new Date(Date.now() + refresh.max_expires_in * 1000),
      ),
    });

    return token;
  }

  private async removeRefreshTokenFamily(userId: number, familyId: string) {
    await this.db
      .delete(refreshTokens)
      .where(
        and(
          eq(refreshTokens.userId, userId),
          eq(refreshTokens.familyId, familyId),
        ),
      )
      .execute();
  }
}
