import { Module, forwardRef } from '@nestjs/common';
import { PaymentService } from './payment.service';
import { RegistrationsModule } from '../registrations/registrations.module';

@Module({
  imports: [forwardRef(() => RegistrationsModule)],
  providers: [PaymentService],
  exports: [PaymentService],
})
export class PaymentModule {}
