import { Controller, Get, Post, Patch, Query, Body, Param, Req } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { Roles } from '../../common/decorators/roles.decorator';
import { PatientService } from './patient.service';
import { SearchPatientDto } from './dto/search-patient.dto';
import { CreateTempPatientDto } from './dto/create-temp-patient.dto';
import { UpdateTempPatientDto } from './dto/update-temp-patient.dto';

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

  @Post('register-temp')
  async createTempPatient(@Body() dto: CreateTempPatientDto, @Req() req: any) {
    const data = await this.patientService.createTempPatient(dto, req.user.tenantId);
    return { data };
  }

  @Patch(':mrn/demographics')
  async updateTempPatient(
    @Param('mrn') mrn: string,
    @Body() dto: UpdateTempPatientDto,
    @Req() req: any,
  ) {
    const data = await this.patientService.updateTempPatient(mrn, dto, req.user.tenantId);
    return { data };
  }
}
