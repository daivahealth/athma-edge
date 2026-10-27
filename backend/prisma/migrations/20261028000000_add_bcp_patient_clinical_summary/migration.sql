-- CreateTable
CREATE TABLE "bcp_patient_clinical_summary" (
    "id" BIGSERIAL NOT NULL,
    "tenant_id" VARCHAR(100) NOT NULL,
    "source_system" VARCHAR(100) NOT NULL,
    "patient_id" VARCHAR(100),
    "mrn" VARCHAR(50) NOT NULL,
    "encounter_id" VARCHAR(100),
    "visit_number" VARCHAR(50),
    "patient_name" VARCHAR(255) NOT NULL,
    "date_of_birth" DATE,
    "age" VARCHAR(20),
    "gender" VARCHAR(20),
    "business_date" DATE NOT NULL,
    "unit_name" VARCHAR(100),
    "ward_name" VARCHAR(100),
    "bed_number" VARCHAR(50),
    "consultant_name" VARCHAR(255),
    "admission_datetime" TIMESTAMP(6),
    "visit_start_datetime" TIMESTAMP(6),
    "clinical_summary" JSONB,
    "document_type" "document_type_enum" NOT NULL,
    "document_name" VARCHAR(255),
    "file_path" TEXT NOT NULL,
    "mime_type" VARCHAR(100) NOT NULL DEFAULT 'application/pdf',
    "document_datetime" TIMESTAMP(6),
    "file_size" BIGINT,
    "checksum" VARCHAR(255),
    "last_seen_in_source_at" TIMESTAMP(6),
    "last_synced_at" TIMESTAMP(6) NOT NULL,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "bcp_patient_clinical_summary_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "idx_clinical_summary_mrn" ON "bcp_patient_clinical_summary"("mrn");

-- CreateIndex
CREATE INDEX "idx_clinical_summary_encounter_id" ON "bcp_patient_clinical_summary"("encounter_id");

-- CreateIndex
CREATE INDEX "idx_clinical_summary_document_type" ON "bcp_patient_clinical_summary"("document_type");

-- CreateIndex
CREATE INDEX "idx_clinical_summary_business_date" ON "bcp_patient_clinical_summary"("business_date");
