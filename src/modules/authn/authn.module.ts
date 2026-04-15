import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { DatabaseModule } from 'src/database/database.module';
import { AuthnService } from './authn.service';
import { LocalStrategy } from './strategies/local.strategy';
import { JwtModule } from '@nestjs/jwt';
import { JwtAccessStrategy } from './strategies/jwt-access.strategy';
import { AuthnController } from './authn.controller';
import { ConfigModule } from '@nestjs/config';
import { JwtRefreshStrategy } from './strategies/jwt-refresh.strategy';
import { JwtResetPasswordStrategy } from './strategies/jwt-reset-password.strategy';
import { JwtEmailVerificationStrategy } from './strategies/jwt-email-verification.strategy';
import { APP_GUARD } from '@nestjs/core';
import { JwtAccessGuard } from './guards/jwt-access.guard';

@Module({
  imports: [
    DatabaseModule,
    PassportModule,
    // Use dummy values for secret and expiresIn,
    // these should be overridden when using the service method
    JwtModule.register({
      secret: 'DUMMY_SECRET_KEY',
      signOptions: { expiresIn: '60s' },
    }),
    ConfigModule,
  ],
  providers: [
    AuthnService,
    LocalStrategy,
    JwtAccessStrategy,
    JwtRefreshStrategy,
    JwtResetPasswordStrategy,
    JwtEmailVerificationStrategy,
    {
      provide: APP_GUARD,
      useClass: JwtAccessGuard,
    },
  ],
  controllers: [AuthnController],
})
export class AuthnModule {}
