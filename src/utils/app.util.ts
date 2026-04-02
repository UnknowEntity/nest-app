const ENVIRONMENT = process.env.NODE_ENV || 'development';

export function isProduction() {
  return ENVIRONMENT === 'production';
}
