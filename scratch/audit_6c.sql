-- Phase 6C Audit - Database state check
SELECT COUNT(*) AS total_biometric_records FROM biometric_data;

SELECT id, "childId", type, "faceModelVersion", "isActive", 
       LEFT("faceEncodingJson", 80) AS encoding_preview, "createdAt" 
FROM biometric_data 
ORDER BY "createdAt" DESC 
LIMIT 10;

-- Check biometric records per child (duplicate check)
SELECT "childId", COUNT(*) AS record_count, type
FROM biometric_data
GROUP BY "childId", type
ORDER BY record_count DESC;

-- Check children table
SELECT COUNT(*) AS total_children FROM children WHERE "deletedAt" IS NULL;