import { Inject, Injectable } from '@nestjs/common';
import { DOUPLE_CSRF } from './csrf.token';
import { CsrfTokenGenerator, DoubleCsrfProtection } from 'csrf-csrf';
import { Request, Response } from 'express';

@Injectable()
export class CsrfService {
  constructor(
    @Inject(DOUPLE_CSRF)
    private readonly csrfConfig: {
      doubleCsrfProtection: DoubleCsrfProtection;
      generateCsrfToken: CsrfTokenGenerator;
    },
  ) {}

  generateCsrfToken(req: Request, res: Response): string {
    return this.csrfConfig.generateCsrfToken(req, res);
  }
}
