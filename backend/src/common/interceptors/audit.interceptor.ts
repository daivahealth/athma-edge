import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable, tap, catchError, throwError } from 'rxjs';
import { PrismaService } from '../../database/prisma.service';
import { Prisma, EventType } from '@prisma/client';

@Injectable()
export class AuditInterceptor implements NestInterceptor {
  private readonly logger = new Logger(AuditInterceptor.name);

  constructor(private readonly prisma: PrismaService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const { method, path, user, ip } = request;

    const eventType = this.resolveEventType(method, path);
    if (!eventType) return next.handle();

    const tenantId = user?.tenantId || process.env.DEFAULT_TENANT_ID || 'unknown';
    const mrn = request.params?.mrn || null;
    const documentId = request.params?.documentId || null;

    if (eventType === 'LOGIN_FAILED') {
      return next.handle().pipe(
        catchError((err) => {
          this.logAudit(tenantId, 'LOGIN_FAILED', request.body?.username, null, ip, mrn, {
            error: err.message,
          });
          return throwError(() => err);
        }),
      );
    }

    return next.handle().pipe(
      tap(() => {
        const additionalData: Record<string, any> = {};

        if (eventType === 'PATIENT_SEARCHED') {
          additionalData.query = request.query?.q || null;
          additionalData.careSetting = request.query?.careSetting || null;
        }
        if (eventType === 'PDF_VIEWED') {
          additionalData.documentId = documentId;
        }
        if (eventType === 'BCP_NOTE_CREATED') {
          additionalData.noteType = request.body?.noteType || null;
        }

        this.logAudit(
          tenantId,
          eventType,
          user?.username,
          user?.roles?.[0] || null,
          ip,
          mrn,
          Object.keys(additionalData).length > 0 ? additionalData : null,
        );
      }),
    );
  }

  private resolveEventType(method: string, path: string): EventType | null {
    if (method === 'POST' && path.includes('/auth/login')) return 'LOGIN_SUCCESS';
    if (method === 'POST' && path.includes('/auth/logout')) return 'LOGOUT';
    if (method === 'GET' && path.includes('/bcp/patients/search')) return 'PATIENT_SEARCHED';
    if (method === 'GET' && path.match(/\/bcp\/patients\/[^/]+\/(profile|investigation-results)/)) return 'PATIENT_VIEWED';
    if (method === 'GET' && path.match(/\/bcp\/documents\/[^/]+\/download/)) return 'PDF_VIEWED';
    if (method === 'POST' && path.includes('/bcp/patients/register-temp')) return 'TEMP_PATIENT_CREATED';
    if (method === 'PATCH' && path.match(/\/bcp\/patients\/[^/]+\/demographics/)) return 'TEMP_PATIENT_UPDATED';
    if (method === 'POST' && path.match(/\/bcp\/patients\/[^/]+\/notes/)) return 'BCP_NOTE_CREATED';
    return null;
  }

  private async logAudit(
    tenantId: string,
    eventType: EventType,
    username: string | null,
    userRole: string | null,
    ipAddress: string | null,
    mrn: string | null,
    additionalData: Record<string, any> | null,
  ) {
    try {
      await this.prisma.bcpAuditLog.create({
        data: {
          tenantId,
          eventType,
          username,
          userRole,
          ipAddress: ipAddress || null,
          mrn,
          additionalData: additionalData ?? Prisma.JsonNull,
        },
      });
    } catch (error) {
      this.logger.error(`Failed to write audit log: ${error}`);
    }
  }
}
