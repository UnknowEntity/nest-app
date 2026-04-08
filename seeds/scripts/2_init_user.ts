import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { users } from 'src/database/schema';
import { Scrypt } from 'src/utils/crypto.util';
import { SeedConfigInterface } from '../config';
import { newEnforcer } from 'casbin';
import { getFilePath } from 'src/utils/app.util';
import DrizzleAdapter, { casbinRulePostgres } from 'drizzle-adapter';
import { CONFIG_FILENAME } from 'src/constants/auth.constant';

export async function execute(db: NodePgDatabase, config: SeedConfigInterface) {
  const a = await DrizzleAdapter.newAdapter({
    db: db,
    table: casbinRulePostgres,
  });

  const enforcer = await newEnforcer(getFilePath(CONFIG_FILENAME), a);

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

  const [admin] = await db
    .insert(users)
    .values(adminUser)
    .returning({ id: users.id });

  await enforcer.addGroupingPolicy(admin.id.toString(), 'admin');
}
