import { Controller, Get, Param, Req } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { Roles } from '../../common/decorators/roles.decorator';
import { ClinicalProfileService } from './clinical-profile.service';

@ApiTags('Clinical Profile')
@ApiBearerAuth()
@Roles('DOCTOR', 'NURSE', 'ADMIN')
@Controller('bcp/patients')
export class ClinicalProfileController {
  constructor(private readonly clinicalProfileService: ClinicalProfileService) {}

  @Get(':mrn/profile')
  async getProfile(@Param('mrn') mrn: string, @Req() req: any) {
    return { data: await this.clinicalProfileService.getProfile(mrn, req.user.tenantId) };
  }
}
