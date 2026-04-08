import { ROOT_DIR } from 'src/constants/application.constant';
import { createLogger, format, transports } from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';

export const MasterLogger = createLogger({
  transports: [
    new transports.Console({
      level: 'info',
      format: format.combine(
        format.timestamp(),
        format.colorize({ all: true }),
        format.errors({ stack: true }),
        format.printf(
          ({
            level,
            message,
            ...meta
          }: {
            level: string;
            message: unknown;
            [key: string]: unknown;
          }) => {
            const { label, timestamp, ...rest } = meta;
            const metaString =
              Object.keys(rest).length > 0 ? JSON.stringify(rest) : '';

            return `${String(timestamp)} [${typeof label === 'string' ? label : 'App'}] [${level}]: ${String(message)} ${metaString}`;
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

export const startupLogger = MasterLogger.child({ label: 'Startup' });
