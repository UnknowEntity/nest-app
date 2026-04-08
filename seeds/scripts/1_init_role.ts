import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { roles } from 'src/database/schema';
import { SeedConfigInterface } from '../config';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function execute(db: NodePgDatabase, _: SeedConfigInterface) {
  const adminRole = {
    id: 'admin',
    name: 'admin',
    description: 'Administrator role with full permissions',
  };

  const guestRole = {
    id: 'guest',
    name: 'guest',
    description: 'Guest role with limited permissions',
  };

  await db.insert(roles).values([adminRole, guestRole]).execute();
}
