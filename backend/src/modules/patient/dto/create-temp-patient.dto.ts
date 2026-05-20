import { IsString, IsNotEmpty, IsOptional, IsIn, MaxLength, IsDateString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateTempPatientDto {
  @ApiProperty({ description: 'Patient full name' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  patientName: string;

  @ApiPropertyOptional({ enum: ['Male', 'Female', 'Other'] })
  @IsString()
  @IsOptional()
  @IsIn(['Male', 'Female', 'Other'])
  gender?: string;

  @ApiPropertyOptional({ description: 'ISO date string' })
  @IsDateString()
  @IsOptional()
  dateOfBirth?: string;

  @ApiPropertyOptional({ description: 'e.g. 34Y, 2M' })
  @IsString()
  @IsOptional()
  @MaxLength(20)
  age?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  @MaxLength(30)
  mobileNumber?: string;

  @ApiProperty({ enum: ['INPATIENT', 'OUTPATIENT', 'DAYCARE', 'EMERGENCY'] })
  @IsString()
  @IsNotEmpty()
  @IsIn(['INPATIENT', 'OUTPATIENT', 'DAYCARE', 'EMERGENCY'])
  careSetting: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  @MaxLength(100)
  wardName?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  @MaxLength(50)
  bedNumber?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  @MaxLength(255)
  consultantName?: string;
}
