import { Injectable } from '@nestjs/common';
import { InvestigationCategory } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class InvestigationResultService {
  constructor(private readonly prisma: PrismaService) {}

  async findByMrnAndCategory(mrn: string, tenantId: string, category: InvestigationCategory) {
    const result = await this.prisma.bcpPatientInvestigationResult.findFirst({
      where: { mrn, tenantId, category },
    });

    // No record yet is a valid, non-error state (sync hasn't produced results for this category)
    if (!result) {
      return null;
    }

    return {
      category: result.category,
      mrn: result.mrn,
      resultData: result.resultData,
      lastSyncedAt: result.lastSyncedAt,
    };
  }
}
