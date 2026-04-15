import { getFilePath } from 'src/utils/app.util';

export const enum MailEventEnum {
  ResetPassword = 'reset_password',
}

export const MailEventConfig = {
  [MailEventEnum.ResetPassword]: {
    event: 'mail.reset_password',
    template: 'reset-password',
    subject: 'Reset Your Password',
  },
};

export const TEMPLATE_PATH = getFilePath('templates');

export const FORMAT_SUBJECT_PATTERN = /{(\w+)}/g;
