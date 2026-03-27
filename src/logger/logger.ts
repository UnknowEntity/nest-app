import { ROOT_DIR } from 'src/constants/application.constant';
import { createLogger, format, transports } from 'winston';
import * as DailyRotateFile from 'winston-daily-rotate-file';

export const Logger = createLogger({
  transports: [
    new transports.Console({
      level: 'info',
      format: format.combine(
        format.timestamp(),
        format.colorize({ all: true }),
        format.errors({ stack: true }),
        format.printf(
          ({
            timestamp,
            level,
            message,
            ...meta
          }: {
            timestamp: string;
            level: string;
            message: string;
            [key: string]: unknown;
          }) => {
            const { label, ...rest } = meta;
            const metaString =
              Object.keys(rest).length > 0 ? JSON.stringify(rest) : '';

            return `${timestamp} [${typeof label === 'string' ? label : 'App'}] [${level}]: ${message} ${metaString}`;
          },
        ),
      ),
    }),
    new DailyRotateFile({
      level: 'error',
      filename: 'error-%DATE%.log',
      dirname: `${ROOT_DIR}/logs`,
      datePattern: 'YYYY-MM-DD',
      maxFiles: '14d',
      format: format.combine(format.timestamp(), format.json()),
    }),
  ],
});

export const startupLogger = Logger.child({ label: 'Startup' });
