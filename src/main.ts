import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './exception-filters/http.exception-filter';
import { ValidationExceptionFilter } from './exception-filters/validation.exception-filter';
import helmet from 'helmet';
import { DoubleCsrfProtection } from 'csrf-csrf';
// eslint-disable-next-line @typescript-eslint/no-require-imports
import cookieParser = require('cookie-parser');
import { CsrfExceptionFilter } from './exception-filters/csrf.exception-filter';
import { InternalExceptionFilter } from './exception-filters/internal.exception-filter';
import { CSRF_MIDDLEWARE } from './csrf/csrf.token';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const doubleCsrfProtection = app.get<DoubleCsrfProtection>(CSRF_MIDDLEWARE);

  app.use(helmet());
  app.use(cookieParser());
  app.use(doubleCsrfProtection);
  app.enableCors({
    origin: process.env.ALLOWED_ORIGINS?.split(',') || [
      'http://localhost:3000',
    ],
    credentials: true,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    allowedHeaders: 'Content-Type,Authorization',
  });

  app.useGlobalFilters(
    new InternalExceptionFilter(),
    new CsrfExceptionFilter(),
    new HttpExceptionFilter(),
    new ValidationExceptionFilter(),
  );

  await app.listen(process.env.PORT ?? 3000);
}
void bootstrap();
