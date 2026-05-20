import { IsString, IsNotEmpty, IsEnum, IsOptional, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { BcpNoteType } from '@prisma/client';

export class CreateClinicalNoteDto {
  @ApiProperty({ enum: BcpNoteType })
  @IsEnum(BcpNoteType)
  @IsNotEmpty()
  noteType: BcpNoteType;

  @ApiProperty({ description: 'Note content (max 5000 characters)' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(5000)
  content: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  encounterId?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  visitNumber?: string;
}
