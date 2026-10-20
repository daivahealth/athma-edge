import { Controller, Get, Param, Query, Req } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { InvestigationCategory } from '@prisma/client';
import { Roles } from '../../common/decorators/roles.decorator';
import { InvestigationResultService } from './investigation-result.service';
import { ListInvestigationResultsDto } from './dto/list-investigation-results.dto';

@ApiTags('Investigation Results')
@ApiBearerAuth()
@Roles('DOCTOR', 'NURSE', 'ADMIN')
@Controller('bcp')
export class InvestigationResultController {
  constructor(private readonly investigationResultService: InvestigationResultService) {}

  @Get('patients/:mrn/investigation-results')
  async getByMrn(
    @Param('mrn') mrn: string,
    @Query() query: ListInvestigationResultsDto,
    @Req() req: any,
  ) {
    return {
      data: await this.investigationResultService.findByMrnAndCategory(
        mrn,
        req.user.tenantId,
        query.category ?? InvestigationCategory.LAB,
      ),
    };
  }
}
