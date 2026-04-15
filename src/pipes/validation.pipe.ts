import { PipeTransform, ArgumentMetadata, Paramtype } from '@nestjs/common';
import * as zod from 'zod';

export class ZodValidationPipe implements PipeTransform {
  constructor(
    private schema: zod.ZodObject,
    private type: Paramtype = 'body',
  ) {}

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  transform(value: unknown, { type }: ArgumentMetadata) {
    if (this.type == type) {
      const parsedValue = this.schema.parse(value);
      return parsedValue;
    }

    return value;
  }
}
