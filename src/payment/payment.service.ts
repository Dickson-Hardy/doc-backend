import { Injectable, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import * as crypto from 'crypto';
import { RegistrationsService } from '../registrations/registrations.service';
import { SettingsService } from '../settings/settings.service';

@Injectable()
export class PaymentService {
  private readonly paystackBaseUrl = 'https://api.paystack.co';

  constructor(
    private configService: ConfigService,
    private registrationsService: RegistrationsService,
    private settingsService: SettingsService,
  ) {}

  private async getPaystackSecretKey(): Promise<string> {
    // Try to get from database first, fallback to env
    const dbKey = await this.settingsService.getPaystackSecretKey();
    return dbKey || this.configService.get<string>('PAYSTACK_SECRET_KEY');
  }

  async verifyWebhookSignature(payload: string, signature: string): Promise<boolean> {
    const secretKey = await this.getPaystackSecretKey();
    const hash = crypto
      .createHmac('sha512', secretKey)
      .update(payload)
      .digest('hex');
    return hash === signature;
  }

  async verifyPayment(reference: string) {
    try {
      console.log(`[PAYMENT] Verifying payment for reference: ${reference}`);
      
      const secretKey = await this.getPaystackSecretKey();
      
      const response = await axios.get(
        `${this.paystackBaseUrl}/transaction/verify/${reference}`,
        {
          headers: {
            Authorization: `Bearer ${secretKey}`,
          },
        },
      );

      const { data } = response.data;
      console.log(`[PAYMENT] Paystack response status: ${data.status}`);

      if (data.status === 'success') {
        // Try to find registration by reference first
        let registration = await this.registrationsService.findByPaymentReference(reference);
        
        // If not found by Paystack reference, try to find by registration ID from metadata
        if (!registration && data.metadata?.custom_fields) {
          const registrationIdField = data.metadata.custom_fields.find(
            (field: any) => field.variable_name === 'registration_id'
          );
          
          if (registrationIdField) {
            const registrationId = registrationIdField.value;
            console.log(`[PAYMENT] Looking up by registration ID from metadata: ${registrationId}`);
            registration = await this.registrationsService.findById(registrationId);
            
            if (registration) {
              console.log(`[PAYMENT] ✅ Found registration by ID, updating with Paystack reference: ${reference}`);
            }
          }
        }
        
        if (!registration) {
          console.error(`[PAYMENT] ❌ Registration not found for reference: ${reference}`);
          throw new BadRequestException(`Registration not found for reference: ${reference}`);
        }

        console.log(`[PAYMENT] ✅ Found registration: ${registration.id}`);
        
        // Update payment status with the actual Paystack reference
        await this.registrationsService.updatePaymentStatus(
          registration.id,
          'paid',
          reference, // Use the actual Paystack reference
          new Date(data.paid_at),
        );

        console.log(`[PAYMENT] ✅ Payment verified and registration updated`);

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
        console.error(`[PAYMENT] ❌ Payment status is not success: ${data.status}`);
        throw new BadRequestException(`Payment status: ${data.status}`);
      }
    } catch (error) {
      console.error(`[PAYMENT] ❌ Error verifying payment:`, error.message);
      
      if (axios.isAxiosError(error)) {
        const errorMessage = error.response?.data?.message || 'Payment verification failed';
        console.error(`[PAYMENT] Paystack error:`, errorMessage);
        throw new BadRequestException(errorMessage);
      }
      throw error;
    }
  }

  async initializePayment(email: string, amount: number, reference: string) {
    try {
      const secretKey = await this.getPaystackSecretKey();
      const splitCode = await this.settingsService.getPaystackSplitCode();

      const payload: any = {
        email,
        amount: amount * 100, // Convert to kobo
        reference,
        callback_url: `${this.configService.get('FRONTEND_URL')}/payment/callback`,
      };

      // Add split code if available for revenue sharing
      if (splitCode) {
        payload.split_code = splitCode;
      }

      const response = await axios.post(
        `${this.paystackBaseUrl}/transaction/initialize`,
        payload,
        {
          headers: {
            Authorization: `Bearer ${secretKey}`,
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
