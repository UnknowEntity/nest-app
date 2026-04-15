import { ExceptionFilter, Catch, ArgumentsHost } from '@nestjs/common';
import { Request, Response } from 'express';
import * as createHttpError from 'http-errors';
import { MasterLogger } from 'src/logger/logger';
import { Logger } from 'winston';

@Catch()
export class InternalExceptionFilter implements ExceptionFilter {
  private logger: Logger;
  constructor() {
    this.logger = MasterLogger.child({ label: 'InternalExceptionFilter' });
  }

  catch(exception: any, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    const status = 500;
    const code = 'INTERNAL_ERROR';

    console.log(exception, exception instanceof createHttpError.HttpError);

    this.logger.error(`Internal Server Error:`, {
      status,
      code,
      path: request.url,
      method: request.method,
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      error: exception instanceof Error ? exception.stack : exception,
      message:
        exception instanceof Error ? exception.message : String(exception),
    });

    // Don't expose internal error details to the client
    response.status(status).json({
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      code,
    });
  }
}
