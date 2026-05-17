import { Controller, Get, Query, Req } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { Roles } from '../../common/decorators/roles.decorator';
import { PatientService } from './patient.service';
import { SearchPatientDto } from './dto/search-patient.dto';

@ApiTags('Patients')
@ApiBearerAuth()
@Roles('DOCTOR', 'NURSE', 'ADMIN')
@Controller('bcp/patients')
export class PatientController {
  constructor(private readonly patientService: PatientService) {}

  @Get('search')
  async search(@Query() dto: SearchPatientDto, @Req() req: any) {
    return await this.patientService.search(dto, req.user.tenantId);
  }
}
