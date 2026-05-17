import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import { SearchPatientDto } from './dto/search-patient.dto';

@Injectable()
export class PatientService {
  constructor(private readonly prisma: PrismaService) {}

  async search(dto: SearchPatientDto, tenantId: string) {
    const where: Prisma.BcpActivePatientWhereInput = {
      tenantId,
    };

    if (dto.activeOnly !== false) {
      where.isActive = true;
    }

    if (dto.careSetting) {
      where.careSetting = dto.careSetting as any;
    }

    if (dto.ward) {
      where.wardName = dto.ward;
    }

    if (dto.consultant) {
      where.consultantName = { contains: dto.consultant, mode: 'insensitive' };
    }

    if (dto.businessDate) {
      where.businessDate = new Date(dto.businessDate);
    }

    if (dto.q) {
      where.OR = [
        { mrn: { contains: dto.q, mode: 'insensitive' } },
        { uhid: { contains: dto.q, mode: 'insensitive' } },
        { patientName: { contains: dto.q, mode: 'insensitive' } },
        { mobileNumber: { contains: dto.q, mode: 'insensitive' } },
      ];
    }

    const page = dto.page || 1;
    const limit = dto.limit || 50;
    const skip = (page - 1) * limit;

    const [patients, total] = await Promise.all([
      this.prisma.bcpActivePatient.findMany({
        where,
        select: {
          id: true,
          mrn: true,
          uhid: true,
          patientName: true,
          age: true,
          gender: true,
          careSetting: true,
          wardName: true,
          bedNumber: true,
          consultantName: true,
          lastSyncedAt: true,
        },
        orderBy: { patientName: 'asc' },
        skip,
        take: limit,
      }),
      this.prisma.bcpActivePatient.count({ where }),
    ]);

    return {
      data: patients.map((p) => ({
        id: Number(p.id),
        mrn: p.mrn,
        uhid: p.uhid,
        patientName: p.patientName,
        age: p.age,
        gender: p.gender,
        careSetting: p.careSetting,
        wardName: p.wardName,
        bedNumber: p.bedNumber,
        consultantName: p.consultantName,
        lastSyncedAt: p.lastSyncedAt,
      })),
      meta: { page, limit, total },
    };
  }
}
