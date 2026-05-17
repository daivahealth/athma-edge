import { Module } from '@nestjs/common';
import { SyncStatusController } from './sync-status.controller';
import { SyncStatusService } from './sync-status.service';

@Module({
  controllers: [SyncStatusController],
  providers: [SyncStatusService],
})
export class SyncStatusModule {}
