import { ExceptionFilter, Catch, ArgumentsHost } from '@nestjs/common';
import { Request, Response } from 'express';
import { HttpError } from 'http-errors';
import { MasterLogger } from 'src/logger/logger';
import { Logger } from 'winston';

@Catch(HttpError)
export class CsrfExceptionFilter implements ExceptionFilter {
  private logger: Logger;
  constructor() {
    this.logger = MasterLogger.child({ label: 'CsrfExceptionFilter' });
  }

  catch(exception: HttpError, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    const status = exception.status || 500;
    const code = 'CSRF_ERROR';

    this.logger.error(`HTTP Exception: ${exception.message}`, {
      status,
      code,
      path: request.url,
      method: request.method,
    });

    response.status(status).json({
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      code,
      message: exception.message,
    });
  }
}
