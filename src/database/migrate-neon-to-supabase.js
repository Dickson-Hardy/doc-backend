const { Client } = require('pg');

// Neon (source)
const NEON_CONFIG = {
  connectionString: 'postgresql://neondb_owner:npg_T2PFN5CDYkds@ep-autumn-haze-ahnuvjzs-pooler.c-3.us-east-1.aws.neon.tech/neondb?sslmode=require',
  ssl: { rejectUnauthorized: false },
};

// Supabase (target) - using direct connection for migration
const SUPABASE_CONFIG = {
  host: 'aws-1-us-east-1.pooler.supabase.com',
  port: 5432,
  user: 'postgres.sfsmorwxipeuvdriqzft',
  password: 'E27hm05AtxOatmUc',
  database: 'postgres',
  ssl: { rejectUnauthorized: false },
};

const NEON_TABLES = ['registrations', 'admin_users', 'app_settings', 'email_logs'];

const CREATE_TABLES_SQL = `
CREATE TABLE IF NOT EXISTS admin_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR NOT NULL UNIQUE,
  password VARCHAR NOT NULL,
  "firstName" VARCHAR NOT NULL,
  "lastName" VARCHAR NOT NULL,
  role VARCHAR NOT NULL DEFAULT 'admin',
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "lastLoginAt" TIMESTAMP,
  "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
  "updatedAt" TIMESTAMP NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS app_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key VARCHAR NOT NULL UNIQUE,
  value TEXT,
  description TEXT,
  "isEncrypted" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
  "updatedAt" TIMESTAMP NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS registrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "memberMongoId" VARCHAR,
  "memberId" VARCHAR,
  email VARCHAR NOT NULL,
  surname VARCHAR NOT NULL,
  "firstName" VARCHAR NOT NULL,
  "otherNames" VARCHAR,
  age INTEGER NOT NULL,
  sex VARCHAR NOT NULL,
  phone VARCHAR NOT NULL,
  chapter VARCHAR NOT NULL,
  state VARCHAR,
  "currentLeadershipPost" VARCHAR,
  "previousLeadershipPost" VARCHAR,
  category VARCHAR NOT NULL,
  "chapterOfGraduation" VARCHAR,
  "spouseSurname" VARCHAR,
  "spouseFirstName" VARCHAR,
  "spouseOtherNames" VARCHAR,
  "spouseEmail" VARCHAR,
  "dateOfArrival" DATE NOT NULL,
  "accommodationType" VARCHAR,
  "covenantRoomType" VARCHAR,
  "temperanceRoomType" VARCHAR,
  "roomSharing" VARCHAR,
  "roommateName" VARCHAR,
  "hasAbstract" BOOLEAN NOT NULL DEFAULT false,
  "presentationTitle" VARCHAR,
  "abstractFileUrl" VARCHAR,
  "baseFee" INTEGER NOT NULL DEFAULT 0,
  "lateFee" INTEGER NOT NULL DEFAULT 0,
  "totalAmount" INTEGER NOT NULL DEFAULT 0,
  "paymentStatus" VARCHAR NOT NULL DEFAULT 'pending',
  "paymentReference" VARCHAR,
  "paidAt" TIMESTAMP,
  "splitCode" VARCHAR,
  "attendanceVerified" BOOLEAN NOT NULL DEFAULT false,
  "verifiedAt" TIMESTAMP,
  "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
  "updatedAt" TIMESTAMP NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS email_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "recipientEmail" VARCHAR NOT NULL,
  subject VARCHAR NOT NULL,
  status VARCHAR NOT NULL,
  "errorMessage" TEXT,
  "registrationId" VARCHAR,
  "sentAt" TIMESTAMP NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR NOT NULL UNIQUE,
  surname VARCHAR NOT NULL,
  "firstName" VARCHAR NOT NULL,
  "otherNames" VARCHAR,
  age INTEGER NOT NULL DEFAULT 25,
  sex VARCHAR NOT NULL,
  phone VARCHAR NOT NULL,
  chapter VARCHAR NOT NULL,
  state VARCHAR,
  "isCmdaMember" BOOLEAN NOT NULL DEFAULT false,
  "currentLeadershipPost" VARCHAR,
  "previousLeadershipPost" VARCHAR,
  category VARCHAR NOT NULL,
  "chapterOfGraduation" VARCHAR,
  "yearsInPractice" VARCHAR,
  "membershipId" VARCHAR,
  "licenseNumber" VARCHAR,
  specialty VARCHAR,
  role VARCHAR,
  "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
  "updatedAt" TIMESTAMP NOT NULL DEFAULT now()
);
`;

async function exportFromNeon() {
  const client = new Client(NEON_CONFIG);
  await client.connect();
  const data = {};

  for (const table of NEON_TABLES) {
    try {
      const result = await client.query(`SELECT * FROM ${table}`);
      data[table] = result.rows;
      console.log(`  ✓ ${table}: ${result.rows.length} rows exported`);
    } catch (err) {
      console.log(`  ✗ ${table}: ${err.message}`);
      data[table] = [];
    }
  }

  await client.end();
  return data;
}

async function importToSupabase(data) {
  const client = new Client(SUPABASE_CONFIG);
  await client.connect();

  console.log('  Creating tables...');
  try {
    await client.query(CREATE_TABLES_SQL);
    console.log('  ✓ Tables created/verified');
  } catch (err) {
    console.log(`  ⚠ Table creation: ${err.message}`);
  }

  await client.query('SET session_replication_role = replica');

  for (const table of NEON_TABLES) {
    const rows = data[table];
    if (!rows || rows.length === 0) {
      console.log(`  ⊘ ${table}: skipped (no data)`);
      continue;
    }

    // Get column names from first row
    const columns = Object.keys(rows[0]);
    const colList = columns.map(c => `"${c}"`).join(', ');

    try {
      await client.query(`TRUNCATE TABLE ${table} CASCADE`);
    } catch (err) {
      console.log(`  ⚠ TRUNCATE ${table}: ${err.message}`);
    }

    let inserted = 0;
    for (const row of rows) {
      const values = columns.map((col, i) => {
        const val = row[col];
        if (val === null || val === undefined) return null;
        if (typeof val === 'object') return JSON.stringify(val);
        return val;
      });

      const placeholders = columns.map((_, i) => `$${i + 1}`);
      const sql = `INSERT INTO ${table} (${colList}) VALUES (${placeholders.join(', ')})`;

      try {
        await client.query(sql, values);
        inserted++;
      } catch (err) {
        console.log(`  ⚠ ${table} row failed: ${err.message}`);
        console.log(`    Row: ${JSON.stringify(row).substring(0, 150)}`);
      }
    }

    console.log(`  ✓ ${table}: ${inserted}/${rows.length} rows imported`);
  }

  await client.query('SET session_replication_role = DEFAULT');
  await client.end();
}

async function main() {
  console.log('=== Neon → Supabase Migration ===\n');

  console.log('1. Exporting from Neon...');
  const data = await exportFromNeon();

  console.log('\n2. Importing to Supabase...');
  await importToSupabase(data);

  console.log('\n=== Migration complete ===');
}

main().catch(err => {
  console.error('Migration failed:', err);
  process.exit(1);
});
