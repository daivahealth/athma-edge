import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import type { CorsOptions } from '@nestjs/common/interfaces/external/cors-options.interface';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import express from 'express';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
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
      // nginx used to set DENY; helmet defaults to SAMEORIGIN. Keep the
      // stricter value now that the application is the only thing setting it.
      frameguard: { action: 'deny' },
      referrerPolicy: { policy: 'no-referrer' },
    }),
  );
  // Also previously set by nginx, and not something helmet does by default.
  app.use((_req: express.Request, res: express.Response, next: express.NextFunction) => {
    res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
    next();
  });
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

  // Serve the built SPA. There is no nginx in the stack: a hospital that
  // wants TLS or its own routing puts a proxy in front of this service.
  //
  // Registered before app.listen(), so this middleware runs ahead of Nest's
  // router — the fallback therefore excludes /api/ explicitly rather than
  // relying on ordering.
  const spaRoot = process.env.SPA_ROOT || join(__dirname, '..', 'public');
  if (existsSync(join(spaRoot, 'index.html'))) {
    const httpAdapter = app.getHttpAdapter().getInstance();

    // Vite fingerprints these filenames, so they can be cached hard.
    httpAdapter.use(
      '/assets',
      express.static(join(spaRoot, 'assets'), {
        immutable: true,
        maxAge: '1y',
      }),
    );

    // Everything else shipped in the bundle: icons, favicon, and so on.
    httpAdapter.use(express.static(spaRoot, { index: false, maxAge: 0 }));

    // Any non-API GET is a client-side route and must receive index.html,
    // which is never cached — otherwise a deploy leaves browsers asking for
    // asset filenames that no longer exist.
    httpAdapter.get(/^\/(?!api\/).*/, (_req: express.Request, res: express.Response) => {
      res.setHeader('Cache-Control', 'no-store, must-revalidate');
      res.sendFile(join(spaRoot, 'index.html'));
    });

    logger.log(`Serving SPA from ${spaRoot}`);
  } else {
    logger.warn(`No SPA bundle at ${spaRoot} — serving the API only`);
  }

  const port = process.env.PORT || 3100;
  await app.listen(port);
  logger.log(`BCP API running on port ${port}`);
  if (docsEnabled) {
    logger.log(`Swagger docs at http://localhost:${port}/api/docs`);
  }
}

bootstrap();
