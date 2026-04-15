import { OnEvent } from '@nestjs/event-emitter';
import { MailService } from './mail.service';
import { Injectable } from '@nestjs/common';
import { MailEventConfig, MailEventEnum } from './mail.constant';
import { ResetPasswordEvent } from './mail.dto';

@Injectable()
export class MailEvent {
  constructor(private readonly mailService: MailService) {}

  @OnEvent(MailEventConfig[MailEventEnum.ResetPassword].event)
  async handleResetPasswordEvent(event: ResetPasswordEvent) {
    await this.mailService.sendResetPasswordEmail(event);
  }
}
