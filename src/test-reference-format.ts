// Quick test to verify reference format
const reference = `CMDA-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

console.log('\n🔍 REFERENCE FORMAT CHECK\n');
console.log('Generated Reference:', reference);
console.log('Starts with CMDA-:', reference.startsWith('CMDA-'));
console.log('Format is correct:', /^CMDA-\d+-[a-z0-9]+$/.test(reference));

console.log('\n❌ WRONG FORMAT (Paystack test mode):');
console.log('T059007332894128 - This is Paystack auto-generated');
console.log('T924575690678746 - This is Paystack auto-generated');

console.log('\n✅ CORRECT FORMAT (Backend generated):');
console.log(reference, '- This is what we should see');

console.log('\n📋 WHAT TO CHECK:');
console.log('1. Open browser DevTools (F12)');
console.log('2. Go to Network tab');
console.log('3. Submit registration form');
console.log('4. Find POST request to /api/registrations');
console.log('5. Check response body - should have reference starting with CMDA-');
console.log('6. If you see T-references, frontend code is still old\n');
