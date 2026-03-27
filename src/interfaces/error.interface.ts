export class TomlParseError extends Error {
  line: number;
  column: number;

  constructor(error: Error) {
    super(error.message);
    this.name = 'TomlParseError';
    this.line = (error as unknown as { line: number }).line || 0;
    this.column = (error as unknown as { column: number }).column || 0;
  }
}
