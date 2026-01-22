import { Controller, Get, Post, Body, Query, Param } from '@nestjs/common';
import { RegistrationsService } from '../registrations/registrations.service';
import { Roles } from '../auth/decorators/roles.decorator';

@Controller('admin')
@Roles('admin', 'super_admin')
export class AdminController {
  constructor(private readonly registrationsService: RegistrationsService) {}

  @Get('registrations')
  async getRegistrations(
    @Query('status') status?: string,
    @Query('category') category?: string,
    @Query('search') search?: string,
  ) {
    return this.registrationsService.findAll({
      paymentStatus: status,
      category,
      search,
    });
  }

  @Get('stats')
  async getStats() {
    return this.registrationsService.getStats();
  }

  @Get('email-logs')
  async getEmailLogs(@Query('registrationId') registrationId?: string) {
    return this.registrationsService.getEmailLogs(registrationId);
  }

  @Post('verify-attendance')
  async verifyAttendance(@Body('registrationId') registrationId: string) {
    return this.registrationsService.verifyAttendance(registrationId);
  }

  @Post('requery-payment')
  async requeryPayment(@Body('reference') reference: string) {
    // This will trigger payment verification again
    const registration = await this.registrationsService.findByPaymentReference(reference);
    if (!registration) {
      throw new Error('Registration not found');
    }
    return { message: 'Requery initiated', registrationId: registration.id };
  }
}
