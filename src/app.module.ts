import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './modules/auth/auth.module';
import { WhatsappModule } from './modules/whatsapp/whatsapp.module';

import { UserModule } from './modules/user/user.module';

@Module({
  imports: [
    ConfigModule.forRoot(),
    AuthModule,
    WhatsappModule,
    UserModule,
    // CompanyModule,
    // DepartmentModule,
    // ContactModule,
    // MessageModule,
  ],
})
export class AppModule {}
