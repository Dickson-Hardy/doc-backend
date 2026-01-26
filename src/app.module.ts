import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MongooseModule } from '@nestjs/mongoose';
import { ScheduleModule } from '@nestjs/schedule';
import { DatabaseModule } from './database/database.module';
import { MembersModule } from './members/members.module';
import { RegistrationsModule } from './registrations/registrations.module';
import { PaymentModule } from './payment/payment.module';
import { EmailModule } from './email/email.module';
import { AdminModule } from './admin/admin.module';
import { AuthModule } from './auth/auth.module';
import { MonitoringModule } from './monitoring/monitoring.module';
import { BackupModule } from './backup/backup.module';
import { SettingsModule } from './settings/settings.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    ScheduleModule.forRoot(),
    // Neon Serverless Database (Global)
    DatabaseModule,
    // PostgreSQL for registrations (Neon) - TypeORM for entity management
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DATABASE_HOST,
      port: parseInt(process.env.DATABASE_PORT || '5432'),
      username: process.env.DATABASE_USER,
      password: process.env.DATABASE_PASSWORD,
      database: process.env.DATABASE_NAME,
      entities: [__dirname + '/**/*.entity{.ts,.js}'],
      synchronize: process.env.NODE_ENV !== 'production',
      ssl: { rejectUnauthorized: false },
    }),
    // MongoDB for existing member database
    MongooseModule.forRoot(process.env.MONGODB_URI, {
      dbName: process.env.MONGODB_DATABASE || 'cmda_members',
    }),
    AuthModule,
    SettingsModule,
    MembersModule,
    RegistrationsModule,
    PaymentModule,
    EmailModule,
    AdminModule,
    MonitoringModule,
    BackupModule,
  ],
})
export class AppModule {}
