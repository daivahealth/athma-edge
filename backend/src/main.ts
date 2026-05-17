import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import type { CorsOptions } from '@nestjs/common/interfaces/external/cors-options.interface';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { AppModule } from './app.module';
import { GlobalExceptionFilter } from './common/filters/global-exception.filter';

function getAllowedOrigins(): string[] {
  return (process.env.FRONTEND_ORIGIN || 'http://localhost:3000,http://127.0.0.1:3000')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);
}

function assertSecureRuntimeConfig() {
  const jwtSecret = process.env.JWT_SECRET?.trim();
  if (!jwtSecret || jwtSecret.length < 32 || jwtSecret === 'change-me-in-production') {
    throw new Error('JWT_SECRET must be set to a strong, non-default value with at least 32 characters');
  }

  const tenantId = process.env.DEFAULT_TENANT_ID?.trim();
  if (!tenantId) {
    throw new Error('DEFAULT_TENANT_ID must be configured');
  }
}

async function bootstrap() {
  assertSecureRuntimeConfig();

  const app = await NestFactory.create(AppModule);
  const logger = new Logger('Bootstrap');
  const allowedOrigins = getAllowedOrigins();
  const docsEnabled =
    process.env.API_DOCS_ENABLED === 'true' ||
    (process.env.NODE_ENV !== 'production' && process.env.API_DOCS_ENABLED !== 'false');
  const corsOrigin: CorsOptions['origin'] = (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
      return;
    }

    callback(new Error('Origin not allowed by CORS'), false);
  };

  app.getHttpAdapter().getInstance().set('trust proxy', 1);
  app.setGlobalPrefix('api');
  app.use(cookieParser());
  app.use(
    helmet({
      contentSecurityPolicy: false,
      crossOriginEmbedderPolicy: false,
    }),
  );
  app.use(
    '/api/auth/login',
    rateLimit({
      windowMs: 60 * 1000,
      limit: 5,
      standardHeaders: true,
      legacyHeaders: false,
      message: { message: 'Too many login attempts. Please wait and try again.' },
    }),
  );
  app.enableCors({
    credentials: true,
    origin: corsOrigin,
    methods: ['GET', 'POST', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
    }),
  );

  app.useGlobalFilters(new GlobalExceptionFilter());

  if (docsEnabled) {
    const swaggerConfig = new DocumentBuilder()
      .setTitle('Athma Edge BCP API')
      .setDescription('Hospital Business Continuity Plan — local clinical data access')
      .setVersion('1.0')
      .addBearerAuth()
      .build();
    const document = SwaggerModule.createDocument(app, swaggerConfig);
    SwaggerModule.setup('api/docs', app, document);
  }

  const port = process.env.PORT || 3100;
  await app.listen(port);
  logger.log(`BCP API running on port ${port}`);
  if (docsEnabled) {
    logger.log(`Swagger docs at http://localhost:${port}/api/docs`);
  }
}

bootstrap();
