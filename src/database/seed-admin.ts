import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { AuthService } from '../auth/auth.service';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const authService = app.get(AuthService);

  try {
    // Create default admin user
    const admin = await authService.createAdminUser(
      'admin@cmda.org',
      'Admin@2026!',
      'System',
      'Administrator',
      'super_admin',
    );
    console.log('✅ Admin user created:', admin.email);

    // Create scanner user
    const scanner = await authService.createAdminUser(
      'scanner@cmda.org',
      'Scanner@2026!',
      'Scanner',
      'User',
      'scanner',
    );
    console.log('✅ Scanner user created:', scanner.email);

    console.log('\n📝 Login Credentials:');
    console.log('Admin: admin@cmda.org / Admin@2026!');
    console.log('Scanner: scanner@cmda.org / Scanner@2026!');
    console.log('\n⚠️  Please change these passwords after first login!');
  } catch (error) {
    console.error('Error creating admin users:', error.message);
  }

  await app.close();
}

bootstrap();
