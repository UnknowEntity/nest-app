import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
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
