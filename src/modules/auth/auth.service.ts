import { Injectable } from '@nestjs/common';
import { DatabaseService } from 'src/database/database.service';
import { RequestUser, users } from 'src/database/schema';
import { eq } from 'drizzle-orm';
import { Scrypt } from 'src/utils/crypto.util';
import { JwtService } from '@nestjs/jwt';
import { ConfigurationInterface } from 'src/configuration/configuration.interface';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AuthService {
  constructor(
    private readonly db: DatabaseService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService<ConfigurationInterface>,
  ) {}

  async validateUser(
    email: string,
    password: string,
  ): Promise<RequestUser | null> {
    const [user] = await this.db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .execute();

    if (!user) {
      return null;
    }

    const isPasswordValid = await Scrypt.verify(password, user.password);
    if (!isPasswordValid) {
      return null;
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password: _, ...result } = user;

    return result;
  }

  async login(user: RequestUser) {
    const payload = { sub: user.id };
    return {
      access_token: await this.jwtService.signAsync(payload, {
        secret: this.configService.getOrThrow('auth.access.secret', {
          infer: true,
        }),
        expiresIn: this.configService.getOrThrow('auth.access.expires_in', {
          infer: true,
        }),
      }),
    };
  }
}
