import * as path from 'path';
import { ROOT_DIR } from 'src/constants/application.constant';

const ENVIRONMENT = process.env.NODE_ENV || 'development';

export function isProduction() {
  return ENVIRONMENT === 'production';
}

export function getFilePath(relativePath: string): string {
  return path.join(ROOT_DIR, relativePath);
}
