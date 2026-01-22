import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AdminController } from './admin.controller';
import { RegistrationsModule } from '../registrations/registrations.module';
import { Registration } from '../registrations/entities/registration.entity';
import { EmailLog } from '../email/entities/email-log.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Registration, EmailLog]),
    RegistrationsModule,
  ],
  controllers: [AdminController],
})
export class AdminModule {}
