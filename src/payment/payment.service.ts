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

  async testPaystackConnection(): Promise<{ success: boolean; message: string; keyType: string }> {
    try {
      const secretKey = await this.getPaystackSecretKey();

      if (!secretKey) {
        return { success: false, message: 'No Paystack secret key configured', keyType: 'none' };
      }

      const keyType = secretKey.startsWith('sk_live') ? 'live' : secretKey.startsWith('sk_test') ? 'test' : 'unknown';

      const response = await axios.get(`${this.paystackBaseUrl}/transaction/totals`, {
        headers: { Authorization: `Bearer ${secretKey}` },
      });

      if (response.data.status) {
        return {
          success: true,
          message: `Connected to Paystack (${keyType} key)`,
          keyType,
        };
      }

      return { success: false, message: 'Paystack returned error', keyType };
    } catch (error) {
      const msg = axios.isAxiosError(error)
        ? error.response?.data?.message || error.message
        : error.message;
      return { success: false, message: msg, keyType: 'unknown' };
    }
  }

  async auditPayments(): Promise<any[]> {
    const registrations = await this.registrationsService.findAll({});
    const secretKey = await this.getPaystackSecretKey();
    const results: any[] = [];

    for (const reg of registrations) {
      if (!reg.paymentReference || reg.paymentStatus !== 'paid') {
        continue;
      }

      try {
        const response = await axios.get(
          `${this.paystackBaseUrl}/transaction/verify/${reg.paymentReference}`,
          { headers: { Authorization: `Bearer ${secretKey}` } },
        );

        const paystackData = response.data.data;
        const paystackAmount = paystackData.amount / 100;
        const discrepancies: string[] = [];

        if (Math.abs(paystackAmount - reg.totalAmount) > 0.01) {
          discrepancies.push(`Amount mismatch: DB=₦${reg.totalAmount.toLocaleString()}, Paystack=₦${paystackAmount.toLocaleString()}`);
        }

        if (paystackData.status !== 'success') {
          discrepancies.push(`Paystack status: ${paystackData.status}`);
        }

        if (paystackData.customer?.email && paystackData.customer.email.toLowerCase() !== reg.email.toLowerCase()) {
          discrepancies.push(`Email mismatch: DB=${reg.email}, Paystack=${paystackData.customer.email}`);
        }

        results.push({
          registrationId: reg.id,
          name: `${reg.firstName} ${reg.surname}`,
          email: reg.email,
          dbAmount: reg.totalAmount,
          paystackAmount,
          dbStatus: reg.paymentStatus,
          paystackStatus: paystackData.status,
          paidAt: paystackData.paid_at,
          discrepancies,
          healthy: discrepancies.length === 0,
        });
      } catch (error) {
        results.push({
          registrationId: reg.id,
          name: `${reg.firstName} ${reg.surname}`,
          email: reg.email,
          dbAmount: reg.totalAmount,
          paystackAmount: null,
          dbStatus: reg.paymentStatus,
          paystackStatus: 'not_found',
          paidAt: null,
          discrepancies: [`Paystack lookup failed: ${axios.isAxiosError(error) ? error.response?.data?.message || error.message : error.message}`],
          healthy: false,
        });
      }
    }

    return results;
  }

  private async getPaystackSecretKey(): Promise<string> {
    const dbKey = await this.settingsService.getPaystackSecretKey();
    return dbKey || this.configService.get<string>('PAYSTACK_SECRET_KEY') || '';
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
        
        // Get the split code that was used (if any)
        const splitCode = data.split?.split_code || null;
        
        // Update payment status with the actual Paystack reference
        await this.registrationsService.updatePaymentStatus(
          registration.id,
          'paid',
          reference, // Use the actual Paystack reference
          new Date(data.paid_at),
          splitCode, // Store the split code used
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

  async initializePayment(
    email: string,
    amount: number,
    reference: string,
    metadata?: Record<string, any>,
  ) {
    try {
      const secretKey = await this.getPaystackSecretKey();
      const splitCode = (await this.settingsService.getPaystackSplitCode())?.trim();
      const frontendUrl = this.configService.get('FRONTEND_URL') || 'http://localhost:5173';

      const payload: any = {
        email,
        amount: amount * 100, // Convert to kobo
        reference,
        callback_url: `${frontendUrl}/payment/callback`,
      };

      if (metadata) {
        payload.metadata = metadata;
      }

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
