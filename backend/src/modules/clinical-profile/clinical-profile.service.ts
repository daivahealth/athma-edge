import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class ClinicalProfileService {
  constructor(private readonly prisma: PrismaService) {}

  async getProfile(mrn: string, tenantId: string) {
    const patient = await this.prisma.bcpActivePatient.findFirst({
      where: { mrn, tenantId, isActive: true },
      orderBy: { lastSyncedAt: 'desc' },
    });

    if (!patient) {
      throw new NotFoundException(`Patient with MRN ${mrn} not found`);
    }

    const isTempPatient = patient.sourceSystem === 'BCP_LOCAL';

    const clinicalProfile = isTempPatient
      ? null
      : await this.prisma.bcpPatientClinicalProfile.findFirst({
          where: { mrn, tenantId },
          orderBy: { lastSyncedAt: 'desc' },
        });

    const documents = isTempPatient
      ? []
      : await this.prisma.bcpPatientPdfDocument.findMany({
          where: { mrn, tenantId, isActive: true },
          orderBy: { documentDatetime: 'desc' },
        });

    return {
      patient: {
        id: Number(patient.id),
        mrn: patient.mrn,
        uhid: patient.uhid,
        patientName: patient.patientName,
        dateOfBirth: patient.dateOfBirth,
        age: patient.age,
        gender: patient.gender,
        mobileNumber: patient.mobileNumber,
        careSetting: patient.careSetting,
        wardName: patient.wardName,
        bedNumber: patient.bedNumber,
        consultantName: patient.consultantName,
        admissionDatetime: patient.admissionDatetime,
        isMlc: patient.isMlc,
        lastSyncedAt: patient.lastSyncedAt,
        sourceSystem: patient.sourceSystem,
      },
      clinicalProfile: clinicalProfile
        ? {
            allergies: clinicalProfile.allergies,
            bloodGroup: clinicalProfile.bloodGroup,
            primaryDiagnosis: clinicalProfile.primaryDiagnosis,
            highRiskFlags: clinicalProfile.highRiskFlags,
            latestVitals: clinicalProfile.latestVitals,
            activeMedications: clinicalProfile.activeMedications,
            pendingInvestigations: clinicalProfile.pendingInvestigations,
            criticalResults: clinicalProfile.criticalResults,
            handoverNotes: clinicalProfile.handoverNotes,
            intakeOutputChart: clinicalProfile.intakeOutputChart,
            lastClinicalUpdateAt: clinicalProfile.lastClinicalUpdateAt,
            lastSyncedAt: clinicalProfile.lastSyncedAt,
          }
        : null,
      documents: documents.map((d) => ({
        id: Number(d.id),
        documentType: d.documentType,
        documentName: d.documentName,
        documentDatetime: d.documentDatetime,
        fileSize: d.fileSize ? Number(d.fileSize) : null,
        lastSyncedAt: d.lastSyncedAt,
      })),
    };
  }
}
