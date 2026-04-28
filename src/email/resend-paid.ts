import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { RegistrationsService } from '../registrations/registrations.service';

async function resendPaidEmails() {
  console.log('🚀 Starting resend for all paid registrations...');

  const app = await NestFactory.createApplicationContext(AppModule);
  const registrationsService = app.get(RegistrationsService);

  try {
    const paidRegistrations = await registrationsService.findAll({
      paymentStatus: 'paid',
    });

    if (paidRegistrations.length === 0) {
      console.log('✅ No paid registrations found. Nothing to resend.');
      return;
    }

    const limitRaw = process.env.RESEND_LIMIT;
    const limit = limitRaw ? Number.parseInt(limitRaw, 10) : undefined;
    const dryRun = process.env.DRY_RUN === 'true';

    const target = limit && Number.isFinite(limit)
      ? paidRegistrations.slice(0, limit)
      : paidRegistrations;

    console.log(`Total paid registrations: ${paidRegistrations.length}`);
    console.log(`Resending to: ${target.length}`);
    console.log(`Dry run: ${dryRun ? 'true' : 'false'}`);

    let successCount = 0;
    let failureCount = 0;

    for (const registration of target) {
      const label = `${registration.email} (${registration.id})`;
      if (dryRun) {
        console.log(`[DRY RUN] Would resend to ${label}`);
        continue;
      }

      try {
        await registrationsService.resendConfirmationEmail(registration.id);
        console.log(`✅ Resent to ${label}`);
        successCount++;
      } catch (error) {
        console.error(`❌ Failed to resend to ${label}: ${error.message}`);
        failureCount++;
      }
    }

    if (!dryRun) {
      console.log('---');
      console.log(`✅ Success: ${successCount}`);
      console.log(`❌ Failed: ${failureCount}`);
    }
  } finally {
    await app.close();
  }
}

resendPaidEmails().catch((error) => {
  console.error('❌ Resend job failed:', error.message || error);
  process.exit(1);
});
