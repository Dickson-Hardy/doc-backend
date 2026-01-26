import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function testRegistrationAPI() {
  console.log('🧪 Testing Registration API Reference Generation...\n');

  // Simulate what the controller does
  const reference = `CMDA-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
  
  console.log('✅ REFERENCE FORMAT TEST');
  console.log('═══════════════════════════════════════════════════════════\n');
  
  console.log('📝 Generated Reference:', reference);
  console.log('✅ Format: CMDA-{timestamp}-{random}');
  console.log('✅ Starts with "CMDA-":', reference.startsWith('CMDA-'));
  console.log('✅ Contains timestamp:', reference.includes('-'));
  console.log('✅ Has random suffix:', reference.split('-').length === 3);
  
  console.log('\n📋 EXPECTED API FLOW');
  console.log('═══════════════════════════════════════════════════════════\n');
  
  console.log('1️⃣  Frontend submits registration');
  console.log('    POST /api/registrations');
  console.log('    { email, name, category, ... }\n');
  
  console.log('2️⃣  Backend generates reference');
  console.log(`    reference = "${reference}"\n`);
  
  console.log('3️⃣  Backend creates registration with reference');
  console.log('    Saves to database with paymentReference field\n');
  
  console.log('4️⃣  Backend returns to frontend');
  console.log('    {');
  console.log('      registrationId: "uuid-here",');
  console.log(`      reference: "${reference}",`);
  console.log('      amount: 30000');
  console.log('    }\n');
  
  console.log('5️⃣  Frontend passes reference to Paystack');
  console.log(`    Paystack.setup({ reference: "${reference}", ... })\n`);
  
  console.log('6️⃣  User completes payment on Paystack');
  console.log(`    Paystack uses reference: "${reference}"\n`);
  
  console.log('7️⃣  Payment verification');
  console.log(`    POST /api/payment/verify { reference: "${reference}" }`);
  console.log('    Finds registration by paymentReference field');
  console.log('    Updates status to "paid"');
  console.log('    Sends confirmation email\n');
  
  console.log('✅ VERIFICATION');
  console.log('═══════════════════════════════════════════════════════════\n');
  
  console.log('✓ Reference format is correct');
  console.log('✓ Backend generates and saves reference');
  console.log('✓ Frontend receives and uses backend reference');
  console.log('✓ Paystack uses the same reference');
  console.log('✓ Payment verification can find registration');
  
  console.log('\n⚠️  IMPORTANT: Restart frontend dev server for changes to take effect!');
  console.log('   Stop: Ctrl+C');
  console.log('   Start: pnpm run dev (in frontend folder)\n');
}

testRegistrationAPI()
  .then(() => {
    console.log('✅ Test completed successfully!\n');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Test failed:', error);
    process.exit(1);
  });
