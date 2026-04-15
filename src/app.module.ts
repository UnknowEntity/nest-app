import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DatabaseModule } from './database/database.module';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import configuration from './configuration/configuration';
import { AuthnModule } from './modules/authn/authn.module';
import { AuthzModule } from './modules/authz/authz.module';
import { UserModule } from './modules/user/user.module';
import { ConfigurationInterface } from './configuration/configuration.interface';
import { APP_GUARD } from '@nestjs/core';
import { MailModule } from './mail/mail.module';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { CsrfModule } from './csrf/csrf.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      load: [configuration],
    }),
    ThrottlerModule.forRootAsync({
      useFactory: (configService: ConfigService<ConfigurationInterface>) => {
        const rate_limit = configService.getOrThrow('rate_limit', {
          infer: true,
        });

        return {
          throttlers: [
            {
              ttl: rate_limit.ttl_seconds * 1000, // Convert seconds to milliseconds
              limit: rate_limit.max_requests_per_window,
            },
          ],
        };
      },
      inject: [ConfigService],
      imports: [ConfigModule],
    }),
    CsrfModule,
    EventEmitterModule.forRoot(),
    DatabaseModule,
    AuthnModule,
    AuthzModule,
    UserModule,
    MailModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
