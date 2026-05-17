import { Module } from '@nestjs/common';
import { ClinicalProfileController } from './clinical-profile.controller';
import { ClinicalProfileService } from './clinical-profile.service';

@Module({
  controllers: [ClinicalProfileController],
  providers: [ClinicalProfileService],
})
export class ClinicalProfileModule {}
