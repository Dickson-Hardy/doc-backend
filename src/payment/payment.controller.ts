import { Controller, Post, Body, Get, Query, Req, HttpCode, HttpStatus } from '@nestjs/common';
import { PaymentService } from './payment.service';
import { Public } from '../auth/decorators/public.decorator';
import { Request } from 'express';

@Controller('payment')
export class PaymentController {
  constructor(private readonly paymentService: PaymentService) {}

  @Post('verify')
  @Public()
  async verifyPayment(@Body('reference') reference: string) {
    return this.paymentService.verifyPayment(reference);
  }

  @Post('webhook')
  @Public()
  @HttpCode(HttpStatus.OK)
  async handleWebhook(@Req() req: Request) {
    // Verify webhook signature
    const signature = req.headers['x-paystack-signature'] as string;
    
    if (!signature) {
      return { status: 'error', message: 'No signature provided' };
    }

    const event = req.body;
    
    // Verify signature matches
    const isValid = await this.paymentService.verifyWebhookSignature(
      JSON.stringify(event),
      signature,
    );

    if (!isValid) {
      return { status: 'error', message: 'Invalid signature' };
    }

    // Handle the event
    if (event.event === 'charge.success') {
      const reference = event.data.reference;
      await this.paymentService.verifyPayment(reference);
    }

    return { status: 'success' };
  }

  @Get('callback')
  @Public()
  async handleCallback(@Query('reference') reference: string) {
    if (!reference) {
      return { status: 'error', message: 'No reference provided' };
    }

    try {
      const result = await this.paymentService.verifyPayment(reference);
      return {
        status: 'success',
        message: 'Payment verified successfully',
        data: result,
      };
    } catch (error) {
      return {
        status: 'error',
        message: error.message,
      };
    }
  }
}
