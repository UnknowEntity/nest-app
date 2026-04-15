import { Global, Module } from '@nestjs/common';
import { AuthzService } from './authz.service';
import { DatabaseModule } from 'src/database/database.module';
import { APP_GUARD } from '@nestjs/core';
import { AuthzGuard } from './authz.guard';

@Global()
@Module({
  imports: [DatabaseModule],
  providers: [
    AuthzService,
    {
      provide: APP_GUARD,
      useClass: AuthzGuard,
    },
  ],
  exports: [AuthzService],
})
export class AuthzModule {}
