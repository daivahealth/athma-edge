import { Controller, Get, Query, Req } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { Roles } from '../../common/decorators/roles.decorator';
import { ClinicalNoteService } from './clinical-note.service';
import { ListClinicalNotesDto } from './dto/list-clinical-notes.dto';

@ApiTags('Clinical Notes')
@ApiBearerAuth()
@Roles('DOCTOR', 'NURSE', 'ADMIN')
@Controller('bcp/clinical-notes')
export class ClinicalNotesListController {
  constructor(private readonly clinicalNoteService: ClinicalNoteService) {}

  @Get()
  async listLatestPerPatient(@Query() dto: ListClinicalNotesDto, @Req() req: any) {
    return await this.clinicalNoteService.listLatestPerPatient(dto, req.user.tenantId);
  }
}
