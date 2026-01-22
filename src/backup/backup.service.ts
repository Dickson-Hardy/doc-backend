import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { ConfigService } from '@nestjs/config';
import { exec } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs';
import * as path from 'path';

const execAsync = promisify(exec);

@Injectable()
export class BackupService {
  private readonly logger = new Logger(BackupService.name);

  constructor(private configService: ConfigService) {}

  // Daily database backup at 2 AM
  @Cron(CronExpression.EVERY_DAY_AT_2AM)
  async performDailyBackup() {
    this.logger.log('🔄 Starting daily database backup...');
    try {
      await this.backupDatabase();
      this.logger.log('✅ Daily backup completed successfully');
    } catch (error) {
      this.logger.error('❌ Daily backup failed:', error);
    }
  }

  // Manual backup trigger
  async backupDatabase() {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupDir = path.join(process.cwd(), 'backups');
    
    // Create backups directory if it doesn't exist
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
    }

    const backupFile = path.join(backupDir, `backup-${timestamp}.sql`);

    // PostgreSQL backup command
    const dbHost = this.configService.get('DATABASE_HOST');
    const dbPort = this.configService.get('DATABASE_PORT');
    const dbUser = this.configService.get('DATABASE_USER');
    const dbName = this.configService.get('DATABASE_NAME');
    const dbPassword = this.configService.get('DATABASE_PASSWORD');

    // Set password environment variable
    process.env.PGPASSWORD = dbPassword;

    const command = `pg_dump -h ${dbHost} -p ${dbPort} -U ${dbUser} -d ${dbName} -F c -f ${backupFile}`;

    try {
      await execAsync(command);
      this.logger.log(`✅ Backup created: ${backupFile}`);
      
      // Clean up old backups (keep last 7 days)
      await this.cleanupOldBackups(backupDir, 7);
      
      return { success: true, file: backupFile };
    } catch (error) {
      this.logger.error('Backup failed:', error);
      throw error;
    } finally {
      delete process.env.PGPASSWORD;
    }
  }

  // Clean up backups older than specified days
  private async cleanupOldBackups(backupDir: string, daysToKeep: number) {
    try {
      const files = fs.readdirSync(backupDir);
      const now = Date.now();
      const maxAge = daysToKeep * 24 * 60 * 60 * 1000;

      for (const file of files) {
        const filePath = path.join(backupDir, file);
        const stats = fs.statSync(filePath);
        const age = now - stats.mtimeMs;

        if (age > maxAge) {
          fs.unlinkSync(filePath);
          this.logger.log(`🗑️ Deleted old backup: ${file}`);
        }
      }
    } catch (error) {
      this.logger.error('Failed to cleanup old backups:', error);
    }
  }

  // Export data to JSON for additional backup
  async exportDataToJSON() {
    // This would export critical data to JSON format
    // Useful for data migration or additional backup
    this.logger.log('📦 Exporting data to JSON...');
    // Implementation depends on specific needs
  }
}
