import { Module } from '@nestjs/common';
import { ClinicalSummaryController } from './clinical-summary.controller';
import { ClinicalSummaryService } from './clinical-summary.service';

@Module({
  controllers: [ClinicalSummaryController],
  providers: [ClinicalSummaryService],
})
export class ClinicalSummaryModule {}
