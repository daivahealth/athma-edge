import { IsOptional, IsString, IsBoolean, IsDateString, IsInt, Min } from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class SearchPatientDto {
  @ApiPropertyOptional({ description: 'Text search on MRN, UHID, name, mobile' })
  @IsString()
  @IsOptional()
  q?: string;

  @ApiPropertyOptional({ enum: ['INPATIENT', 'OUTPATIENT', 'DAYCARE', 'EMERGENCY'] })
  @IsString()
  @IsOptional()
  careSetting?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  ward?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  consultant?: string;

  @ApiPropertyOptional({ description: 'YYYY-MM-DD format' })
  @IsDateString()
  @IsOptional()
  businessDate?: string;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  activeOnly?: boolean = true;

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
