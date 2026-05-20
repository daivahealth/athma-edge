import { Controller, Get, Post, Param, Query, Body, Req } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { Roles } from '../../common/decorators/roles.decorator';
import { ClinicalNoteService } from './clinical-note.service';
import { CreateClinicalNoteDto } from './dto/create-clinical-note.dto';
import { ListClinicalNotesDto } from './dto/list-clinical-notes.dto';

@ApiTags('Clinical Notes')
@ApiBearerAuth()
@Roles('DOCTOR', 'NURSE', 'ADMIN')
@Controller('bcp/patients')
export class ClinicalNoteController {
  constructor(private readonly clinicalNoteService: ClinicalNoteService) {}

  @Post(':mrn/notes')
  async create(
    @Param('mrn') mrn: string,
    @Body() dto: CreateClinicalNoteDto,
    @Req() req: any,
  ) {
    return { data: await this.clinicalNoteService.create(mrn, dto, req.user) };
  }

  @Get(':mrn/notes')
  async list(
    @Param('mrn') mrn: string,
    @Query() dto: ListClinicalNotesDto,
    @Req() req: any,
  ) {
    return await this.clinicalNoteService.listByMrn(mrn, dto, req.user.tenantId);
  }
}
