CREATE TABLE "adoption_documents" (
    "id" TEXT NOT NULL,
    "adoptionRecordId" TEXT NOT NULL,
    "documentType" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "originalName" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "fileSize" INTEGER NOT NULL,
    "storagePath" TEXT NOT NULL,
    "storageUrl" TEXT,
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "verifiedById" TEXT,
    "verifiedAt" TIMESTAMP(3),
    "uploadedById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "adoption_documents_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "adoption_documents_adoptionRecordId_documentType_key" ON "adoption_documents"("adoptionRecordId", "documentType");
CREATE INDEX "adoption_documents_adoptionRecordId_idx" ON "adoption_documents"("adoptionRecordId");
ALTER TABLE "adoption_documents" ADD CONSTRAINT "adoption_documents_adoptionRecordId_fkey" FOREIGN KEY ("adoptionRecordId") REFERENCES "adoption_records"("id") ON DELETE CASCADE ON UPDATE CASCADE;
