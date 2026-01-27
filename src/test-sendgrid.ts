import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { EmailService } from './email/email.service';

async function testSendGrid() {
  console.log('🚀 Testing SendGrid Email Configuration...\n');

  const app = await NestFactory.createApplicationContext(AppModule);
  const emailService = app.get(EmailService);

  try {
    console.log('📧 Sending test email...');
    const startTime = Date.now();

    await emailService.sendRegistrationConfirmation(
      'dicksonhardy7@gmail.com', // Send test to your Gmail
      {
        id: 'TEST-' + Date.now(),
        firstName: 'Test',
        surname: 'User',
        category: 'doctor',
        totalAmount: 40000,
        paymentReference: 'TEST-REF-' + Date.now(),
      },
    );

    const endTime = Date.now();
    const duration = ((endTime - startTime) / 1000).toFixed(2);

    console.log(`\n✅ Email sent successfully in ${duration} seconds!`);
    console.log('📬 Check your inbox: dicksonhardy7@gmail.com');
    console.log('📊 View delivery status: https://app.sendgrid.com/email_activity');
    console.log('\n💡 Expected delivery time: 1-5 seconds');
  } catch (error) {
    console.error('\n❌ Email sending failed:');
    console.error(error.message);
    
    if (error.message.includes('authentication')) {
      console.log('\n🔧 Troubleshooting:');
      console.log('1. Check SMTP_USER is exactly "apikey" (lowercase)');
      console.log('2. Verify SMTP_PASS is your SendGrid API key');
      console.log('3. Ensure API key has "Mail Send" permission');
    } else if (error.message.includes('sender')) {
      console.log('\n🔧 Troubleshooting:');
      console.log('1. Verify sender email in SendGrid dashboard');
      console.log('2. Go to: Settings → Sender Authentication');
      console.log('3. Check for verification email from SendGrid');
    }
  } finally {
    await app.close();
  }
}

testSendGrid();
