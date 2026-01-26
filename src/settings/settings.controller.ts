import { Controller, Get, Put, Body, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { SettingsService } from './settings.service';
import { UpdatePaystackSettingsDto } from './dto/update-paystack-settings.dto';

@Controller('settings')
@UseGuards(JwtAuthGuard, RolesGuard)
export class SettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  @Get('paystack')
  @Roles('super_admin')
  async getPaystackSettings() {
    const publicKey = await this.settingsService.getPaystackPublicKey();
    const splitCode = await this.settingsService.getPaystackSplitCode();

    return {
      publicKey: publicKey || '',
      secretKey: '***ENCRYPTED***', // Never expose secret key
      splitCode: splitCode || '',
      hasSplitCode: !!splitCode,
    };
  }

  @Put('paystack')
  @Roles('super_admin')
  async updatePaystackSettings(@Body() dto: UpdatePaystackSettingsDto) {
    await this.settingsService.setPaystackKeys(
      dto.publicKey,
      dto.secretKey,
      dto.splitCode,
    );

    return {
      message: 'Paystack settings updated successfully',
      hasSplitCode: !!dto.splitCode,
    };
  }

  @Get('all')
  @Roles('super_admin')
  async getAllSettings() {
    return this.settingsService.getAllSettings(false);
  }
}
