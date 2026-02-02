const { Client } = require('pg');
require('dotenv').config({ path: '.env.production' });

async function checkSplitCode() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: {
      rejectUnauthorized: false
    }
  });

  try {
    await client.connect();
    console.log('Connected to database\n');

    // Check if split code is configured
    const settingsResult = await client.query(
      "SELECT * FROM app_settings WHERE key = 'paystack_split_code'"
    );

    console.log('=== SPLIT CODE CONFIGURATION ===');
    if (settingsResult.rows.length > 0) {
      console.log('✅ Split code is configured:');
      console.log(JSON.stringify(settingsResult.rows[0], null, 2));
    } else {
      console.log('❌ Split code is NOT configured in database');
      console.log('   Run the seed-split-code script to configure it');
    }

    // Check registrations with split code
    const paidWithSplit = await client.query(
      'SELECT COUNT(*) as count FROM registrations WHERE "paymentStatus" = \'paid\' AND "splitCode" IS NOT NULL'
    );

    const paidWithoutSplit = await client.query(
      'SELECT COUNT(*) as count FROM registrations WHERE "paymentStatus" = \'paid\' AND "splitCode" IS NULL'
    );

    const pending = await client.query(
      'SELECT COUNT(*) as count FROM registrations WHERE "paymentStatus" = \'pending\''
    );

    console.log('\n=== REGISTRATION STATISTICS ===');
    console.log(`Paid with split code: ${paidWithSplit.rows[0].count}`);
    console.log(`Paid without split code: ${paidWithoutSplit.rows[0].count}`);
    console.log(`Pending payments: ${pending.rows[0].count}`);

    // Show recent registrations
    const recent = await client.query(
      `SELECT id, email, "paymentStatus", "splitCode", "createdAt", "paidAt" 
       FROM registrations 
       ORDER BY "createdAt" DESC 
       LIMIT 5`
    );

    console.log('\n=== RECENT REGISTRATIONS ===');
    recent.rows.forEach((row, i) => {
      console.log(`\n${i + 1}. ${row.email}`);
      console.log(`   Status: ${row.paymentStatus}`);
      console.log(`   Split Code: ${row.splitCode || 'null'}`);
      console.log(`   Created: ${row.createdAt}`);
      console.log(`   Paid: ${row.paidAt || 'N/A'}`);
    });

  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

checkSplitCode();
