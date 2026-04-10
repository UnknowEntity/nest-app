import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { users } from 'src/database/schema';
import { Scrypt } from 'src/utils/crypto.util';
import { SeedConfigInterface } from '../config';

export async function execute(db: NodePgDatabase, config: SeedConfigInterface) {
  if (!config.seeds_value.admin_password) {
    throw new Error('ADMIN_PASSWORD is not set in the seed configuration');
  }
  const adminUser = {
    name: 'Admin',
    email: 'admin@example.com',
    password: config.seeds_value.admin_password,
    role: 'admin',
  };

  adminUser.password = await Scrypt.hash(adminUser.password.trim());

  await db.insert(users).values(adminUser);
}
