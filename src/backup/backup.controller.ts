import { Controller, Post } from '@nestjs/common';
import { BackupService } from './backup.service';
import { Roles } from '../auth/decorators/roles.decorator';

@Controller('backup')
@Roles('super_admin')
export class BackupController {
  constructor(private readonly backupService: BackupService) {}

  @Post('create')
  async createBackup() {
    try {
      const result = await this.backupService.backupDatabase();
      return {
        message: 'Backup created successfully',
        ...result,
      };
    } catch (error) {
      return {
        message: 'Backup failed',
        error: error.message,
      };
    }
  }
}
