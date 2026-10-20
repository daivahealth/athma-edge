import { IsOptional, IsEnum } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { InvestigationCategory } from '@prisma/client';

export class ListInvestigationResultsDto {
  @ApiPropertyOptional({ enum: InvestigationCategory, default: InvestigationCategory.LAB })
  @IsEnum(InvestigationCategory)
  @IsOptional()
  category?: InvestigationCategory;
}
