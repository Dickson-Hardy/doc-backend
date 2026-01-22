import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleModule } from '@nestjs/schedule';
import { MonitoringService } from './monitoring.service';
import { MonitoringController } from './monitoring.controller';
import { Registration } from '../registrations/entities/registration.entity';
import { EmailLog } from '../email/entities/email-log.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Registration, EmailLog]),
    ScheduleModule.forRoot(),
  ],
  controllers: [MonitoringController],
  providers: [MonitoringService],
  exports: [MonitoringService],
})
export class MonitoringModule {}
