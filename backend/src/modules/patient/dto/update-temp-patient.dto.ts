import { PartialType } from '@nestjs/swagger';
import { CreateTempPatientDto } from './create-temp-patient.dto';

export class UpdateTempPatientDto extends PartialType(CreateTempPatientDto) {}
