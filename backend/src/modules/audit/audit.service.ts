import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import { AuditQueryDto, CreateAuditDto } from './dto/audit-query.dto';

@Injectable()
export class AuditService {
  constructor(private readonly prisma: PrismaService) {}

  async query(dto: AuditQueryDto, tenantId: string) {
    const where: Prisma.BcpAuditLogWhereInput = { tenantId };

    if (dto.eventType) {
      where.eventType = dto.eventType as any;
    }
    if (dto.username) {
      where.username = { contains: dto.username, mode: 'insensitive' };
    }
    if (dto.mrn) {
      where.mrn = dto.mrn;
    }
    if (dto.dateFrom || dto.dateTo) {
      where.eventTimestamp = {};
      if (dto.dateFrom) where.eventTimestamp.gte = new Date(dto.dateFrom);
      if (dto.dateTo) where.eventTimestamp.lte = new Date(dto.dateTo);
    }

    const page = dto.page || 1;
    const limit = dto.limit || 50;
    const skip = (page - 1) * limit;

    const [entries, total] = await Promise.all([
      this.prisma.bcpAuditLog.findMany({
        where,
        orderBy: { eventTimestamp: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.bcpAuditLog.count({ where }),
    ]);

    return {
      data: entries.map((e) => ({
        id: Number(e.id),
        eventType: e.eventType,
        username: e.username,
        userRole: e.userRole,
        ipAddress: e.ipAddress,
        mrn: e.mrn,
        encounterId: e.encounterId,
        eventTimestamp: e.eventTimestamp,
        additionalData: e.additionalData,
      })),
      meta: { page, limit, total },
    };
  }

  async create(dto: CreateAuditDto, tenantId: string) {
    const entry = await this.prisma.bcpAuditLog.create({
      data: {
        tenantId,
        eventType: dto.eventType as any,
        username: dto.username,
        mrn: dto.mrn,
        additionalData: dto.additionalData,
      },
    });
    return { id: Number(entry.id), eventType: entry.eventType };
  }
}
