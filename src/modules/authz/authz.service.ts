import { Injectable, OnModuleInit } from '@nestjs/common';
import { Enforcer, newEnforcer } from 'casbin';
import { DatabaseService } from 'src/database/database.service';
import DrizzleAdapter, { casbinRulePostgres } from 'drizzle-adapter';
import { getFilePath } from 'src/utils/app.util';
import { CONFIG_FILENAME } from 'src/constants/auth.constant';

@Injectable()
export class AuthzService implements OnModuleInit {
  private enforcer: Enforcer;

  constructor(private readonly db: DatabaseService) {
    this.enforcer = null as unknown as Enforcer;
  }

  async onModuleInit() {
    const a = await DrizzleAdapter.newAdapter({
      db: this.db,
      table: casbinRulePostgres,
    });

    this.enforcer = await newEnforcer(getFilePath(CONFIG_FILENAME), a);
  }

  async addPolicy(subject: string, object: string, action: string) {
    await this.enforcer.addPolicy(subject, object, action);
  }

  async enforce(
    subject: string,
    object: string,
    action: string,
  ): Promise<boolean> {
    return this.enforcer.enforce(subject, object, action);
  }

  async addUserToRole(userId: string, roleName: string) {
    await this.enforcer.addGroupingPolicy(userId, roleName);
  }

  async removeUserFromRole(userId: string, roleName: string) {
    await this.enforcer.removeGroupingPolicy(userId, roleName);
  }

  async addPermissionToRole(roleName: string, object: string, action: string) {
    await this.enforcer.addPolicy(roleName, object, action);
  }

  async removePermissionFromRole(
    roleName: string,
    object: string,
    action: string,
  ) {
    await this.enforcer.removePolicy(roleName, object, action);
  }

  async getRolePermissions(roleName: string) {
    return this.enforcer.getPermissionsForUser(roleName);
  }
}
