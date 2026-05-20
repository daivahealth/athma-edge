import { IsOptional, IsString, IsEnum, IsInt, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { BcpNoteType } from '@prisma/client';

export class ListClinicalNotesDto {
  @ApiPropertyOptional({ description: 'Search by patient name, MRN, or UHID' })
  @IsString()
  @IsOptional()
  q?: string;

  @ApiPropertyOptional({ enum: BcpNoteType })
  @IsEnum(BcpNoteType)
  @IsOptional()
  noteType?: BcpNoteType;

  @ApiPropertyOptional({ default: 1 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @IsOptional()
  page?: number = 1;

  @ApiPropertyOptional({ default: 50 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @IsOptional()
  limit?: number = 50;
}
