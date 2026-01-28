import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { SettingsService } from '../settings/settings.service';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const settingsService = app.get(SettingsService);

  try {
    const splitCode = 'SPL_a7bvGXGPgy';
    
    console.log('🔧 Seeding Paystack split code...');
    
    await settingsService.updatePaystackSplitCode(splitCode);
    
    console.log('✅ Split code seeded successfully:', splitCode);
    console.log('\n📝 Split Code Details:');
    console.log('Code:', splitCode);
    console.log('Status: Active');
    console.log('\n⚠️  This split code will be used for all future payments.');
    console.log('💡 You can update it anytime from the Admin Settings page.');
  } catch (error) {
    console.error('❌ Error seeding split code:', error.message);
  }

  await app.close();
}

bootstrap();
