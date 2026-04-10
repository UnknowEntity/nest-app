import { PipeTransform, ArgumentMetadata } from '@nestjs/common';
import * as zod from 'zod';

export class ZodValidationPipe implements PipeTransform {
  constructor(private schema: zod.ZodObject) {}

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  transform(value: unknown, _: ArgumentMetadata) {
    const parsedValue = this.schema.parse(value);
    return parsedValue;
  }
}
