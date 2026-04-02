import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { DatabaseModule } from 'src/database/database.module';
import { AuthService } from './auth.service';
import { LocalStrategy } from './strategies/local.strategy';
import { JwtModule } from '@nestjs/jwt';
import { JwtAccessStrategy } from './strategies/jwt-access.strategy';
import { AuthController } from './auth.controller';
import { ConfigModule } from '@nestjs/config';

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
  providers: [AuthService, LocalStrategy, JwtAccessStrategy],
  controllers: [AuthController],
})
export class AuthModule {}
