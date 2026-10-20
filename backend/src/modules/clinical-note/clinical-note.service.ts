import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import { CreateClinicalNoteDto } from './dto/create-clinical-note.dto';
import { ListClinicalNotesDto } from './dto/list-clinical-notes.dto';
import { JwtPayload } from '../../common/types/jwt-payload.interface';

@Injectable()
export class ClinicalNoteService {
  constructor(private readonly prisma: PrismaService) {}

  async create(mrn: string, dto: CreateClinicalNoteDto, user: JwtPayload) {
    const tenantId = user.tenantId;

    const patient = await this.prisma.bcpActivePatient.findFirst({
      where: { tenantId, mrn },
      select: { mrn: true },
    });

    if (!patient) {
      throw new NotFoundException(`Patient with MRN ${mrn} not found`);
    }

    const bcpUser = await this.prisma.bcpUser.findFirst({
      where: { tenantId, username: user.username },
      select: { fullName: true },
    });

    const note = await this.prisma.bcpClinicalNote.create({
      data: {
        tenantId,
        mrn,
        encounterId: dto.encounterId || null,
        visitNumber: dto.visitNumber || null,
        noteType: dto.noteType,
        content: dto.content,
        authorUsername: user.username,
        authorFullName: bcpUser?.fullName || null,
        authorRole: user.roles[0] || 'UNKNOWN',
        source: 'BCP',
        recordedAt: new Date(),
      },
    });

    return {
      id: Number(note.id),
      tenantId: note.tenantId,
      mrn: note.mrn,
      encounterId: note.encounterId,
      visitNumber: note.visitNumber,
      noteType: note.noteType,
      content: note.content,
      authorUsername: note.authorUsername,
      authorFullName: note.authorFullName,
      authorRole: note.authorRole,
      source: note.source,
      recordedAt: note.recordedAt,
      createdAt: note.createdAt,
    };
  }

  async listLatestPerPatient(dto: ListClinicalNotesDto, tenantId: string) {
    const noteTypeFilter = dto.noteType
      ? Prisma.sql`AND cn."note_type" = ${dto.noteType}::"bcp_note_type_enum"`
      : Prisma.empty;

    const sourceFilter = dto.source ? Prisma.sql`AND cn."source" = ${dto.source}` : Prisma.empty;

    const searchTerm = dto.q?.trim();
    const searchFilter = searchTerm
      ? Prisma.sql`AND (
          cn.mrn ILIKE ${'%' + searchTerm + '%'}
          OR p.patient_name ILIKE ${'%' + searchTerm + '%'}
        )`
      : Prisma.empty;

    const page = dto.page || 1;
    const limit = dto.limit || 50;
    const offset = (page - 1) * limit;

    const latestNotes = await this.prisma.$queryRaw<any[]>`
      SELECT DISTINCT ON (cn.mrn)
        cn.id, cn.tenant_id, cn.mrn, cn.encounter_id, cn.visit_number,
        cn.note_type, cn.content, cn.author_username, cn.author_full_name,
        cn.author_role, cn.source, cn.recorded_at, cn.created_at,
        p.patient_name, p.age, p.gender, p.ward_name, p.bed_number,
        (SELECT COUNT(*)::int FROM bcp_clinical_note c2 WHERE c2.tenant_id = cn.tenant_id AND c2.mrn = cn.mrn) AS total_notes
      FROM bcp_clinical_note cn
      LEFT JOIN LATERAL (
        SELECT ba.patient_name, ba.age, ba.gender, ba.ward_name, ba.bed_number
        FROM bcp_active_patient ba
        WHERE ba.tenant_id = cn.tenant_id AND ba.mrn = cn.mrn
        LIMIT 1
      ) p ON true
      WHERE cn.tenant_id = ${tenantId} ${noteTypeFilter} ${sourceFilter} ${searchFilter}
      ORDER BY cn.mrn, cn.recorded_at DESC
    `;

    const sorted = latestNotes.sort(
      (a, b) => new Date(b.recorded_at).getTime() - new Date(a.recorded_at).getTime(),
    );

    const total = sorted.length;
    const paged = sorted.slice(offset, offset + limit);

    return {
      data: paged.map((n: any) => ({
        id: Number(n.id),
        mrn: n.mrn,
        patientName: n.patient_name || null,
        age: n.age || null,
        gender: n.gender || null,
        wardName: n.ward_name || null,
        bedNumber: n.bed_number || null,
        encounterId: n.encounter_id,
        visitNumber: n.visit_number,
        noteType: n.note_type,
        content: n.content,
        authorUsername: n.author_username,
        authorFullName: n.author_full_name,
        authorRole: n.author_role,
        source: n.source,
        recordedAt: n.recorded_at,
        createdAt: n.created_at,
        totalNotes: n.total_notes,
      })),
      meta: { page, limit, total },
    };
  }

  async listByMrn(mrn: string, dto: ListClinicalNotesDto, tenantId: string) {
    const where: Prisma.BcpClinicalNoteWhereInput = { tenantId, mrn };

    if (dto.noteType) {
      where.noteType = dto.noteType;
    }

    if (dto.source) {
      where.source = dto.source;
    }

    const page = dto.page || 1;
    const limit = dto.limit || 50;
    const skip = (page - 1) * limit;

    const [notes, total] = await Promise.all([
      this.prisma.bcpClinicalNote.findMany({
        where,
        orderBy: { recordedAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.bcpClinicalNote.count({ where }),
    ]);

    return {
      data: notes.map((n) => ({
        id: Number(n.id),
        mrn: n.mrn,
        encounterId: n.encounterId,
        visitNumber: n.visitNumber,
        noteType: n.noteType,
        content: n.content,
        authorUsername: n.authorUsername,
        authorFullName: n.authorFullName,
        authorRole: n.authorRole,
        source: n.source,
        recordedAt: n.recordedAt,
        createdAt: n.createdAt,
      })),
      meta: { page, limit, total },
    };
  }
}
