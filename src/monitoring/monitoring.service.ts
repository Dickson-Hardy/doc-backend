import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Registration } from '../registrations/entities/registration.entity';
import { EmailLog } from '../email/entities/email-log.entity';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class MonitoringService {
  private readonly logger = new Logger(MonitoringService.name);

  constructor(
    @InjectRepository(Registration)
    private registrationsRepository: Repository<Registration>,
    @InjectRepository(EmailLog)
    private emailLogRepository: Repository<EmailLog>,
  ) {}

  // Health check endpoint data
  async getHealthStatus() {
    try {
      // Check database connection
      await this.registrationsRepository.query('SELECT 1');
      
      // Get system stats
      const stats = await this.getSystemStats();
      
      return {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        database: 'connected',
        stats,
      };
    } catch (error) {
      this.logger.error('Health check failed:', error);
      return {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        error: error.message,
      };
    }
  }

  // Get system statistics
  async getSystemStats() {
    const [
      totalRegistrations,
      paidRegistrations,
      pendingRegistrations,
      emailsSent,
      emailsFailed,
    ] = await Promise.all([
      this.registrationsRepository.count(),
      this.registrationsRepository.count({ where: { paymentStatus: 'paid' } }),
      this.registrationsRepository.count({ where: { paymentStatus: 'pending' } }),
      this.emailLogRepository.count({ where: { status: 'sent' } }),
      this.emailLogRepository.count({ where: { status: 'failed' } }),
    ]);

    return {
      totalRegistrations,
      paidRegistrations,
      pendingRegistrations,
      emailsSent,
      emailsFailed,
      emailSuccessRate: emailsSent + emailsFailed > 0 
        ? ((emailsSent / (emailsSent + emailsFailed)) * 100).toFixed(2) + '%'
        : 'N/A',
    };
  }

  // Log system metrics every hour
  @Cron(CronExpression.EVERY_HOUR)
  async logSystemMetrics() {
    try {
      const stats = await this.getSystemStats();
      this.logger.log('System Metrics:', JSON.stringify(stats, null, 2));
      
      // Optionally save to file
      this.saveMetricsToFile(stats);
    } catch (error) {
      this.logger.error('Failed to log system metrics:', error);
    }
  }

  // Save metrics to file for historical tracking
  private saveMetricsToFile(stats: any) {
    try {
      const logsDir = path.join(process.cwd(), 'logs');
      if (!fs.existsSync(logsDir)) {
        fs.mkdirSync(logsDir, { recursive: true });
      }

      const date = new Date().toISOString().split('T')[0];
      const logFile = path.join(logsDir, `metrics-${date}.json`);
      
      const entry = {
        timestamp: new Date().toISOString(),
        ...stats,
      };

      let logs = [];
      if (fs.existsSync(logFile)) {
        logs = JSON.parse(fs.readFileSync(logFile, 'utf-8'));
      }
      
      logs.push(entry);
      fs.writeFileSync(logFile, JSON.stringify(logs, null, 2));
    } catch (error) {
      this.logger.error('Failed to save metrics to file:', error);
    }
  }

  // Check for failed emails and alert
  @Cron(CronExpression.EVERY_30_MINUTES)
  async checkFailedEmails() {
    try {
      const recentFailed = await this.emailLogRepository
        .createQueryBuilder('email')
        .where('email.status = :status', { status: 'failed' })
        .andWhere('email.sentAt > :since', { 
          since: new Date(Date.now() - 30 * 60 * 1000) 
        })
        .getCount();

      if (recentFailed > 5) {
        this.logger.warn(`⚠️ High email failure rate: ${recentFailed} failed in last 30 minutes`);
        // TODO: Send alert to admin (email, SMS, Slack, etc.)
      }
    } catch (error) {
      this.logger.error('Failed to check email failures:', error);
    }
  }

  // Check for abandoned registrations
  @Cron(CronExpression.EVERY_6_HOURS)
  async checkAbandonedRegistrations() {
    try {
      const abandoned = await this.registrationsRepository
        .createQueryBuilder('registration')
        .where('registration.paymentStatus = :status', { status: 'pending' })
        .andWhere('registration.createdAt < :since', {
          since: new Date(Date.now() - 24 * 60 * 60 * 1000),
        })
        .getCount();

      this.logger.log(`📊 Abandoned registrations (>24h): ${abandoned}`);
    } catch (error) {
      this.logger.error('Failed to check abandoned registrations:', error);
    }
  }
}
