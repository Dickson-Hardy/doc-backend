import { Controller, Post, Body, Get, Param } from '@nestjs/common';
import { RegistrationsService } from './registrations.service';
import { CreateRegistrationDto } from './dto/create-registration.dto';
import { PaymentService } from '../payment/payment.service';
import { Public } from '../auth/decorators/public.decorator';

@Controller('registrations')
export class RegistrationsController {
  constructor(
    private readonly registrationsService: RegistrationsService,
    private readonly paymentService: PaymentService,
  ) {}

  @Public()
  @Post()
  async create(@Body() createRegistrationDto: CreateRegistrationDto) {
    // Generate payment reference first
    const reference = `CMDA-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    
    // Create registration with reference
    const registration = await this.registrationsService.create(
      createRegistrationDto,
      reference,
    );
    
    return {
      registrationId: registration.id,
      reference,
      amount: registration.totalAmount,
    };
  }

  @Public()
  @Get('verify-payment/:reference')
  async verifyPayment(@Param('reference') reference: string) {
    const result = await this.paymentService.verifyPayment(reference);
    return result;
  }
}
