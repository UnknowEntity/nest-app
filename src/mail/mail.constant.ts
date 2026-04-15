import { getFilePath } from 'src/utils/app.util';

export const enum MailEventEnum {
  ResetPassword = 'reset_password',
  EmailVerification = 'email_verification',
}

export const MailEventConfig = {
  [MailEventEnum.ResetPassword]: {
    event: 'mail.reset_password',
    template: 'reset-password',
    subject: 'Reset Your Password',
  },
  [MailEventEnum.EmailVerification]: {
    event: 'mail.email_verification',
    template: 'email-verification',
    subject: 'Verify Your Email Address',
  },
};

export const TEMPLATE_PATH = getFilePath('templates');

export const FORMAT_SUBJECT_PATTERN = /{(\w+)}/g;
