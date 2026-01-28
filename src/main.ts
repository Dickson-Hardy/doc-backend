import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import * as crypto from 'crypto';

// Make crypto globally available for @nestjs/schedule
if (!global.crypto) {
  (global as any).crypto = crypto;
}

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // Parse CORS origins from environment variable with fallback to production domains
  const corsOrigins = process.env.CORS_ORIGINS 
    ? process.env.CORS_ORIGINS.split(',').map(origin => origin.trim())
    : [
        'https://dnconference.cmdanigeria.net',
        'https://www.dnconference.cmdanigeria.net',
        'http://localhost:5173',
        'http://localhost:8080'
      ];
  
  console.log('Environment:', process.env.NODE_ENV);
  console.log('CORS_ORIGINS env var:', process.env.CORS_ORIGINS);
  console.log('Parsed CORS origins:', corsOrigins);
  
  // Enable CORS with dynamic origin checking
  app.enableCors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps, Postman, curl)
      if (!origin) {
        console.log('Request with no origin - allowing');
        return callback(null, true);
      }
      
      console.log('Request from origin:', origin);
      
      if (corsOrigins.includes(origin)) {
        console.log('Origin allowed:', origin);
        return callback(null, true);
      }
      
      console.log('Origin blocked:', origin);
      console.log('Allowed origins:', corsOrigins);
      return callback(new Error(`Origin ${origin} not allowed by CORS`), false);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin'],
    preflightContinue: false,
    optionsSuccessStatus: 200
  });
  
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    transform: true,
  }));
  
  app.setGlobalPrefix('api');
  
  // Use PORT from environment or default to 3000
  const port = process.env.PORT || 3000;
  await app.listen(port, '0.0.0.0');
  
  console.log(`Application is running on port: ${port}`);
  console.log('CORS enabled for:', corsOrigins.join(', '));
}

bootstrap();
