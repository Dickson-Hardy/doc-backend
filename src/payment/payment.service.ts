import { Injectable, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { RegistrationsService } from '../registrations/registrations.service';

@Injectable()
export class PaymentService {
  private readonly paystackSecretKey: string;
  private readonly paystackBaseUrl = 'https://api.paystack.co';

  constructor(
    private configService: ConfigService,
    private registrationsService: RegistrationsService,
  ) {
    this.paystackSecretKey = this.configService.get<string>('PAYSTACK_SECRET_KEY');
  }

  async verifyPayment(reference: string) {
    try {
      const response = await axios.get(
        `${this.paystackBaseUrl}/transaction/verify/${reference}`,
        {
          headers: {
            Authorization: `Bearer ${this.paystackSecretKey}`,
          },
        },
      );

      const { data } = response.data;

      if (data.status === 'success') {
        // Find registration by reference
        const registration = await this.registrationsService.findByPaymentReference(reference);
        
        if (registration) {
          // Update payment status
          await this.registrationsService.updatePaymentStatus(
            registration.id,
            'paid',
            reference,
            new Date(),
          );
        }

        return {
          status: 'success',
          message: 'Payment verified successfully',
          data: {
            reference: data.reference,
            amount: data.amount / 100, // Convert from kobo to naira
            paidAt: data.paid_at,
          },
        };
      } else {
        throw new BadRequestException('Payment verification failed');
      }
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new BadRequestException(
          error.response?.data?.message || 'Payment verification failed',
        );
      }
      throw error;
    }
  }

  async initializePayment(email: string, amount: number, reference: string) {
    try {
      const response = await axios.post(
        `${this.paystackBaseUrl}/transaction/initialize`,
        {
          email,
          amount: amount * 100, // Convert to kobo
          reference,
          callback_url: `${this.configService.get('FRONTEND_URL')}/payment/callback`,
        },
        {
          headers: {
            Authorization: `Bearer ${this.paystackSecretKey}`,
            'Content-Type': 'application/json',
          },
        },
      );

      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new BadRequestException(
          error.response?.data?.message || 'Payment initialization failed',
        );
      }
      throw error;
    }
  }
}
