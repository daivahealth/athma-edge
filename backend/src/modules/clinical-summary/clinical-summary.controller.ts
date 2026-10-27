import { Controller, Get, Param, Req, Res, StreamableFile } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { Response } from 'express';
import { Roles } from '../../common/decorators/roles.decorator';
import { ClinicalSummaryService } from './clinical-summary.service';

@ApiTags('Clinical Summary')
@ApiBearerAuth()
@Roles('DOCTOR', 'NURSE', 'ADMIN')
@Controller('bcp/patients')
export class ClinicalSummaryController {
  constructor(private readonly clinicalSummaryService: ClinicalSummaryService) {}

  @Get(':mrn/clinical-summary/pdf')
  async downloadPdf(
    @Param('mrn') mrn: string,
    @Req() req: any,
    @Res({ passthrough: true }) res: Response,
  ) {
    const { buffer, filename } = await this.clinicalSummaryService.generatePdf(mrn, req.user.tenantId);
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${filename}"`,
    });
    return new StreamableFile(buffer);
  }
}
