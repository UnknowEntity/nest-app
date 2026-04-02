import { NotFoundException } from '@nestjs/common';
import { PgTableWithColumns } from 'drizzle-orm/pg-core';

interface GetOneOrThrowOptions {
  errorMessage?: string;
  table?: PgTableWithColumns<any>;
}

export class ModuleUtil {
  name: string;
  constructor(name: string) {
    this.name = name;
  }

  getOneOrThrow<T>(
    array: T[],
    { errorMessage, table }: GetOneOrThrowOptions = {},
  ): T {
    if (!errorMessage && table) {
      errorMessage = `${table.name} not found`;
    }

    if (array.length === 0) {
      throw new NotFoundException({
        message: errorMessage || `${this.name} not found`,
        module: this.name,
      });
    }
    return array[0];
  }
}
