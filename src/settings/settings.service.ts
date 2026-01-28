import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';
import { AppSettings } from './entities/app-settings.entity';

@Injectable()
export class SettingsService {
  private readonly encryptionKey: string;

  constructor(
    @InjectRepository(AppSettings)
    private settingsRepository: Repository<AppSettings>,
    private configService: ConfigService,
  ) {
    // Use JWT secret as encryption key (or create a separate one)
    this.encryptionKey = this.configService.get('JWT_SECRET') || 'default-encryption-key';
  }

  private encrypt(text: string): string {
    const iv = crypto.randomBytes(16);
    const key = crypto.scryptSync(this.encryptionKey, 'salt', 32);
    const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return iv.toString('hex') + ':' + encrypted;
  }

  private decrypt(text: string): string {
    const parts = text.split(':');
    const iv = Buffer.from(parts[0], 'hex');
    const encryptedText = parts[1];
    const key = crypto.scryptSync(this.encryptionKey, 'salt', 32);
    const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);
    let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  }

  async getSetting(key: string, defaultValue?: string): Promise<string | null> {
    const setting = await this.settingsRepository.findOne({ where: { key } });
    
    if (!setting) {
      return defaultValue || null;
    }

    if (setting.isEncrypted && setting.value) {
      try {
        return this.decrypt(setting.value);
      } catch (error) {
        console.error('Error decrypting setting:', error);
        return defaultValue || null;
      }
    }

    return setting.value || defaultValue || null;
  }

  async setSetting(
    key: string,
    value: string,
    description?: string,
    isEncrypted: boolean = false,
  ): Promise<AppSettings> {
    let setting = await this.settingsRepository.findOne({ where: { key } });

    const valueToStore = isEncrypted ? this.encrypt(value) : value;

    if (setting) {
      setting.value = valueToStore;
      setting.description = description || setting.description;
      setting.isEncrypted = isEncrypted;
    } else {
      setting = this.settingsRepository.create({
        key,
        value: valueToStore,
        description,
        isEncrypted,
      });
    }

    return this.settingsRepository.save(setting);
  }

  async getAllSettings(includeEncrypted: boolean = false): Promise<AppSettings[]> {
    const settings = await this.settingsRepository.find();
    
    if (!includeEncrypted) {
      return settings.map(setting => ({
        ...setting,
        value: setting.isEncrypted ? '***ENCRYPTED***' : setting.value,
      }));
    }

    return settings;
  }

  async deleteSetting(key: string): Promise<void> {
    await this.settingsRepository.delete({ key });
  }

  // Paystack specific methods
  async getPaystackPublicKey(): Promise<string> {
    const dbKey = await this.getSetting('paystack_public_key');
    return dbKey || this.configService.get('PAYSTACK_PUBLIC_KEY') || '';
  }

  async getPaystackSecretKey(): Promise<string> {
    const dbKey = await this.getSetting('paystack_secret_key');
    return dbKey || this.configService.get('PAYSTACK_SECRET_KEY') || '';
  }

  async getPaystackSplitCode(): Promise<string | null> {
    return this.getSetting('paystack_split_code');
  }

  async setPaystackKeys(
    publicKey: string,
    secretKey: string,
    splitCode?: string,
  ): Promise<void> {
    await this.setSetting(
      'paystack_public_key',
      publicKey,
      'Paystack Public Key',
      false,
    );
    
    await this.setSetting(
      'paystack_secret_key',
      secretKey,
      'Paystack Secret Key',
      true, // Encrypt secret key
    );

    if (splitCode) {
      await this.setSetting(
        'paystack_split_code',
        splitCode,
        'Paystack Split Code for revenue sharing',
        false,
      );
    }
  }

  async updatePaystackSplitCode(splitCode: string): Promise<void> {
    await this.setSetting(
      'paystack_split_code',
      splitCode,
      'Paystack Split Code for revenue sharing',
      false,
    );
  }
}
