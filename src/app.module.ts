import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DatabaseModule } from './database/database.module';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { seconds, ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import configuration from './configuration/configuration';
import { AuthnModule } from './modules/authn/authn.module';
import { AuthzModule } from './modules/authz/authz.module';
import { UserModule } from './modules/user/user.module';
import { ConfigurationInterface } from './configuration/configuration.interface';
import { APP_GUARD } from '@nestjs/core';
import { MailModule } from './mail/mail.module';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { CsrfModule } from './csrf/csrf.module';
import { CacheService } from './cache/cache.service';
import { CacheModule } from './cache/cache.module';
import { TerminusModule } from '@nestjs/terminus';

@Module({
  imports: [
    ConfigModule.forRoot({
      load: [configuration],
    }),
    ThrottlerModule.forRootAsync({
      useFactory: (
        configService: ConfigService<ConfigurationInterface>,
        cacheService: CacheService,
      ) => {
        const rate_limit = configService.getOrThrow('rate_limit', {
          infer: true,
        });

        return {
          throttlers: [
            {
              ttl: seconds(rate_limit.ttl_seconds), // Convert seconds to milliseconds
              limit: rate_limit.max_requests_per_window,
            },
          ],
          storage: cacheService.getOrCreateThrottleClient(),
        };
      },
      inject: [ConfigService, CacheService],
      imports: [ConfigModule, CacheModule],
    }),
    CsrfModule,
    EventEmitterModule.forRoot(),
    DatabaseModule,
    AuthnModule,
    AuthzModule,
    UserModule,
    MailModule,
    CacheModule,
    TerminusModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
    CacheService,
  ],
})
export class AppModule {}
