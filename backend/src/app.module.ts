import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { PrismaModule } from './database/prisma.module';
import { AuthModule } from './modules/auth/auth.module';
import { UserModule } from './modules/user/user.module';
import { PatientModule } from './modules/patient/patient.module';
import { ClinicalProfileModule } from './modules/clinical-profile/clinical-profile.module';
import { ClinicalSummaryModule } from './modules/clinical-summary/clinical-summary.module';
import { DocumentModule } from './modules/document/document.module';
import { SyncStatusModule } from './modules/sync-status/sync-status.module';
import { AuditModule } from './modules/audit/audit.module';
import { ClinicalNoteModule } from './modules/clinical-note/clinical-note.module';
import { HealthModule } from './modules/health/health.module';
import { JwtAuthGuard } from './common/guards/jwt-auth.guard';
import { RolesGuard } from './common/guards/roles.guard';
import { AuditInterceptor } from './common/interceptors/audit.interceptor';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    AuthModule,
    UserModule,
    PatientModule,
    ClinicalProfileModule,
    ClinicalSummaryModule,
    DocumentModule,
    SyncStatusModule,
    AuditModule,
    ClinicalNoteModule,
    HealthModule,
  ],
  providers: [
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
    { provide: APP_INTERCEPTOR, useClass: AuditInterceptor },
  ],
})
export class AppModule {}
