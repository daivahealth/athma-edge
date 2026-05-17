import { Controller, Get, Query, Req } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { Roles } from '../../common/decorators/roles.decorator';
import { AuditService } from './audit.service';
import { AuditQueryDto } from './dto/audit-query.dto';

@ApiTags('Audit')
@ApiBearerAuth()
@Roles('ADMIN')
@Controller('bcp/audit')
export class AuditController {
  constructor(private readonly auditService: AuditService) {}

  @Get()
  async query(@Query() dto: AuditQueryDto, @Req() req: any) {
    return await this.auditService.query(dto, req.user.tenantId);
  }
}
