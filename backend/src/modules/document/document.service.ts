import { ForbiddenException, Injectable, NotFoundException, StreamableFile } from '@nestjs/common';
import { createReadStream, existsSync, lstatSync, realpathSync } from 'fs';
import { isAbsolute, relative, resolve } from 'path';
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

    const resolvedPath = this.resolveDocumentPath(doc.filePath);
    if (!existsSync(resolvedPath)) {
      throw new NotFoundException('Document file not found on storage');
    }

    const fileStats = lstatSync(resolvedPath);
    if (fileStats.isSymbolicLink()) {
      throw new ForbiddenException('Invalid document path');
    }

    const stream = createReadStream(resolvedPath);
    return {
      stream: new StreamableFile(stream),
      filename: doc.documentName || `document-${documentId}.pdf`,
      mimeType: doc.mimeType,
    };
  }

  private resolveDocumentPath(filePath: string): string {
    const storageRoot = resolve(process.env.PDF_STORAGE_PATH || './local-bcp-storage/pdfs');
    const candidatePath = isAbsolute(filePath) ? resolve(filePath) : resolve(storageRoot, filePath);

    if (!existsSync(candidatePath)) {
      return candidatePath;
    }

    const resolvedRoot = existsSync(storageRoot) ? realpathSync(storageRoot) : storageRoot;
    const resolvedCandidate = realpathSync(candidatePath);
    const relativePath = relative(resolvedRoot, resolvedCandidate);

    if (relativePath.startsWith('..') || isAbsolute(relativePath)) {
      throw new ForbiddenException('Invalid document path');
    }

    return resolvedCandidate;
  }
}
