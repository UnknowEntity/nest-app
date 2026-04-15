import { Controller, Get, Req, Res } from '@nestjs/common';
import { AppService } from './app.service';
import { CsrfService } from './csrf/csrf.service';
import { Request, Response } from 'express';

@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    private readonly csrfService: CsrfService,
  ) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Get('csrf-token')
  getCsrfToken(@Req() req: Request, @Res() res: Response): void {
    const token = this.csrfService.generateCsrfToken(req, res);
    res.json({ csrfToken: token });
  }
}
