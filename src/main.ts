import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './exception-filters/http.exception-filter';
import { ValidationExceptionFilter } from './exception-filters/validation.exception-filter';
import { ConfigService } from '@nestjs/config';
import { ConfigurationInterface } from './configuration/configuration.interface';
import helmet from 'helmet';
import { doubleCsrf } from 'csrf-csrf';
// eslint-disable-next-line @typescript-eslint/no-require-imports
import cookieParser = require('cookie-parser');
import { isProduction } from './utils/app.util';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService<ConfigurationInterface>);
  const csrfSecret = configService.getOrThrow('app.csrf_secret', {
    infer: true,
  });

  const { doubleCsrfProtection } = doubleCsrf({
    getSecret: () => csrfSecret,
    getSessionIdentifier: (req) =>
      `${req.ip ?? 'unknown'}:${req.get('user-agent') ?? 'unknown'}`,
    cookieOptions: {
      secure: isProduction(),
    },
  });

  app.useGlobalFilters(
    new HttpExceptionFilter(),
    new ValidationExceptionFilter(),
  );
  app.use(helmet());
  app.use(cookieParser());
  app.use(doubleCsrfProtection);
  app.enableCors();

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
