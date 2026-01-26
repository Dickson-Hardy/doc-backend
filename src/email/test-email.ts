import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { EmailService } from './email.service';
import * as nodemailer from 'nodemailer';

async function testEmail() {
  console.log('🚀 Starting email test...\n');
  
  const app = await NestFactory.createApplicationContext(AppModule);
  const emailService = app.get(EmailService);

  // First, test SMTP connection
  console.log('🔍 Testing SMTP connection...');
  const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,
    secure: false,
    auth: {
      user: 'cmdassociation.nigeria@gmail.com',
      pass: 'xvvdaikblxlgvdiy',
    },
    debug: true, // Enable debug output
    logger: true, // Log to console
  });

  try {
    await transporter.verify();
    console.log('✅ SMTP connection verified!\n');
  } catch (error) {
    console.error('❌ SMTP connection failed:', error.message);
    console.error('\n🔍 Possible issues:');
    console.error('   1. App password might be incorrect');
    console.error('   2. Gmail account might not have 2FA enabled');
    console.error('   3. App password might have been revoked');
    console.error('\n📝 Please verify:');
    console.error('   - Go to: https://myaccount.google.com/apppasswords');
    console.error('   - Generate a new app password');
    console.error('   - Update SMTP_PASS in .env file');
    await app.close();
    return;
  }

  try {
    // Test registration data
    const testRegistration = {
      id: 'TEST-' + Date.now(),
      firstName: 'Dickson',
      surname: 'Hardy',
      category: 'Doctor',
      totalAmount: 50000,
      paymentReference: 'TEST-REF-' + Date.now(),
    };

    console.log('📧 Sending test email to: dicksonhardy7@gmail.com');
    console.log('📋 Test Registration Data:');
    console.log(JSON.stringify(testRegistration, null, 2));
    console.log('\n⏳ Sending email...\n');

    await emailService.sendRegistrationConfirmation(
      'dicksonhardy7@gmail.com',
      testRegistration,
    );

    console.log('✅ Email sent successfully!');
    console.log('\n📬 Check your inbox at: dicksonhardy7@gmail.com');
    console.log('📱 Also check:');
    console.log('   - Spam/Junk folder');
    console.log('   - Promotions tab (if using Gmail)');
    console.log('   - All Mail folder');
    console.log('\n📄 Email Details:');
    console.log('   - Subject: ✅ CMDA Conference 2026 - Registration Confirmed');
    console.log('   - From: CMDA Nigeria <cmdassociation.nigeria@gmail.com>');
    console.log('   - Contains: QR Code for conference pass');
    console.log('   - Registration ID:', testRegistration.id);
    console.log('   - Amount: ₦50,000');
    console.log('\n⏰ Email may take 1-2 minutes to arrive');
    
  } catch (error) {
    console.error('❌ Error sending email:', error.message);
    console.error('\n🔍 Troubleshooting:');
    console.error('   1. Check SMTP credentials in .env file');
    console.error('   2. Verify Gmail app password is correct');
    console.error('   3. Ensure internet connection is active');
    console.error('   4. Check if Gmail account has 2FA enabled');
    console.error('\n📝 Error Details:', error);
  }

  await app.close();
}

testEmail();
