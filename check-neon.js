const { Client } = require('pg');
const c = new Client({ 
  connectionString: 'postgresql://neondb_owner:npg_T2PFN5CDYkds@ep-autumn-haze-ahnuvjzs-pooler.c-3.us-east-1.aws.neon.tech/neondb?sslmode=require',
  ssl: { rejectUnauthorized: false } 
});
(async () => {
  await c.connect();
  const tables = await c.query("SELECT table_name FROM information_schema.tables WHERE table_schema='public' ORDER BY table_name");
  console.log('Tables:', tables.rows.map(r => r.table_name));
  for (const t of tables.rows) {
    const count = await c.query(`SELECT COUNT(*) FROM "${t.table_name}"`);
    console.log(`  ${t.table_name}: ${count.rows[0].count} rows`);
  }

  console.log('\n=== REGISTRATIONS ===');
  const regs = await c.query('SELECT id, email, "firstName", surname, category, "paymentStatus", "totalAmount", "createdAt" FROM registrations ORDER BY "createdAt" DESC');
  regs.rows.forEach((r, i) => console.log(`${i+1}. ${r.firstName} ${r.surname} | ${r.email} | ${r.category} | ${r.paymentStatus} | N${r.totalAmount} | ${r.createdAt}`));

  console.log('\n=== ADMIN USERS ===');
  const admins = await c.query('SELECT id, email, role FROM admin_users');
  admins.rows.forEach(r => console.log(`${r.email} (${r.role})`));

  console.log('\n=== APP SETTINGS ===');
  const settings = await c.query('SELECT key, value, "isEncrypted" FROM app_settings');
  settings.rows.forEach(r => console.log(`${r.key} = ${r.isEncrypted ? '***ENCRYPTED***' : r.value}`));

  console.log('\n=== EMAIL LOGS ===');
  const emails = await c.query('SELECT id, "recipientEmail", status, "sentAt" FROM email_logs ORDER BY "sentAt" DESC LIMIT 10');
  emails.rows.forEach(r => console.log(`${r.recipientEmail} | ${r.status} | ${r.sentAt}`));

  await c.end();
})().catch(e => console.error('ERROR:', e.message));
