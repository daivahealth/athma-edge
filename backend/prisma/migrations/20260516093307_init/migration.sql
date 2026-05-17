-- CreateEnum
CREATE TYPE "care_setting_enum" AS ENUM ('INPATIENT', 'OUTPATIENT', 'DAYCARE', 'EMERGENCY');

-- CreateEnum
CREATE TYPE "document_type_enum" AS ENUM ('CLINICAL_SUMMARY', 'LAB_REPORT', 'RADIOLOGY_REPORT', 'MAR', 'NURSING_NOTE', 'DISCHARGE_SUMMARY', 'CONSENT', 'OTHER');

-- CreateEnum
CREATE TYPE "sync_component_enum" AS ENUM ('ACTIVE_PATIENT', 'CLINICAL_PROFILE', 'PDF_DOCUMENT');

-- CreateEnum
CREATE TYPE "sync_status_enum" AS ENUM ('SUCCESS', 'FAILED', 'PARTIAL', 'RUNNING');

-- CreateEnum
CREATE TYPE "event_type_enum" AS ENUM ('LOGIN_SUCCESS', 'LOGIN_FAILED', 'PATIENT_SEARCHED', 'PATIENT_VIEWED', 'PDF_VIEWED', 'LOGOUT');

-- CreateTable
CREATE TABLE "bcp_active_patient" (
    "id" BIGSERIAL NOT NULL,
    "tenant_id" VARCHAR(100) NOT NULL,
    "source_system" VARCHAR(100) NOT NULL,
    "patient_id" VARCHAR(100),
    "mrn" VARCHAR(50) NOT NULL,
    "uhid" VARCHAR(50),
    "encounter_id" VARCHAR(100),
    "visit_number" VARCHAR(50),
    "patient_name" VARCHAR(255) NOT NULL,
    "date_of_birth" DATE,
    "age" VARCHAR(20),
    "gender" VARCHAR(20),
    "mobile_number" VARCHAR(30),
    "care_setting" "care_setting_enum" NOT NULL,
    "encounter_status" VARCHAR(50),
    "appointment_status" VARCHAR(50),
    "business_date" DATE NOT NULL,
    "unit_name" VARCHAR(100),
    "ward_name" VARCHAR(100),
    "bed_number" VARCHAR(50),
    "consultant_id" VARCHAR(100),
    "consultant_name" VARCHAR(255),
    "admission_datetime" TIMESTAMP(6),
    "visit_start_datetime" TIMESTAMP(6),
    "discharge_datetime" TIMESTAMP(6),
    "is_mlc" BOOLEAN NOT NULL DEFAULT false,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "active_from" TIMESTAMP(6),
    "active_until" TIMESTAMP(6),
    "last_seen_in_source_at" TIMESTAMP(6),
    "last_synced_at" TIMESTAMP(6) NOT NULL,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "bcp_active_patient_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bcp_patient_clinical_profile" (
    "id" BIGSERIAL NOT NULL,
    "tenant_id" VARCHAR(100) NOT NULL,
    "source_system" VARCHAR(100) NOT NULL,
    "patient_id" VARCHAR(100),
    "mrn" VARCHAR(50) NOT NULL,
    "uhid" VARCHAR(50),
    "encounter_id" VARCHAR(100),
    "visit_number" VARCHAR(50),
    "allergies" TEXT,
    "blood_group" VARCHAR(20),
    "primary_diagnosis" TEXT,
    "high_risk_flags" TEXT,
    "latest_vitals" JSONB,
    "active_medications" JSONB,
    "pending_investigations" JSONB,
    "critical_results" TEXT,
    "handover_notes" TEXT,
    "last_clinical_update_at" TIMESTAMP(6),
    "last_synced_at" TIMESTAMP(6) NOT NULL,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "bcp_patient_clinical_profile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bcp_patient_pdf_document" (
    "id" BIGSERIAL NOT NULL,
    "tenant_id" VARCHAR(100) NOT NULL,
    "source_system" VARCHAR(100) NOT NULL,
    "patient_id" VARCHAR(100),
    "mrn" VARCHAR(50) NOT NULL,
    "uhid" VARCHAR(50),
    "encounter_id" VARCHAR(100),
    "visit_number" VARCHAR(50),
    "document_type" "document_type_enum" NOT NULL,
    "document_name" VARCHAR(255),
    "file_path" TEXT NOT NULL,
    "mime_type" VARCHAR(100) NOT NULL DEFAULT 'application/pdf',
    "document_datetime" TIMESTAMP(6),
    "file_size" BIGINT,
    "checksum" VARCHAR(255),
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "last_synced_at" TIMESTAMP(6) NOT NULL,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "bcp_patient_pdf_document_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bcp_sync_status" (
    "id" BIGSERIAL NOT NULL,
    "tenant_id" VARCHAR(100),
    "source_system" VARCHAR(100),
    "sync_component" "sync_component_enum" NOT NULL,
    "sync_status" "sync_status_enum" NOT NULL,
    "last_successful_sync_at" TIMESTAMP(6),
    "last_attempt_at" TIMESTAMP(6),
    "records_processed" BIGINT NOT NULL DEFAULT 0,
    "records_failed" BIGINT NOT NULL DEFAULT 0,
    "sync_cursor" VARCHAR(255),
    "error_message" TEXT,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "bcp_sync_status_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bcp_audit_log" (
    "id" BIGSERIAL NOT NULL,
    "tenant_id" VARCHAR(100) NOT NULL,
    "source_system" VARCHAR(100),
    "event_type" "event_type_enum" NOT NULL,
    "patient_id" VARCHAR(100),
    "mrn" VARCHAR(50),
    "encounter_id" VARCHAR(100),
    "username" VARCHAR(255),
    "user_role" VARCHAR(100),
    "device_id" VARCHAR(255),
    "ip_address" VARCHAR(100),
    "event_timestamp" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "additional_data" JSONB,

    CONSTRAINT "bcp_audit_log_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bcp_user" (
    "id" BIGSERIAL NOT NULL,
    "tenant_id" VARCHAR(100) NOT NULL,
    "username" VARCHAR(100) NOT NULL,
    "password_hash" TEXT NOT NULL,
    "full_name" VARCHAR(255),
    "email" VARCHAR(255),
    "mobile_number" VARCHAR(30),
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "last_login_at" TIMESTAMP(6),
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "bcp_user_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bcp_role" (
    "id" BIGSERIAL NOT NULL,
    "tenant_id" VARCHAR(100) NOT NULL,
    "role_code" VARCHAR(50) NOT NULL,
    "role_name" VARCHAR(100) NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "bcp_role_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bcp_user_role" (
    "id" BIGSERIAL NOT NULL,
    "tenant_id" VARCHAR(100) NOT NULL,
    "user_id" BIGINT NOT NULL,
    "role_id" BIGINT NOT NULL,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "bcp_user_role_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "idx_active_patient_mrn" ON "bcp_active_patient"("mrn");

-- CreateIndex
CREATE INDEX "idx_active_patient_uhid" ON "bcp_active_patient"("uhid");

-- CreateIndex
CREATE INDEX "idx_active_patient_name" ON "bcp_active_patient"("patient_name");

-- CreateIndex
CREATE INDEX "idx_active_patient_care_setting" ON "bcp_active_patient"("care_setting");

-- CreateIndex
CREATE INDEX "idx_active_patient_business_date" ON "bcp_active_patient"("business_date");

-- CreateIndex
CREATE INDEX "idx_active_patient_is_active" ON "bcp_active_patient"("is_active");

-- CreateIndex
CREATE INDEX "idx_active_patient_ward_bed" ON "bcp_active_patient"("ward_name", "bed_number");

-- CreateIndex
CREATE UNIQUE INDEX "bcp_active_patient_tenant_id_source_system_mrn_visit_number_key" ON "bcp_active_patient"("tenant_id", "source_system", "mrn", "visit_number");

-- CreateIndex
CREATE INDEX "idx_clinical_profile_mrn" ON "bcp_patient_clinical_profile"("mrn");

-- CreateIndex
CREATE INDEX "idx_clinical_profile_encounter_id" ON "bcp_patient_clinical_profile"("encounter_id");

-- CreateIndex
CREATE INDEX "idx_pdf_document_mrn" ON "bcp_patient_pdf_document"("mrn");

-- CreateIndex
CREATE INDEX "idx_pdf_document_type" ON "bcp_patient_pdf_document"("document_type");

-- CreateIndex
CREATE INDEX "idx_sync_status_component" ON "bcp_sync_status"("sync_component");

-- CreateIndex
CREATE INDEX "idx_audit_log_event_type" ON "bcp_audit_log"("event_type");

-- CreateIndex
CREATE INDEX "idx_audit_log_event_timestamp" ON "bcp_audit_log"("event_timestamp");

-- CreateIndex
CREATE INDEX "idx_user_tenant_username" ON "bcp_user"("tenant_id", "username");

-- CreateIndex
CREATE UNIQUE INDEX "bcp_user_tenant_id_username_key" ON "bcp_user"("tenant_id", "username");

-- CreateIndex
CREATE INDEX "idx_role_tenant_role_code" ON "bcp_role"("tenant_id", "role_code");

-- CreateIndex
CREATE UNIQUE INDEX "bcp_role_tenant_id_role_code_key" ON "bcp_role"("tenant_id", "role_code");

-- CreateIndex
CREATE UNIQUE INDEX "bcp_user_role_tenant_id_user_id_role_id_key" ON "bcp_user_role"("tenant_id", "user_id", "role_id");

-- AddForeignKey
ALTER TABLE "bcp_user_role" ADD CONSTRAINT "bcp_user_role_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "bcp_user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bcp_user_role" ADD CONSTRAINT "bcp_user_role_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "bcp_role"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
