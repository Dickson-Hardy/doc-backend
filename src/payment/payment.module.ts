import { Module, forwardRef } from '@nestjs/common';
import { PaymentService } from './payment.service';
import { PaymentController } from './payment.controller';
import { RegistrationsModule } from '../registrations/registrations.module';
import { SettingsModule } from '../settings/settings.module';

@Module({
  imports: [
    forwardRef(() => RegistrationsModule),
    SettingsModule,
  ],
  controllers: [PaymentController],
  providers: [PaymentService],
  exports: [PaymentService],
})
export class PaymentModule {}
