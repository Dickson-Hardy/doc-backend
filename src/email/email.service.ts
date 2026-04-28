import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import SMTPTransport from 'nodemailer/lib/smtp-transport';
import * as QRCode from 'qrcode';

@Injectable()
export class EmailService implements OnModuleInit {
  private readonly logger = new Logger(EmailService.name);
  private transporter: nodemailer.Transporter;
  private fallbackTransporter: nodemailer.Transporter;

  constructor(private configService: ConfigService) {
    const smtpUser = this.configService.get('SMTP_USER');
    const smtpHost = this.configService.get('SMTP_HOST') || 'smtp.gmail.com';
    const smtpPort = parseInt(this.configService.get('SMTP_PORT') || '587', 10);

    const primaryOptions: SMTPTransport.Options = {
      host: smtpHost,
      port: smtpPort,
      secure: smtpPort === 465,
      auth: {
        user: smtpUser,
        pass: this.configService.get('SMTP_PASS'),
      },
      tls: {
        rejectUnauthorized: false, // Allow self-signed certificates
      },
    };

    // Primary transporter (configured SMTP or Gmail)
    this.transporter = nodemailer.createTransport(primaryOptions);

    const fallbackOptions: SMTPTransport.Options = {
      host: 'smtp.gmail.com',
      port: 587,
      secure: false,
      auth: {
        user: this.configService.get('SMTP_USER') || 'cmdassociation.nigeria@gmail.com',
        pass: this.configService.get('SMTP_PASS') || 'xvvdaikblxlgvdiy',
      },
      tls: {
        rejectUnauthorized: false,
      },
    };

    // Fallback Gmail transporter (always available)
    this.fallbackTransporter = nodemailer.createTransport(fallbackOptions);
  }

  async onModuleInit() {
    try {
      await this.transporter.verify();
      this.logger.log('✅ Primary SMTP transport verified successfully');
    } catch (error) {
      this.logger.warn(`⚠️ Primary SMTP transport verification failed: ${error.message}. Will use Gmail fallback.`);
      try {
        await this.fallbackTransporter.verify();
        this.logger.log('✅ Gmail fallback transport verified successfully');
      } catch (fallbackError) {
        this.logger.error(`❌ Gmail fallback transport verification also failed: ${fallbackError.message}`);
      }
    }
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

    const textContent = `CMDA National Conference 2026\n\n` +
      `Dear ${registrationData.firstName} ${registrationData.surname},\n\n` +
      `Your registration is confirmed.\n` +
      `Registration ID: ${registrationData.id}\n` +
      `Category: ${registrationData.category}\n` +
      `Amount Paid: ₦${registrationData.totalAmount.toLocaleString()}\n` +
      `Payment Reference: ${registrationData.paymentReference}\n\n` +
      `Your QR code is attached as conference-pass.png.\n` +
      `Please present it at check-in.\n`;

    const mailOptions = {
      from: this.configService.get('EMAIL_FROM') || `"CMDA Conference" <${this.configService.get('SMTP_USER')}>`,
      to: email,
      subject: '✅ CMDA Conference 2026 - Registration Confirmed',
      html: htmlContent,
      text: textContent,
      priority: 'high' as const, // Mark as high priority
      headers: {
        'X-Priority': '1', // Highest priority
        'X-MSMail-Priority': 'High',
        'Importance': 'high',
      },
      attachments: [
        {
          filename: 'conference-pass.png',
          content: qrCodeBuffer,
          contentType: 'image/png',
          cid: 'qrcode',
          contentDisposition: 'inline',
        },
      ],
    };

    // Try primary transporter first, then fallback
    try {
      await this.transporter.sendMail(mailOptions);
      this.logger.log(`✅ Email sent successfully to ${email} via primary transport`);
    } catch (primaryError) {
      this.logger.warn(`⚠️ Primary transport failed for ${email}: ${primaryError.message}. Attempting fallback...`);
      try {
        await this.fallbackTransporter.sendMail(mailOptions);
        this.logger.log(`✅ Email sent successfully to ${email} via Gmail fallback`);
      } catch (fallbackError) {
        this.logger.error(`❌ Both primary and fallback transports failed for ${email}:`, fallbackError.message);
        throw new Error(`Failed to send email to ${email}: ${fallbackError.message}`);
      }
    }
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
