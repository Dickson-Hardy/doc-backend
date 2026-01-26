import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { DataSource } from 'typeorm';

async function viewRegistrations() {
  console.log('📊 Viewing Database Registrations...\n');
  
  const app = await NestFactory.createApplicationContext(AppModule);
  const dataSource = app.get(DataSource);

  try {
    // Get all registrations
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
        "paidAt",
        "createdAt"
      FROM registrations 
      ORDER BY "createdAt" DESC
    `);

    console.log('═'.repeat(80));
    console.log(`Total Registrations: ${registrations.length}`);
    console.log('═'.repeat(80));
    console.log('');

    if (registrations.length === 0) {
      console.log('✅ No registrations found - database is clean\n');
      await app.close();
      return;
    }

    // Display each registration
    registrations.forEach((reg: any, index: number) => {
      const statusEmoji = reg.paymentStatus === 'paid' ? '✅' : 
                         reg.paymentStatus === 'pending' ? '⏳' : '❌';
      
      console.log(`${statusEmoji} Registration #${index + 1}`);
      console.log('─'.repeat(80));
      console.log(`ID:           ${reg.id}`);
      console.log(`Name:         ${reg.firstName} ${reg.surname}`);
      console.log(`Email:        ${reg.email}`);
      console.log(`Category:     ${reg.category}`);
      console.log(`Status:       ${reg.paymentStatus.toUpperCase()}`);
      console.log(`Amount:       ₦${reg.totalAmount?.toLocaleString()}`);
      console.log(`Reference:    ${reg.paymentReference || 'N/A'}`);
      console.log(`Created:      ${new Date(reg.createdAt).toLocaleString()}`);
      if (reg.paidAt) {
        console.log(`Paid At:      ${new Date(reg.paidAt).toLocaleString()}`);
      }
      console.log('');
    });

    // Statistics
    console.log('═'.repeat(80));
    console.log('📈 STATISTICS');
    console.log('═'.repeat(80));
    console.log('');

    // Count by status
    const statusCounts = await dataSource.query(`
      SELECT 
        "paymentStatus",
        COUNT(*) as count,
        SUM("totalAmount") as total_amount
      FROM registrations
      GROUP BY "paymentStatus"
      ORDER BY count DESC
    `);

    console.log('Status Breakdown:');
    statusCounts.forEach((stat: any) => {
      const emoji = stat.paymentStatus === 'paid' ? '✅' : 
                   stat.paymentStatus === 'pending' ? '⏳' : '❌';
      console.log(`  ${emoji} ${stat.paymentStatus.padEnd(10)} : ${stat.count} registrations (₦${parseInt(stat.total_amount || 0).toLocaleString()})`);
    });
    console.log('');

    // Count by category
    const categoryCounts = await dataSource.query(`
      SELECT 
        category,
        COUNT(*) as count
      FROM registrations
      GROUP BY category
      ORDER BY count DESC
    `);

    console.log('Category Breakdown:');
    categoryCounts.forEach((cat: any) => {
      console.log(`  ${cat.category.padEnd(20)} : ${cat.count} registrations`);
    });
    console.log('');

    // Total revenue
    const revenue = await dataSource.query(`
      SELECT 
        SUM("totalAmount") as total_revenue
      FROM registrations
      WHERE "paymentStatus" = 'paid'
    `);

    console.log(`💰 Total Revenue (Paid): ₦${parseInt(revenue[0].total_revenue || 0).toLocaleString()}`);
    console.log('');

    // Email logs
    const emailStats = await dataSource.query(`
      SELECT 
        status,
        COUNT(*) as count
      FROM email_logs
      GROUP BY status
    `);

    console.log('📧 Email Logs:');
    if (emailStats.length === 0) {
      console.log('  No emails sent yet');
    } else {
      emailStats.forEach((stat: any) => {
        const emoji = stat.status === 'sent' ? '✅' : '❌';
        console.log(`  ${emoji} ${stat.status.padEnd(10)} : ${stat.count} emails`);
      });
    }
    console.log('');

    // Recent activity
    const recentActivity = await dataSource.query(`
      SELECT 
        "firstName",
        surname,
        email,
        "paymentStatus",
        "createdAt"
      FROM registrations
      ORDER BY "createdAt" DESC
      LIMIT 5
    `);

    console.log('🕐 Recent Activity (Last 5):');
    recentActivity.forEach((activity: any, index: number) => {
      const timeAgo = getTimeAgo(new Date(activity.createdAt));
      console.log(`  ${index + 1}. ${activity.firstName} ${activity.surname} - ${activity.paymentStatus} (${timeAgo})`);
    });
    console.log('');

  } catch (error) {
    console.error('❌ Error viewing database:', error.message);
    console.error(error);
  }

  await app.close();
}

function getTimeAgo(date: Date): string {
  const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
  
  if (seconds < 60) return `${seconds}s ago`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
}

viewRegistrations();
