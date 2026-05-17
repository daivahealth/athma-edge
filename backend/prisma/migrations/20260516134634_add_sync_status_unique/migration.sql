/*
  Warnings:

  - A unique constraint covering the columns `[tenant_id,sync_component]` on the table `bcp_sync_status` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "bcp_sync_status_tenant_id_sync_component_key" ON "bcp_sync_status"("tenant_id", "sync_component");
