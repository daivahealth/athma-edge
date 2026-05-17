import { Controller, Get, Req } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { Roles } from '../../common/decorators/roles.decorator';
import { SyncStatusService } from './sync-status.service';

@ApiTags('Sync Status')
@ApiBearerAuth()
@Roles('ADMIN')
@Controller('bcp/sync')
export class SyncStatusController {
  constructor(private readonly syncStatusService: SyncStatusService) {}

  @Get('status')
  async getStatus(@Req() req: any) {
    return { data: await this.syncStatusService.getStatus(req.user.tenantId) };
  }
}
