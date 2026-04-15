import { Injectable } from '@nestjs/common';
import { ResetPasswordEvent } from './mail.dto';
import { MailerService } from '@nestjs-modules/mailer';
import {
  FORMAT_SUBJECT_PATTERN,
  MailEventConfig,
  MailEventEnum,
} from './mail.constant';
import format from 'string-template';
import {
  ConfigurationInterface,
  GeneralConfig,
} from 'src/configuration/configuration.interface';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class MailService {
  generalConfig: GeneralConfig;
  constructor(
    private readonly mailerService: MailerService,
    private readonly configService: ConfigService<ConfigurationInterface>,
  ) {
    this.generalConfig = this.configService.get('general', { infer: true })!;
  }

  async sendResetPasswordEmail(event: ResetPasswordEvent) {
    const { email, token, userName } = event;
    await this.sendMail(email, MailEventEnum.ResetPassword, {
      token: encodeURIComponent(token),
      userName,
    });
  }

  private async sendMail(
    to: string,
    type: MailEventEnum,
    context: Record<string, any>,
  ) {
    let subject = MailEventConfig[type].subject;
    const template = MailEventConfig[type].template;

    if (FORMAT_SUBJECT_PATTERN.test(subject)) {
      subject = this.formatSubject(subject, context);
    }

    await this.mailerService.sendMail({
      to,
      subject,
      template,
      context: {
        ...context,
        domain: this.generalConfig.domain,
      },
    });
  }

  private formatSubject(subject: string, context: Record<string, any>): string {
    return format(subject, context);
  }
}
