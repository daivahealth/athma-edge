-- CreateEnum
CREATE TYPE "bcp_note_type_enum" AS ENUM ('ORDER', 'PROGRESS', 'ASSESSMENT', 'NURSING', 'HANDOVER', 'INCIDENT', 'COMMUNICATION', 'OTHER');

-- AlterEnum
ALTER TYPE "event_type_enum" ADD VALUE 'BCP_NOTE_CREATED';

-- CreateTable
CREATE TABLE "bcp_clinical_note" (
    "id" BIGSERIAL NOT NULL,
    "tenant_id" VARCHAR(100) NOT NULL,
    "mrn" VARCHAR(50) NOT NULL,
    "encounter_id" VARCHAR(100),
    "visit_number" VARCHAR(50),
    "note_type" "bcp_note_type_enum" NOT NULL,
    "content" TEXT NOT NULL,
    "author_username" VARCHAR(100) NOT NULL,
    "author_full_name" VARCHAR(255),
    "author_role" VARCHAR(50) NOT NULL,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "bcp_clinical_note_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "idx_clinical_note_tenant_mrn" ON "bcp_clinical_note"("tenant_id", "mrn");

-- CreateIndex
CREATE INDEX "idx_clinical_note_tenant_mrn_type" ON "bcp_clinical_note"("tenant_id", "mrn", "note_type");

-- CreateIndex
CREATE INDEX "idx_clinical_note_created_at" ON "bcp_clinical_note"("created_at");
