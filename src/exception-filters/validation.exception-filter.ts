import { ExceptionFilter, Catch, ArgumentsHost } from '@nestjs/common';
import { Request, Response } from 'express';
import { MasterLogger } from 'src/logger/logger';
import { Logger } from 'winston';
import * as zod from 'zod';

@Catch(zod.ZodError)
export class ValidationExceptionFilter implements ExceptionFilter {
  private logger: Logger;
  constructor() {
    this.logger = MasterLogger.child({ label: 'ValidationExceptionFilter' });
  }

  catch(exception: zod.ZodError, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    const status = 400;
    const code = 'VALIDATION_ERROR';

    this.logger.error(`Validation Exception`, {
      status,
      code,
      path: request.url,
      method: request.method,
      issues: exception.issues,
    });

    response.status(status).json({
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      code,
      issues: exception.issues,
    });
  }
}
