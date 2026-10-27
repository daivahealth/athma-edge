import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { buildClinicalSummaryPdf, ClinicalSummaryJson } from './pdf/clinical-summary-pdf.generator';

@Injectable()
export class ClinicalSummaryService {
  constructor(private readonly prisma: PrismaService) {}

  async generatePdf(mrn: string, tenantId: string): Promise<{ buffer: Buffer; filename: string }> {
    const record = await this.prisma.bcpPatientClinicalSummary.findFirst({
      where: { mrn, tenantId },
      orderBy: { businessDate: 'desc' },
    });

    if (!record) {
      throw new NotFoundException(`No clinical summary available for MRN ${mrn}`);
    }

    const buffer = await buildClinicalSummaryPdf({
      patient: {
        mrn: record.mrn,
        patientName: record.patientName,
        gender: record.gender,
        age: record.age,
        dateOfBirth: record.dateOfBirth ? record.dateOfBirth.toISOString() : null,
        admissionDatetime: record.admissionDatetime ? record.admissionDatetime.toISOString() : null,
        consultantName: record.consultantName,
        wardName: record.wardName,
        bedNumber: record.bedNumber,
        encounterId: record.encounterId,
        visitNumber: record.visitNumber,
        unitName: record.unitName,
      },
      clinicalSummary: (record.clinicalSummary as ClinicalSummaryJson | null) ?? {},
    });

    return {
      buffer,
      filename: `${record.mrn}-24h-clinical-summary.pdf`,
    };
  }
}
