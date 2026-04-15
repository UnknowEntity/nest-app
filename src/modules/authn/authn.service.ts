import { Injectable } from '@nestjs/common';
import { DatabaseService } from 'src/database/database.service';
import {
  passwordResetTokens,
  refreshTokens,
  RequestUser,
  users,
} from 'src/database/schema';
import { and, eq, getTableColumns, isNull, sql } from 'drizzle-orm';
import { Scrypt } from 'src/utils/crypto.util';
import { JwtService } from '@nestjs/jwt';
import { ConfigurationInterface } from 'src/configuration/configuration.interface';
import { ConfigService } from '@nestjs/config';
import {
  CreateRefreshTokenDto,
  ReqForgotPasswordDto,
  ReqSignUpDto,
} from './authn.dto';
import { getCurrentUnixTimestamp, toUnixTimestamp } from 'src/utils/time.util';
import { SelectUser } from '../../database/schema';
import {
  AccountLockedError,
  AccountLockedWarningError,
  InvalidResetTokenError,
  RefreshTokenFamilyInvalidError,
  RefreshTokenMaxAgeExceededError,
  TokenNotFoundError,
  TokenReuseDetectedError,
  UserAlreadyExistsError,
} from 'src/interfaces/error.interface';
const isSameOrBefore =
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  require('dayjs/plugin/isSameOrBefore') as typeof import('dayjs/plugin/isSameOrBefore');
// eslint-disable-next-line @typescript-eslint/no-require-imports
const dayjs = require('dayjs') as typeof import('dayjs');
import {
  DEFAULT_LOCKOUT_DURATION_SECONDS,
  DEFAULT_SIGNIN_ATTEMPTS_BEFORE_LOCKOUT,
  DefaultRole,
  REFRESH_TOKEN_GRACE_PERIOD_BUFFER,
} from 'src/constants/auth.constant';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { MailEventConfig, MailEventEnum } from 'src/mail/mail.constant';
import { ResetPasswordEvent } from 'src/mail/mail.dto';

dayjs.extend(isSameOrBefore);

