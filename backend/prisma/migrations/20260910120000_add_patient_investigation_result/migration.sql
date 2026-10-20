-- CreateEnum
CREATE TYPE "investigation_category_enum" AS ENUM ('LAB', 'RAD', 'OTHER');

-- CreateTable
CREATE TABLE "bcp_patient_investigation_result" (
    "id" BIGSERIAL NOT NULL,
    "tenant_id" VARCHAR(100) NOT NULL,
    "source_system" VARCHAR(100) NOT NULL,
    "patient_id" VARCHAR(100),
    "mrn" VARCHAR(50) NOT NULL,
    "uhid" VARCHAR(50),
    "encounter_id" VARCHAR(100),
    "visit_number" VARCHAR(50),
    "category" "investigation_category_enum" NOT NULL,
    "result_data" JSONB NOT NULL,
    "last_synced_at" TIMESTAMP(6) NOT NULL,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "bcp_patient_investigation_result_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "idx_investigation_result_mrn" ON "bcp_patient_investigation_result"("mrn");

-- CreateIndex
CREATE UNIQUE INDEX "uq_investigation_result_tenant_mrn_category" ON "bcp_patient_investigation_result"("tenant_id", "mrn", "category");
