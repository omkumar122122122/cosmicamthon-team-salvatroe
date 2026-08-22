-- Check all children records in the database
SELECT 
  id,
  "childCode",
  "firstName",
  "lastName",
  "orphanageId",
  photo,
  "dateOfBirth",
  "approximateAge",
  "gender",
  "healthStatus",
  "currentStatus",
  "isAdoptable",
  "createdAt",
  "updatedAt",
  "deletedAt"
FROM children
ORDER BY "createdAt" DESC;