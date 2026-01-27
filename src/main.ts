import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // Parse CORS origins from environment variable
  const corsOrigins = process.env.CORS_ORIGINS 
    ? process.env.CORS_ORIGINS.split(',').map(origin => origin.trim())
    : ['http://localhost:5173', 'http://localhost:8080'];
  
  // In production, be strict with CORS
  const corsConfig = process.env.NODE_ENV === 'production' 
    ? {
        origin: corsOrigins,
        credentials: true,
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin'],
        preflightContinue: false,
        optionsSuccessStatus: 200
      }
    : {
        origin: corsOrigins,
        credentials: true,
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin'],
        preflightContinue: false,
        optionsSuccessStatus: 200
      };
  
  app.enableCors(corsConfig);
  
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    transform: true,
  }));
  
  app.setGlobalPrefix('api');
  
  await app.listen(3000);
  console.log('Application is running on: http://localhost:3000');
  console.log('CORS enabled for:', corsOrigins.join(', '));
}

bootstrap();
