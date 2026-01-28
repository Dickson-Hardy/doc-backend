import { Controller, Get, Post, Body, Query, Param } from '@nestjs/common';
import { RegistrationsService } from '../registrations/registrations.service';
import { PaymentService } from '../payment/payment.service';
import { Roles } from '../auth/decorators/roles.decorator';

@Controller('admin')
@Roles('admin', 'super_admin')
export class AdminController {
  constructor(
    private readonly registrationsService: RegistrationsService,
    private readonly paymentService: PaymentService,
  ) {}

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
    const stats = await this.registrationsService.getStats();
    
    // Get count of payments that used split code
    const splitPayments = await this.registrationsService.getSplitPaymentCount();
    
    return {
      ...stats,
      splitPayments,
    };
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
    try {
      // Verify the registration exists
      const registration = await this.registrationsService.findByPaymentReference(reference);
      
      if (!registration) {
        return {
          status: 'error',
          message: 'Registration not found for this reference',
        };
      }

      // If already paid, return success
      if (registration.paymentStatus === 'paid') {
        return {
          status: 'success',
          message: 'Payment already verified',
          data: {
            registrationId: registration.id,
            paymentStatus: registration.paymentStatus,
            paidAt: registration.paidAt,
          },
        };
      }

      // Trigger payment verification
      const result = await this.paymentService.verifyPayment(reference);
      
      return {
        status: 'success',
        message: 'Payment verification completed',
        data: result,
      };
    } catch (error) {
      return {
        status: 'error',
        message: error.message || 'Failed to requery payment',
      };
    }
  }

  @Post('resend-email/:registrationId')
  async resendEmail(@Param('registrationId') registrationId: string) {
    await this.registrationsService.resendConfirmationEmail(registrationId);
    return { 
      message: 'Email resent successfully',
      registrationId 
    };
  }
}
