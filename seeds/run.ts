import { readdir } from 'node:fs/promises';
import { database } from './database';
import { configValue, SeedConfigInterface } from './config';
import { join } from 'node:path';
import { seed_metadata } from 'src/database/schema';

const SEED_FILE_PATTERN = /^[0-9]+_.*\.ts$/;
type SeedModule = {
  execute?: (db: typeof database, config: SeedConfigInterface) => Promise<void>;
};

void (async () => {
  const seedDir = __dirname;
  const seedFiles = await readdir(join(seedDir, 'scripts'));
  const runSeedFiles = await database.select().from(seed_metadata).execute();
  const runSeedFileNames = runSeedFiles.map((seed) => seed.name);

  const seedScripts = seedFiles
    .filter((file) => SEED_FILE_PATTERN.test(file))
    .map((file) => ({
      name: file,
    }))
    .sort();

  for (const seed of seedScripts) {
    const seedModule = (await import(
      join(seedDir, 'scripts', seed.name)
    )) as SeedModule;

    if (runSeedFileNames.includes(seed.name)) {
      console.log(`Skipping already executed seed: ${seed.name}`);
      continue;
    }

    if (typeof seedModule.execute === 'function') {
      console.log(`Running seed: ${seed.name}`);
      await seedModule.execute(database, configValue);
      console.log(`Finished seed: ${seed.name}`);

      await database
        .insert(seed_metadata)
        .values({
          name: seed.name,
          executedAt: new Date(),
        })
        .execute();
    }
  }
})();
