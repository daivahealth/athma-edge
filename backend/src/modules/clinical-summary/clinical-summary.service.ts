import { BadGatewayException, BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { buildClinicalSummaryPdf, ClinicalSummaryJson } from './pdf/clinical-summary-pdf.generator';

@Injectable()
export class ClinicalSummaryService {
  private readonly logger = new Logger(ClinicalSummaryService.name);

  constructor(private readonly prisma: PrismaService) {}

  async generatePdf(mrn: string, tenantId: string): Promise<{ buffer: Buffer; filename: string }> {
    const record = await this.prisma.bcpPatientClinicalSummary.findFirst({
      where: { mrn, tenantId },
      orderBy: { businessDate: 'desc' },
    });

    if (!record) {
      throw new NotFoundException(`No clinical summary available for MRN ${mrn}`);
    }

    await this.verifyWithHis(mrn, record.encounterId);

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

  // Gates the print behind an n8n webhook that re-validates the encounter
  // against the HIS. The webhook body is { statusCode: "200" | "400" | ... },
  // which is separate from the HTTP response status of the call itself.
  private async verifyWithHis(mrn: string, encounterNumber: string | null): Promise<void> {
    const webhookUrl = process.env.N8N_CLINICAL_SUMMARY_WEBHOOK_URL?.trim();
    if (!webhookUrl) {
      this.logger.warn('N8N_CLINICAL_SUMMARY_WEBHOOK_URL is not configured; skipping HIS verification before print');
      return;
    }

    let url: URL;
    try {
      url = new URL(webhookUrl);
    } catch {
      this.logger.error(`N8N_CLINICAL_SUMMARY_WEBHOOK_URL is not a valid URL: ${webhookUrl}`);
      throw new BadGatewayException('Clinical summary print verification is misconfigured.');
    }
    url.searchParams.set('mrn', mrn);
    if (encounterNumber) {
      url.searchParams.set('encounterNumber', encounterNumber);
    }

    let response: Response;
    try {
      response = await fetch(url, { method: 'GET' });
    } catch (error) {
      this.logger.error(`Clinical summary verification webhook unreachable: ${error}`);
      throw new BadGatewayException('Unable to reach the HIS verification service. Please try again.');
    }

    let body: { statusCode?: string | number } = {};
    try {
      body = await response.json();
    } catch {
      // Non-JSON body falls through to the HTTP status check below.
    }

    const statusCode = String(body.statusCode ?? response.status);
    if (statusCode !== '200') {
      throw new BadRequestException('The HIS declined to authorize this clinical summary print.');
    }
  }
}

