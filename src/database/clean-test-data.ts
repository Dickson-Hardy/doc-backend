import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { DataSource } from 'typeorm';

async function cleanTestData() {
  console.log('🧹 Starting database cleanup...\n');
  
  const app = await NestFactory.createApplicationContext(AppModule);
  const dataSource = app.get(DataSource);

  try {
    // Check current registrations
    console.log('📊 Current Database State:');
    console.log('─'.repeat(80));
    
    const registrations = await dataSource.query(`
      SELECT 
        id, 
        email, 
        "firstName", 
        surname, 
        category,
        "paymentStatus",
        "totalAmount",
        "paymentReference",
        "createdAt"
      FROM registrations 
      ORDER BY "createdAt" DESC
    `);

    console.log(`\nTotal Registrations: ${registrations.length}\n`);

    if (registrations.length === 0) {
      console.log('✅ Database is already clean - no registrations found\n');
      await app.close();
      return;
    }

    // Display all registrations
    registrations.forEach((reg: any, index: number) => {
      console.log(`${index + 1}. ${reg.firstName} ${reg.surname}`);
      console.log(`   Email: ${reg.email}`);
      console.log(`   Category: ${reg.category}`);
      console.log(`   Status: ${reg.paymentStatus}`);
      console.log(`   Amount: ₦${reg.totalAmount?.toLocaleString()}`);
      console.log(`   Reference: ${reg.paymentReference || 'N/A'}`);
      console.log(`   Created: ${new Date(reg.createdAt).toLocaleString()}`);
      console.log('');
    });

    // Count by status
    const statusCounts = await dataSource.query(`
      SELECT 
        "paymentStatus",
        COUNT(*) as count
      FROM registrations
      GROUP BY "paymentStatus"
    `);

    console.log('📈 Status Breakdown:');
    statusCounts.forEach((stat: any) => {
      console.log(`   ${stat.paymentStatus}: ${stat.count}`);
    });
    console.log('');

    // Check email logs
    const emailLogs = await dataSource.query(`
      SELECT COUNT(*) as count FROM email_logs
    `);
    console.log(`📧 Email Logs: ${emailLogs[0].count}\n`);

    // Confirm deletion
    console.log('⚠️  WARNING: This will DELETE ALL registrations and email logs!');
    console.log('─'.repeat(80));
    console.log('\n🗑️  Deleting all test data...\n');

    // Delete email logs first (foreign key constraint)
    const deletedEmails = await dataSource.query(`
      DELETE FROM email_logs
    `);
    console.log(`✅ Deleted ${deletedEmails[1]} email logs`);

    // Delete registrations
    const deletedRegs = await dataSource.query(`
      DELETE FROM registrations
    `);
    console.log(`✅ Deleted ${deletedRegs[1]} registrations`);

    // Verify cleanup
    const remainingRegs = await dataSource.query(`
      SELECT COUNT(*) as count FROM registrations
    `);
    const remainingEmails = await dataSource.query(`
      SELECT COUNT(*) as count FROM email_logs
    `);

    console.log('\n📊 Final Database State:');
    console.log('─'.repeat(80));
    console.log(`Registrations: ${remainingRegs[0].count}`);
    console.log(`Email Logs: ${remainingEmails[0].count}`);
    console.log('');

    if (remainingRegs[0].count === 0 && remainingEmails[0].count === 0) {
      console.log('✅ Database successfully cleaned! All test data removed.\n');
    } else {
      console.log('⚠️  Some records may remain - please check manually\n');
    }

  } catch (error) {
    console.error('❌ Error cleaning database:', error.message);
    console.error(error);
  }

  await app.close();
}

cleanTestData();
