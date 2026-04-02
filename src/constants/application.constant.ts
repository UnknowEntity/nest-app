import { isProduction } from 'src/utils/app.util';

// In development, we can read the config from the root directory.
// In production, we read it from the K8s secret volume.
export const ROOT_DIR = process.cwd();
export const K8S_SECRET_DIR = '/etc/secret-volume';

const TOML_FILENAME = 'config.toml';

export function getTomlConfig() {
  if (isProduction()) {
    return `${K8S_SECRET_DIR}/${TOML_FILENAME}`;
  }

  return `${ROOT_DIR}/${TOML_FILENAME}`;
}
