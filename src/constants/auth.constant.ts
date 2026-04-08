export const LOCAL_STRATEGY_NAME = 'local';
export const JWT_ACCESS_STRATEGY_NAME = 'jwt-access';
export const JWT_REFRESH_STRATEGY_NAME = 'jwt-refresh';
export const CONFIG_FILENAME = 'rbac_model.conf';

// Set buffer to ensure browser can synchronize token refresh
// and prevent logout due to using old refresh token
export const REFRESH_TOKEN_USAGE_BUFFER = 30; // 30 seconds
