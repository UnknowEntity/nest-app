import { Injectable } from '@nestjs/common';
import { ReqCreateUserDto } from './user.dto';
import { DatabaseService } from 'src/database/database.service';
import { roles, users } from 'src/database/schema';
import { eq } from 'drizzle-orm';
import {
  RoleNotAvailableError,
  UserAlreadyExistsError,
} from 'src/interfaces/error.interface';
import { Scrypt } from 'src/utils/crypto.util';

@Injectable()
export class UserService {
  constructor(private readonly db: DatabaseService) {}

  async create(dto: ReqCreateUserDto) {
    const { email, name, role } = dto;

    const { userExists, roleExists } = await this.checkUserAndRoles(
      email,
      role,
    );

    if (userExists) {
      throw new UserAlreadyExistsError();
    }

    if (!roleExists) {
      throw new RoleNotAvailableError();
    }

    const [newUser] = await this.db
      .insert(users)
      .values({
        email,
        name,
        role,
        password: await Scrypt.hash(dto.password),
      })
      .returning({ id: users.id, role: users.role })
      .execute();

    return newUser;
  }

  private async checkUserAndRoles(
    email: string,
    role: string,
  ): Promise<{ userExists: boolean; roleExists: boolean }> {
    const [existedUser, availableRole] = await Promise.all([
      this.db
        .select({ id: users.id })
        .from(users)
        .where(eq(users.email, email))
        .execute(),
      this.db
        .select({ id: roles.id })
        .from(roles)
        .where(eq(roles.name, role))
        .execute(),
    ]);

    return {
      userExists: existedUser.length > 0,
      roleExists: availableRole.length > 0,
    };
  }
}
