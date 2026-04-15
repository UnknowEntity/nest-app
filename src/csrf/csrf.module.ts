import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import {
  doubleCsrf,
  DoubleCsrfProtection,
  CsrfTokenGenerator,
} from 'csrf-csrf';
import { ConfigurationInterface } from 'src/configuration/configuration.interface';
import { isProduction } from 'src/utils/app.util';
import { CsrfService } from './csrf.service';
import { CSRF_MIDDLEWARE, DOUPLE_CSRF } from './csrf.token';

@Module({
  imports: [ConfigModule],
  providers: [
    {
      provide: DOUPLE_CSRF,
      inject: [ConfigService],
      useFactory: (configService: ConfigService<ConfigurationInterface>) => {
        const production = isProduction();
        const csrfSecret = configService.getOrThrow('app.csrf_secret', {
          infer: true,
        });
        const { doubleCsrfProtection, generateCsrfToken } = doubleCsrf({
          getSecret: () => csrfSecret,
          getSessionIdentifier: (req) =>
            `${req.ip ?? 'unknown'}:${req.get('user-agent') ?? 'unknown'}`,
          cookieName: production
            ? '__Host-psifi.x-csrf-token'
            : 'psifi.x-csrf-token',
          cookieOptions: {
            secure: production,
          },
        });
        return { doubleCsrfProtection, generateCsrfToken };
      },
    },
    {
      provide: CSRF_MIDDLEWARE,
      inject: [DOUPLE_CSRF],
      useFactory: (csrfConfig: {
        doubleCsrfProtection: DoubleCsrfProtection;
        generateCsrfToken: CsrfTokenGenerator;
      }) => {
        return csrfConfig.doubleCsrfProtection;
      },
    },
    CsrfService,
  ],
  exports: [CsrfService, CSRF_MIDDLEWARE],
})
export class CsrfModule {}
