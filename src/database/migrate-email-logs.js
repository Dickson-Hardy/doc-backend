const { Client } = require('pg');

const NEON_CONFIG = {
  connectionString: 'postgresql://neondb_owner:npg_T2PFN5CDYkds@ep-autumn-haze-ahnuvjzs-pooler.c-3.us-east-1.aws.neon.tech/neondb?sslmode=require',
  ssl: { rejectUnauthorized: false },
};

const SUPABASE_CONFIG = {
  host: 'aws-1-us-east-1.pooler.supabase.com',
  port: 5432,
  user: 'postgres.sfsmorwxipeuvdriqzft',
  password: 'E27hm05AtxOatmUc',
  database: 'postgres',
  ssl: { rejectUnauthorized: false },
};

async function migrateEmailLogs() {
  const neon = new Client(NEON_CONFIG);
  const supabase = new Client(SUPABASE_CONFIG);
  await neon.connect();
  await supabase.connect();

  console.log('Exporting email_logs from Neon...');
  const result = await neon.query('SELECT * FROM email_logs');
  const rows = result.rows;
  console.log(`Exported ${rows.length} email_logs`);

  await supabase.query('SET session_replication_role = replica');
  await supabase.query('TRUNCATE TABLE email_logs CASCADE');

  const columns = Object.keys(rows[0]);
  const colList = columns.map(c => `"${c}"`).join(', ');

  let inserted = 0;
  let failed = 0;
  for (const row of rows) {
    const values = columns.map(col => {
      const val = row[col];
      if (val === null || val === undefined) return null;
      if (typeof val === 'object') return JSON.stringify(val);
      return val;
    });
    const placeholders = columns.map((_, i) => `$${i + 1}`);
    try {
      await supabase.query(`INSERT INTO email_logs (${colList}) VALUES (${placeholders.join(', ')})`, values);
      inserted++;
    } catch (err) {
      failed++;
      if (failed <= 3) console.log(`  ⚠ row failed: ${err.message}`);
    }
  }

  console.log(`✓ email_logs: ${inserted}/${rows.length} imported (${failed} failed)`);
  await supabase.query('SET session_replication_role = DEFAULT');
  await neon.end();
  await supabase.end();
}

migrateEmailLogs().catch(err => { console.error(err); process.exit(1); });
