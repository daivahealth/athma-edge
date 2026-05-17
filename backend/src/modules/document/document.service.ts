import { Injectable, NotFoundException, StreamableFile } from '@nestjs/common';
import { createReadStream, existsSync } from 'fs';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class DocumentService {
  constructor(private readonly prisma: PrismaService) {}

  async listByMrn(mrn: string, tenantId: string, documentType?: string) {
    const where: any = { mrn, tenantId, isActive: true };
    if (documentType) {
      where.documentType = documentType;
    }

    const documents = await this.prisma.bcpPatientPdfDocument.findMany({
      where,
      orderBy: { documentDatetime: 'desc' },
    });

    return documents.map((d) => ({
      id: Number(d.id),
      documentType: d.documentType,
      documentName: d.documentName,
      mimeType: d.mimeType,
      documentDatetime: d.documentDatetime,
      fileSize: d.fileSize ? Number(d.fileSize) : null,
      isActive: d.isActive,
      lastSyncedAt: d.lastSyncedAt,
    }));
  }

  async download(documentId: number, tenantId: string) {
    const doc = await this.prisma.bcpPatientPdfDocument.findFirst({
      where: { id: BigInt(documentId), tenantId },
    });

    if (!doc) {
      throw new NotFoundException('Document not found');
    }

    if (!existsSync(doc.filePath)) {
      throw new NotFoundException('Document file not found on storage');
    }

    const stream = createReadStream(doc.filePath);
    return {
      stream: new StreamableFile(stream),
      filename: doc.documentName || `document-${documentId}.pdf`,
      mimeType: doc.mimeType,
    };
  }
}
