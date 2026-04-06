import { UnauthorizedException } from '@nestjs/common';

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

export class RefreshTokenMaxAgeExceededError extends UnauthorizedException {
  code = 'REFRESH_TOKEN_MAX_AGE_EXCEEDED';
}

export class RefreshTokenFamilyInvalidError extends UnauthorizedException {
  code = 'REFRESH_TOKEN_FAMILY_INVALID';
}

export class UserIdNotFoundError extends UnauthorizedException {
  code = 'USER_ID_NOT_FOUND';
}
