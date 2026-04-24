import { AuthRequest, RefreshRequest } from 'src/interfaces/auth.interface';
import { Request } from 'express';
import { ExecutionContext } from '@nestjs/common';
import { ThrottlerGenerateKeyFunction } from '@nestjs/throttler';

export class ThrottleKeyFactory {
  private static readonly PREFIX = 'throttle';
  private readonly extractFunctions: Record<string, (request: any) => string> =
    {};
  private readonly prefix: string;

  constructor(prefix?: string) {
    this.prefix = prefix || ThrottleKeyFactory.PREFIX;
  }

  public static init(prefix?: string): ThrottleKeyFactory {
    return new ThrottleKeyFactory(prefix);
  }

  public addPerEmail(): ThrottleKeyFactory {
    this.extractFunctions['email'] = (request: AuthRequest) => {
      return request.user.email;
    };

    return this;
  }

  public addPerEmailInBody(emailKey?: string): ThrottleKeyFactory {
    const key = emailKey || 'email';
    this.extractFunctions['emailInBody'] = (request: Request) => {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-member-access
      return request.body[key] || '';
    };

    return this;
  }

  public addPerIP(): ThrottleKeyFactory {
    this.extractFunctions['ip'] = (request: Request) => {
      return (request.ip ||
        request.headers['x-forwarded-for'] ||
        request.socket.remoteAddress) as string;
    };

    return this;
  }

  public addPerFamilyId(): ThrottleKeyFactory {
    this.extractFunctions['familyId'] = (request: RefreshRequest) => {
      return request.user.familyId;
    };

    return this;
  }

  public addPerToken(): ThrottleKeyFactory {
    this.extractFunctions['token'] = (request: Request) => {
      const authHeader = request.headers['authorization'] || '';
      const token = authHeader.split(' ')[1] || '';
      return token;
    };

    return this;
  }

  public buildGenerateKeyFunction(): ThrottlerGenerateKeyFunction {
    const extractFunctions = Object.entries(this.extractFunctions);

    // Sort the extract functions by key to ensure consistent ordering
    extractFunctions.sort(([keyA], [keyB]) => keyA.localeCompare(keyB));

    return (
      context: ExecutionContext,
      trackerString: string,
      trackerName: string,
    ) => {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const request = context.switchToHttp().getRequest<any>();

      const keyParts = [this.prefix, trackerString, trackerName];

      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      for (const [_, extractFunction] of extractFunctions) {
        keyParts.push(extractFunction(request));
      }

      return keyParts.join(':');
    };
  }
}
