import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import { SearchPatientDto } from './dto/search-patient.dto';
import { CreateTempPatientDto } from './dto/create-temp-patient.dto';
import { UpdateTempPatientDto } from './dto/update-temp-patient.dto';

const BCP_LOCAL_SOURCE = 'BCP_LOCAL';
const MAX_MRN_RETRIES = 3;

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
          sourceSystem: true,
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
        sourceSystem: p.sourceSystem,
      })),
      meta: { page, limit, total },
    };
  }

  private async generateTempMrn(tenantId: string): Promise<string> {
    const today = new Date();
    const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '');
    const prefix = `BCP-${dateStr}-`;

    const count = await this.prisma.bcpActivePatient.count({
      where: {
        tenantId,
        sourceSystem: BCP_LOCAL_SOURCE,
        mrn: { startsWith: prefix },
      },
    });

    const seq = String(count + 1).padStart(3, '0');
    return `${prefix}${seq}`;
  }

  async createTempPatient(dto: CreateTempPatientDto, tenantId: string) {
    const now = new Date();
    let lastError: any;

    for (let attempt = 0; attempt < MAX_MRN_RETRIES; attempt++) {
      const mrn = await this.generateTempMrn(tenantId);
      try {
        const patient = await this.prisma.bcpActivePatient.create({
          data: {
            tenantId,
            sourceSystem: BCP_LOCAL_SOURCE,
            mrn,
            visitNumber: 'BCP-1',
            patientName: dto.patientName,
            gender: dto.gender || null,
            dateOfBirth: dto.dateOfBirth ? new Date(dto.dateOfBirth) : null,
            age: dto.age || null,
            mobileNumber: dto.mobileNumber || null,
            careSetting: dto.careSetting as any,
            wardName: dto.wardName || null,
            bedNumber: dto.bedNumber || null,
            consultantName: dto.consultantName || null,
            businessDate: now,
            isActive: true,
            activeFrom: now,
            lastSyncedAt: now,
          },
        });

        return {
          id: Number(patient.id),
          mrn: patient.mrn,
          patientName: patient.patientName,
          age: patient.age,
          gender: patient.gender,
          careSetting: patient.careSetting,
          wardName: patient.wardName,
          bedNumber: patient.bedNumber,
          consultantName: patient.consultantName,
          sourceSystem: patient.sourceSystem,
        };
      } catch (error: any) {
        if (error.code === 'P2002') {
          lastError = error;
          continue;
        }
        throw error;
      }
    }

    throw lastError;
  }

  async updateTempPatient(mrn: string, dto: UpdateTempPatientDto, tenantId: string) {
    const patient = await this.prisma.bcpActivePatient.findFirst({
      where: { tenantId, mrn, sourceSystem: BCP_LOCAL_SOURCE },
    });

    if (!patient) {
      throw new NotFoundException(`Temporary patient with MRN ${mrn} not found`);
    }

    const updated = await this.prisma.bcpActivePatient.update({
      where: { id: patient.id },
      data: {
        ...(dto.patientName !== undefined && { patientName: dto.patientName }),
        ...(dto.gender !== undefined && { gender: dto.gender }),
        ...(dto.dateOfBirth !== undefined && { dateOfBirth: new Date(dto.dateOfBirth) }),
        ...(dto.age !== undefined && { age: dto.age }),
        ...(dto.mobileNumber !== undefined && { mobileNumber: dto.mobileNumber }),
        ...(dto.careSetting !== undefined && { careSetting: dto.careSetting as any }),
        ...(dto.wardName !== undefined && { wardName: dto.wardName }),
        ...(dto.bedNumber !== undefined && { bedNumber: dto.bedNumber }),
        ...(dto.consultantName !== undefined && { consultantName: dto.consultantName }),
      },
    });

    return {
      id: Number(updated.id),
      mrn: updated.mrn,
      patientName: updated.patientName,
      age: updated.age,
      gender: updated.gender,
      careSetting: updated.careSetting,
      wardName: updated.wardName,
      bedNumber: updated.bedNumber,
      consultantName: updated.consultantName,
      sourceSystem: updated.sourceSystem,
    };
  }
}
