import { Controller, Get } from '@nestjs/common';
import { MonitoringService } from './monitoring.service';
import { Public } from '../auth/decorators/public.decorator';

@Controller('monitoring')
export class MonitoringController {
  constructor(private readonly monitoringService: MonitoringService) {}

  @Public()
  @Get('health')
  async healthCheck() {
    return this.monitoringService.getHealthStatus();
  }

  @Get('stats')
  async getStats() {
    return this.monitoringService.getSystemStats();
  }
}
