import { Global, Module } from '@nestjs/common';
import { AuthzService } from './authz.service';
import { DatabaseModule } from 'src/database/database.module';

@Global()
@Module({
  imports: [DatabaseModule],
  providers: [AuthzService],
  exports: [AuthzService],
})
export class AuthzModule {}
