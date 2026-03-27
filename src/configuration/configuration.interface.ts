import * as zod from 'zod';

export const ConfigurationData = zod.object({
  database: zod.object({
    connection_string: zod.string(),
    ssl: zod.boolean().optional(),
  }),
});

export type ConfigurationInterface = zod.infer<typeof ConfigurationData>;
