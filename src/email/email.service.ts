import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import * as QRCode from 'qrcode';

@Injectable()
export class EmailService {
  private transporter: nodemailer.Transporter;

  constructor(private configService: ConfigService) {
    this.transporter = nodemailer.createTransport({
      host: this.configService.get('SMTP_HOST'),
      port: parseInt(this.configService.get('SMTP_PORT') || '587'),
      secure: this.configService.get('SMTP_PORT') === '465', // true for 465, false for other ports
      auth: {
        user: this.configService.get('SMTP_USER'),
        pass: this.configService.get('SMTP_PASS'),
      },
      tls: {
        rejectUnauthorized: false, // Allow self-signed certificates
      },
    });
  }

  async sendRegistrationConfirmation(
    email: string,
    registrationData: {
      id: string;
      firstName: string;
      surname: string;
      category: string;
      totalAmount: number;
      paymentReference: string;
    },
  ): Promise<void> {
    // Generate QR code with registration ID
    const qrCodeData = JSON.stringify({
      registrationId: registrationData.id,
      email: email,
      name: `${registrationData.firstName} ${registrationData.surname}`,
      verified: false,
    });

    const qrCodeBuffer = await QRCode.toBuffer(qrCodeData, {
      errorCorrectionLevel: 'H',
      type: 'png',
      width: 300,
    });

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .qr-section { text-align: center; margin: 30px 0; padding: 20px; background: white; border-radius: 10px; }
          .details { background: white; padding: 20px; border-radius: 10px; margin: 20px 0; }
          .detail-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #eee; }
          .detail-label { font-weight: bold; color: #667eea; }
          .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
          .important { background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0; border-radius: 5px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🎉 Registration Confirmed!</h1>
            <p>CMDA National Conference 2026</p>
          </div>
          <div class="content">
            <h2>Dear ${registrationData.firstName} ${registrationData.surname},</h2>
            <p>Thank you for registering for the CMDA National Conference 2026. Your payment has been successfully processed.</p>
            
            <div class="details">
              <div class="detail-row">
                <span class="detail-label">Registration ID:</span>
                <span>${registrationData.id}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Category:</span>
                <span>${registrationData.category}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Amount Paid:</span>
                <span>₦${registrationData.totalAmount.toLocaleString()}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Payment Reference:</span>
                <span>${registrationData.paymentReference}</span>
              </div>
            </div>

            <div class="qr-section">
              <h3>Your Conference Pass</h3>
              <p>Please present this QR code at the conference venue for check-in:</p>
              <img src="cid:qrcode" alt="Conference Pass QR Code" style="max-width: 300px; margin: 20px auto;" />
            </div>

            <div class="important">
              <strong>⚠️ Important:</strong>
              <ul>
                <li>Save this email or take a screenshot of the QR code</li>
                <li>Present the QR code at registration desk on arrival</li>
                <li>Keep your registration ID for reference</li>
              </ul>
            </div>

            <p>We look forward to seeing you at the conference!</p>
            <p>For any inquiries, please contact us at <a href="mailto:conference@cmdanigeria.org">conference@cmdanigeria.org</a></p>
          </div>
          <div class="footer">
            <p>© 2026 Christian Medical & Dental Association of Nigeria</p>
            <p>This is an automated email. Please do not reply.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    await this.transporter.sendMail({
      from: this.configService.get('EMAIL_FROM') || `"CMDA Conference" <${this.configService.get('SMTP_USER')}>`,
      to: email,
      subject: '✅ CMDA Conference 2026 - Registration Confirmed',
      html: htmlContent,
      priority: 'high', // Mark as high priority
      headers: {
        'X-Priority': '1', // Highest priority
        'X-MSMail-Priority': 'High',
        'Importance': 'high',
      },
      attachments: [
        {
          filename: 'conference-pass.png',
          content: qrCodeBuffer,
          cid: 'qrcode',
        },
      ],
    });
  }

  async logEmail(
    email: string,
    subject: string,
    status: 'sent' | 'failed',
    error?: string,
  ): Promise<void> {
    // This will be stored in database via EmailLog entity
    console.log(`Email Log: ${email} - ${subject} - ${status}`, error || '');
  }
}
