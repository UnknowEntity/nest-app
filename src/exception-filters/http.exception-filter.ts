import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { MasterLogger } from 'src/logger/logger';
import { Logger } from 'winston';

@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  private logger: Logger;
  constructor() {
    this.logger = MasterLogger.child({ label: 'HttpExceptionFilter' });
  }

  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    const status = exception.getStatus();

    if (
      exception instanceof ServiceUnavailableException &&
      request.path === '/health'
    ) {
      // For health check endpoint, return a simple 503 without logging the stack trace
      return response.status(503).json({
        statusCode: 503,
        timestamp: new Date().toISOString(),
        data: exception.getResponse(),
      });
    }

    const code = 'code' in exception ? exception.code : null;

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
