import { Injectable } from '@nestjs/common';
import { EmailVerificationEvent, ResetPasswordEvent } from './mail.dto';
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
import { Logger } from 'winston';
import { MasterLogger } from 'src/logger/logger';

@Injectable()
export class MailService {
  generalConfig: GeneralConfig;
  logger: Logger;
  retryAttempts: number;
  constructor(
    private readonly mailerService: MailerService,
    private readonly configService: ConfigService<ConfigurationInterface>,
  ) {
    this.generalConfig = this.configService.get('general', { infer: true })!;
    this.logger = MasterLogger.child({ label: 'MailService' });
    this.retryAttempts = this.configService.getOrThrow('smtp.retry_attempts', {
      infer: true,
    });
  }

  async sendResetPasswordEmail(event: ResetPasswordEvent) {
    const { email, token, name } = event;
    await this.sendMail(email, MailEventEnum.ResetPassword, {
      token: encodeURIComponent(token),
      name,
    });
  }

  async sendEmailVerificationEmail(event: EmailVerificationEvent) {
    const { email, token, name } = event;
    await this.sendMail(email, MailEventEnum.EmailVerification, {
      token: encodeURIComponent(token),
      name,
    });
  }

  private async sendMail(
    to: string,
    type: MailEventEnum,
    context: Record<string, any>,
  ) {
    this.logger.info(`Sending ${type} email to ${to}`);
    let subject = MailEventConfig[type].subject;
    const template = MailEventConfig[type].template;

    if (FORMAT_SUBJECT_PATTERN.test(subject)) {
      subject = this.formatSubject(subject, context);
    }

    let sendSuccess = false;
    let attempt = 0;

    while (!sendSuccess && attempt < this.retryAttempts) {
      try {
        await this.mailerService.sendMail({
          to,
          subject,
          template,
          context: {
            ...context,
            domain: this.generalConfig.domain,
            app_name: this.generalConfig.app_name,
          },
        });

        sendSuccess = true;
        this.logger.info(`Successfully sent ${type} email to ${to}`);
      } catch (error) {
        this.logger.error(`Failed to send ${type} email to ${to}`, {
          error: error instanceof Error ? error.message : String(error),
        });
        attempt++;
        if (attempt < this.retryAttempts) {
          this.logger.info(
            `Retrying to send ${type} email to ${to} (Attempt ${attempt + 1})`,
          );
        } else {
          this.logger.error(
            `Exceeded retry attempts for sending ${type} email to ${to}`,
          );
        }
      }
    }
  }

  private formatSubject(subject: string, context: Record<string, any>): string {
    return format(subject, context);
  }
}
