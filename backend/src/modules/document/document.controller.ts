import { Controller, Get, Param, Query, Req, Res, ParseIntPipe } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { Response } from 'express';
import { Roles } from '../../common/decorators/roles.decorator';
import { DocumentService } from './document.service';

@ApiTags('Documents')
@ApiBearerAuth()
@Roles('DOCTOR', 'NURSE', 'ADMIN')
@Controller('bcp')
export class DocumentController {
  constructor(private readonly documentService: DocumentService) {}

  @Get('patients/:mrn/documents')
  async listByMrn(
    @Param('mrn') mrn: string,
    @Query('documentType') documentType: string,
    @Req() req: any,
  ) {
    return {
      data: await this.documentService.listByMrn(mrn, req.user.tenantId, documentType),
    };
  }

  @Get('documents/:documentId/download')
  async download(
    @Param('documentId', ParseIntPipe) documentId: number,
    @Req() req: any,
    @Res({ passthrough: true }) res: Response,
  ) {
    const { stream, filename, mimeType } = await this.documentService.download(
      documentId,
      req.user.tenantId,
    );
    res.set({
      'Content-Type': mimeType,
      'Content-Disposition': `attachment; filename="${filename}"`,
    });
    return stream;
  }
}