@Injectable()
export class AuthnService {
  constructor(
    private readonly db: DatabaseService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService<ConfigurationInterface>,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async validateUser(
    email: string,
    password: string,
  ): Promise<RequestUser | null> {
    const [user] = await this.db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .$withCache()
      .execute();

    if (!user) {
      return null;
    }

    // Check for lockout before validating password.
    if (user.lockoutUntil && user.lockoutUntil > getCurrentUnixTimestamp()) {
      throw new AccountLockedError(
        user.lockoutUntil - getCurrentUnixTimestamp(),
      );
    }

    const isPasswordValid = await Scrypt.verify(password, user.password);

    if (!isPasswordValid) {
      await this.updateFailedLoginAttempts(user.id, user.signInAttempts ?? 0);

      // If the failed attempt has just reached the lockout threshold,
      // throw a warning error to indicate there one more failed attempt will lock the account.
      if (user.signInAttempts === DEFAULT_SIGNIN_ATTEMPTS_BEFORE_LOCKOUT - 1) {
        throw new AccountLockedWarningError();
      }

      return null;
    }

    const {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      password: hashPassword,
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      lockoutUntil,
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      signInAttempts,
      ...result
    } = user;

    if (user.signInAttempts && user.signInAttempts > 0) {
      await this.db
        .update(users)
        .set({
          signInAttempts: 0,
          lockoutUntil: null,
        })
        .where(eq(users.id, user.id))
        .execute();
    }

    return result;
  }

  async updateFailedLoginAttempts(userId: number, attempts: number) {
    const currentAttempts = attempts + 1;
    const updateData: Partial<SelectUser> = {
      signInAttempts: currentAttempts,
    };

    // If attempts exceed threshold, set lockoutUntil with exponential backoff.
    if (currentAttempts > DEFAULT_SIGNIN_ATTEMPTS_BEFORE_LOCKOUT) {
      const maxLogoutUntil = toUnixTimestamp(
        dayjs().add(DEFAULT_LOCKOUT_DURATION_SECONDS, 'second').toDate(),
      );
      const lockoutUntil = toUnixTimestamp(
        dayjs()
          .add(
            // Start with 1s lockout after threshold is exceeded,
            // then double for each subsequent attempt
            2 ** (currentAttempts - DEFAULT_SIGNIN_ATTEMPTS_BEFORE_LOCKOUT - 1),
            'second',
          )
          .toDate(),
      );
      updateData.lockoutUntil = Math.min(lockoutUntil, maxLogoutUntil);
    }

    await this.db
      .update(users)
      .set(updateData)
      .where(eq(users.id, userId))
      .execute();
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
    const { password, lockoutUntil, signInAttempts, ...userColumns } =
      getTableColumns(users);

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

  async forgotPassword(dto: ReqForgotPasswordDto) {
    const [user] = await this.db
      .select({
        id: users.id,
        email: users.email,
        name: users.name,
      })
      .from(users)
      .where(eq(users.email, dto.email))
      .$withCache()
      .execute();

    // To prevent email enumeration, we return early even if the user doesn't exist.
    // No error is thrown and the response is the same regardless of whether the email exists or not.
    if (!user) {
      return;
    }

    const { token, expiresAt } = await this.createForgotPasswordToken(user.id);

    await this.db
      .insert(passwordResetTokens)
      .values({
        userId: user.id,
        hashToken: await Scrypt.hash(token),
        expiresAt,
      })
      .execute();

    // Fire-and-forget email sending. We don't want to make the user wait if the email service is slow.
    this.eventEmitter.emit(
      MailEventConfig[MailEventEnum.ResetPassword].event,
      new ResetPasswordEvent({
        name: user.name,
        email: user.email,
        token,
      }),
    );
  }

  getTokenSharedClaims() {
    const auth = this.configService.getOrThrow('auth', {
      infer: true,
    });

    return {
      issuer: auth.issuer,
      audience: auth.audience,
      algorithms: auth.algorithms,
    };
  }

  private async createForgotPasswordToken(
    userId: number,
  ): Promise<{ token: string; expiresAt: number }> {
    const { algorithms, ...sharedClaims } = this.getTokenSharedClaims();

    const forgotPassword = this.configService.getOrThrow(
      'auth.forgot_password',
      {
        infer: true,
      },
    );

    const payload = {
      sub: userId,
      type: 'reset' as const,
    };

    const token = await this.jwtService.signAsync(payload, {
      secret: forgotPassword.secret,
      expiresIn: forgotPassword.expires_in,
      ...sharedClaims,
      algorithm: algorithms[0],
      jwtid: crypto.randomUUID(),
    });

    return {
      token,
      expiresAt: getCurrentUnixTimestamp() + forgotPassword.expires_in,
    };
  }

  async resetPassword(userId: number, token: string, newPassword: string) {
    const [resetToken] = await this.db
      .select({
        id: passwordResetTokens.id,
        usedAt: passwordResetTokens.usedAt,
        hashToken: passwordResetTokens.hashToken,
      })
      .from(passwordResetTokens)
      .where(eq(passwordResetTokens.userId, userId))
      .orderBy(sql`${passwordResetTokens.createdAt} DESC`)
      .limit(1)
      .execute();

    if (!resetToken) {
      throw new TokenNotFoundError();
    }

    const isTokenValid = await Scrypt.verify(token, resetToken.hashToken);

    if (!isTokenValid) {
      throw new InvalidResetTokenError();
    }

    if (resetToken.usedAt) {
      throw new TokenReuseDetectedError();
    }

    await this.db.transaction(async (tx) => {
      const [updateToken] = await tx
        .update(passwordResetTokens)
        .set({
          usedAt: getCurrentUnixTimestamp(),
        })
        .where(
          and(
            eq(passwordResetTokens.id, resetToken.id),
            isNull(passwordResetTokens.usedAt),
          ),
        )
        .returning({
          id: passwordResetTokens.id,
        })
        .execute();

      if (!updateToken) {
        throw new TokenReuseDetectedError();
      }

      const hashedPassword = await Scrypt.hash(newPassword);

      await tx
        .update(users)
        .set({
          password: hashedPassword,
        })
        .where(eq(users.id, userId))
        .execute();

      // Invalidate all existing sessions for this user to force reauth with new password
      await tx
        .delete(refreshTokens)
        .where(eq(refreshTokens.userId, userId))
        .execute();
    });
  }

  private async createAccessToken(userId: number) {
    const { algorithms, ...sharedClaims } = this.getTokenSharedClaims();

    const access = this.configService.getOrThrow('auth.access', {
      infer: true,
    });
    const payload = {
      sub: userId,
      type: 'access' as const,
    };

    return this.jwtService.signAsync(payload, {
      secret: access.secret,
      expiresIn: access.expires_in,
      ...sharedClaims,
      algorithm: algorithms[0],
      jwtid: crypto.randomUUID(),
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
    const { algorithms, ...sharedClaims } = this.getTokenSharedClaims();
    const refresh = this.configService.getOrThrow('auth.refresh', {
      infer: true,
    });

    const payload = { sub: userId, familyId, type: 'refresh' as const };
    const token = await this.jwtService.signAsync(payload, {
      secret: refresh.secret,
      expiresIn: refresh.expires_in,
      ...sharedClaims,
      algorithm: algorithms[0],
      jwtid: crypto.randomUUID(),
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
