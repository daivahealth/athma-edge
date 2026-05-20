import { Module } from '@nestjs/common';
import { ClinicalNoteController } from './clinical-note.controller';
import { ClinicalNotesListController } from './clinical-notes-list.controller';
import { ClinicalNoteService } from './clinical-note.service';

@Module({
  controllers: [ClinicalNoteController, ClinicalNotesListController],
  providers: [ClinicalNoteService],
})
export class ClinicalNoteModule {}
