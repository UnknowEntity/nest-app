import { Cache as CacheManager } from 'cache-manager';
import { CacheConfig } from 'drizzle-orm/cache/core/types';
import { getTableName, Table } from 'drizzle-orm/table';
import { is } from 'drizzle-orm';
import { Cache } from 'drizzle-orm/cache/core';

/**
 * This class implements a cache client for Drizzle ORM,
 * allowing you to cache query results and manage cache
 * invalidation based on the tables involved in the queries.
 *
 * It supports both explicit caching (where you specify which queries to cache)
 * and global caching (where all queries are cached).
 *
 * The cache can be backed by an in-memory store or Redis,
 * depending on the configuration.
 */
export class DBCacheClient extends Cache {
  private globalTtl: number;
  private useGlobally: boolean;

  // Mirrors Drizzle's upstash key model for deterministic invalidation.
  private static readonly compositeTableSetPrefix = '__CTS__';
  private static readonly compositeTablePrefix = '__CT__';
  private static readonly nonAutoInvalidateTablePrefix =
    '__nonAutoInvalidate__';

  // tag -> composite bucket key (or non-auto-invalidate bucket key)
  private tagsMap: Map<string, string> = new Map();

  // __CTS__{table} -> Set<__CT__tableA,tableB>
  private tableCompositeSets: Map<string, Set<string>> = new Map();

  // __CT__tableA,tableB -> Set<queryKey>
  private compositeMembers: Map<string, Set<string>> = new Map();

  private cacheManager: CacheManager;

  constructor(
    cacheManager: CacheManager,
    useGlobally = false,
    globalTtl = 60_000,
  ) {
    super();
    this.useGlobally = useGlobally;
    this.globalTtl = globalTtl;
    this.cacheManager = cacheManager;
  }
  // For the strategy, we have two options:
  // - 'explicit': The cache is used only when .$withCache() is added to a query.
  // - 'all': All queries are cached globally.
  // The default behavior is 'explicit'.
  override strategy(): 'explicit' | 'all' {
    return this.useGlobally ? 'all' : 'explicit';
  }
  // This function accepts query and parameters that cached into key param,
  // allowing you to retrieve response values for this query from the cache.
  override async get(
    key: string,
    tables: string[],
    isTag = false,
    isAutoInvalidate?: boolean,
  ): Promise<any[] | undefined> {
    if (!isAutoInvalidate) {
      return (
        (await this.cacheManager.get<any[]>(
          this.toStorageKey(DBCacheClient.nonAutoInvalidateTablePrefix, key),
        )) ?? undefined
      );
    }

    if (isTag) {
      const bucket = this.tagsMap.get(key);
      if (!bucket) return undefined;
      return (
        (await this.cacheManager.get<any[]>(this.toStorageKey(bucket, key))) ??
        undefined
      );
    }

    const compositeKey = this.getCompositeKey(tables);
    return (
      (await this.cacheManager.get<any[]>(
        this.toStorageKey(compositeKey, key),
      )) ?? undefined
    );
  }
  // This function accepts several options to define how cached data will be stored:
  // - 'key': A hashed query and parameters.
  // - 'response': An array of values returned by Drizzle from the database.
  // - 'tables': An array of tables involved in the select queries. This information is needed for cache invalidation.
  //
  // For example, if a query uses the "users" and "posts" tables, you can store this information. Later, when the app executes
  // any mutation statements on these tables, you can remove the corresponding key from the cache.
  // If you're okay with eventual consistency for your queries, you can skip this option.
  override async put(
    key: string,
    response: any,
    tables: string[],
    isTag = false,
    config?: CacheConfig,
  ): Promise<void> {
    const isAutoInvalidate = tables.length !== 0;
    const ttl = config?.px ?? (config?.ex ? config.ex * 1000 : this.globalTtl);

    if (!isAutoInvalidate) {
      if (isTag) {
        this.tagsMap.set(key, DBCacheClient.nonAutoInvalidateTablePrefix);
      }

      await this.cacheManager.set(
        this.toStorageKey(DBCacheClient.nonAutoInvalidateTablePrefix, key),
        response,
        ttl,
      );
      return;
    }

    const compositeKey = this.getCompositeKey(tables);

    await this.cacheManager.set(
      this.toStorageKey(compositeKey, key),
      response,
      ttl,
    );

    if (isTag) {
      this.tagsMap.set(key, compositeKey);
    }

    const members =
      this.compositeMembers.get(compositeKey) ?? new Set<string>();
    members.add(key);
    this.compositeMembers.set(compositeKey, members);

    for (const table of tables) {
      const tableSetKey = this.addTablePrefix(table);
      const compositeKeys =
        this.tableCompositeSets.get(tableSetKey) ?? new Set<string>();
      compositeKeys.add(compositeKey);
      this.tableCompositeSets.set(tableSetKey, compositeKeys);
    }
  }
  // This function is called when insert, update, or delete statements are executed.
  // You can either skip this step or invalidate queries that used the affected tables.
  //
  // The function receives an object with two keys:
  // - 'tags': Used for queries labeled with a specific tag, allowing you to invalidate by that tag.
  // - 'tables': The actual tables affected by the insert, update, or delete statements,
  //   helping you track which tables have changed since the last cache update.
  override async onMutate(params: {
    tags: string | string[];
    tables: string | string[] | Table<any> | Table<any>[];
  }): Promise<void> {
    const tagsArray = params.tags
      ? Array.isArray(params.tags)
        ? params.tags
        : [params.tags]
      : [];
    const tablesArray = params.tables
      ? Array.isArray(params.tables)
        ? params.tables
        : [params.tables]
      : [];
    for (const tag of tagsArray) {
      const bucket = this.tagsMap.get(tag);
      if (!bucket) continue;

      await this.cacheManager.del(this.toStorageKey(bucket, tag));
      this.tagsMap.delete(tag);

      const members = this.compositeMembers.get(bucket);
      if (members) {
        members.delete(tag);
        if (members.size === 0) {
          this.compositeMembers.delete(bucket);
        }
      }
    }

    const compositeKeysToDelete = new Set<string>();
    const tableSetKeys: string[] = [];

    for (const table of tablesArray) {
      const tableName = is(table, Table)
        ? getTableName(table)
        : (table as string);
      const tableSetKey = this.addTablePrefix(tableName);
      tableSetKeys.push(tableSetKey);

      const compositeKeys = this.tableCompositeSets.get(tableSetKey);
      if (!compositeKeys) continue;
      for (const compositeKey of compositeKeys) {
        compositeKeysToDelete.add(compositeKey);
      }
    }

    for (const compositeKey of compositeKeysToDelete) {
      const members = this.compositeMembers.get(compositeKey);
      if (!members) continue;

      for (const key of members) {
        await this.cacheManager.del(this.toStorageKey(compositeKey, key));
      }

      this.compositeMembers.delete(compositeKey);
    }

    for (const tableSetKey of tableSetKeys) {
      this.tableCompositeSets.delete(tableSetKey);
    }
  }

  private addTablePrefix(table: string): string {
    return `${DBCacheClient.compositeTableSetPrefix}${table}`;
  }

  private getCompositeKey(tables: string[]): string {
    return `${DBCacheClient.compositeTablePrefix}${[...tables].sort().join(',')}`;
  }

  private toStorageKey(bucket: string, key: string): string {
    return `${bucket}:${key}`;
  }
}
