import { Module } from '@nestjs/common';
import { InvestigationResultController } from './investigation-result.controller';
import { InvestigationResultService } from './investigation-result.service';

@Module({
  controllers: [InvestigationResultController],
  providers: [InvestigationResultService],
})
export class InvestigationResultModule {}
