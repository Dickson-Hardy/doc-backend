import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from '../src/app.module';
import { VercelRequest, VercelResponse } from '@vercel/node';

let app: any;

async function createApp() {
  if (!app) {
    app = await NestFactory.create(AppModule);
    
    // Parse CORS origins from environment variable
    const corsOrigins = process.env.CORS_ORIGINS 
      ? process.env.CORS_ORIGINS.split(',').map(origin => origin.trim())
      : ['http://localhost:5173', 'http://localhost:8080'];

    app.enableCors({
      origin: corsOrigins,
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
    await app.init();
  }
  return app;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const app = await createApp();
    const httpAdapter = app.getHttpAdapter();
    const instance = httpAdapter.getInstance();
    
    // Set CORS headers manually for preflight requests
    if (req.method === 'OPTIONS') {
      const corsOrigins = process.env.CORS_ORIGINS 
        ? process.env.CORS_ORIGINS.split(',').map(origin => origin.trim())
        : ['http://localhost:5173', 'http://localhost:8080'];
      
      const origin = req.headers.origin;
      if (origin && corsOrigins.includes(origin)) {
        res.setHeader('Access-Control-Allow-Origin', origin);
      }
      res.setHeader('Access-Control-Allow-Credentials', 'true');
      res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,PATCH,OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization,X-Requested-With,Accept,Origin');
      res.status(200).end();
      return;
    }
    
    // Handle the request through Express
    instance(req, res);
  } catch (error) {
    console.error('Handler error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}