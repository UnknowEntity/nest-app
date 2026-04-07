import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DatabaseModule } from './database/database.module';
import { ConfigModule } from '@nestjs/config';
import configuration from './configuration/configuration';
import { AuthnModule } from './modules/authn/authn.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      load: [configuration],
    }),
    DatabaseModule,
    AuthnModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
