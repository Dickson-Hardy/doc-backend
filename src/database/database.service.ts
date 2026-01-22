import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { neon } from '@neondatabase/serverless';

@Injectable()
export class DatabaseService {
  private readonly sql;

  constructor(private configService: ConfigService) {
    const databaseUrl = this.configService.get<string>('DATABASE_URL');
    if (!databaseUrl) {
      throw new Error('DATABASE_URL is not defined in environment variables');
    }
    this.sql = neon(databaseUrl);
  }

  /**
   * Execute a SQL query using Neon serverless driver
   * @param query SQL query template
   * @param params Query parameters
   */
  async query(query: string, params?: any[]) {
    return this.sql(query, params);
  }

  /**
   * Get the raw SQL function for tagged template literals
   */
  getSql() {
    return this.sql;
  }
}
