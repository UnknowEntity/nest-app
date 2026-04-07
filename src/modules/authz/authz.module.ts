import { Module } from '@nestjs/common';
import { AuthzService } from './authz.service';
import { DatabaseModule } from 'src/database/database.module';

@Module({
  imports: [DatabaseModule],
  providers: [AuthzService],
})
export class AuthzModule {}
