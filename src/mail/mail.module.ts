import { Module } from '@nestjs/common';
import { MailService } from './mail.service';
import { MailerModule } from '@nestjs-modules/mailer';
import { PugAdapter } from '@nestjs-modules/mailer/adapters/pug.adapter';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ConfigurationInterface } from 'src/configuration/configuration.interface';
import { MailEventConfig, TEMPLATE_PATH } from './mail.constant';
import { MailEvent } from './mail.event';
import { readdirSync } from 'node:fs';
import { startupLogger } from 'src/logger/logger';

@Module({
  imports: [
    ConfigModule,
    MailerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService<ConfigurationInterface>) => {
        const smtpConfig = configService.getOrThrow('smtp', {
          infer: true,
        });

        templatePathValidation(TEMPLATE_PATH);

        return {
          transport: {
            host: smtpConfig.transport.host,
            port: smtpConfig.transport.port,
            auth: {
              user: smtpConfig.transport.user,
              pass: smtpConfig.transport.pass,
            },
          },
          defaults: {
            from: `"${smtpConfig.from_name || 'No Reply'}" <${smtpConfig.from_address}>`,
          },
          template: {
            dir: TEMPLATE_PATH,
            adapter: new PugAdapter(),
          },
        };
      },
    }),
  ],
  providers: [MailService, MailEvent],
})
export class MailModule {}

function templatePathValidation(templateDir: string) {
  const filesOnDisk = new Set(
    readdirSync(templateDir, { withFileTypes: true })
      .filter((f) => f.isFile())
      .map((f) => f.name),
  );

  const missingTemplates = Object.values(MailEventConfig)
    .map((config) => `${config.template}.pug`)
    .filter((filename) => !filesOnDisk.has(filename));

  if (missingTemplates.length > 0) {
    startupLogger.error(
      `The following templates are missing from the mail templates directory: ${missingTemplates.join(', ')}. Please ensure all required templates are present and have a .pug extension.`,
    );

    throw new Error(`Missing mail templates: ${missingTemplates.join(', ')}`);
  }
}
