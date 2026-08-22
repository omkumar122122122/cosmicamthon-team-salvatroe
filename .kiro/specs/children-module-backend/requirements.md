# Requirements Document

## Introduction

The Children Module Backend API provides comprehensive RESTful services for managing child records in the Orphan Age Child Safety System. This specification defines the backend implementation required to support the existing React + Vite frontend's three primary pages: children list view, child profile detail view, and child registration form. The API enables role-based access control for Admin and Orphanage staff roles, integrates with AWS S3 for photo storage, implements enum mapping between frontend strings and Prisma schema types, and establishes data integrity through comprehensive validation rules.

## Glossary

- **System**: The Children Module Backend API (NestJS-based REST API)
- **Admin**: A user with the ADMIN role who has full access to all children records across all orphanages
- **Orphanage_Staff**: A user with the ORPHANAGE role who has access only to children records belonging to their assigned orphanage
- **Child_Record**: A database record in the Child table representing a registered child in the system
- **Child_Code**: A unique auto-generated identifier for each child following the format CHD-YYYY-NNNNNN
- **Frontend**: The React + Vite single-page application that consumes these API endpoints
- **S3_Storage**: Amazon Web Services S3 bucket service used for storing child photos
- **Computed_Field**: A calculated value derived from related database records (e.g., age from date of birth, attendance percentage from attendance records)
- **Enum_Mapper**: A bidirectional conversion utility that translates between frontend human-readable strings and Prisma SCREAMING_SNAKE_CASE enum values
- **Audit_Log**: A security record tracking all create and update operations on child records
- **Role_Filter**: Query-scoping mechanism that restricts orphanage staff to viewing only children from their assigned orphanage
- **Pagination_Token**: The page number and page size parameters used for list endpoint pagination
- **Search_Query**: A full-text search string matched against child ID, name, orphanage, and risk level
- **Risk_Level**: An enumerated classification of child safety status (Low, Medium, High) derived from AI risk scoring
- **Health_Status**: An enumerated classification of child medical condition (Stable, Observation, Needs Review)
- **Attendance_Percentage**: Computed metric calculated as (PRESENT count / total records) * 100
- **Dashboard_Statistics**: Summary counts for total children, high risk count, adopted count, and needs review count

## Requirements

### Requirement 1: Child Registration Endpoint

**User Story:** As an Admin or Orphanage Staff member, I want to register a new child with photo upload, so that the child's identity, admission details, health information, and photo are captured in the system.

#### Acceptance Criteria

1. WHEN a valid multipart/form-data request is received with all required fields, THE System SHALL create a Child_Record with auto-generated Child_Code in format CHD-YYYY-NNNNNN
2. WHEN the Child_Code is generated, THE System SHALL use the current year and a zero-padded six-digit sequential number
3. WHEN a photo file is uploaded, THE System SHALL validate the file type is image/jpeg or image/png
4. WHEN a photo file exceeds 5MB, THE System SHALL reject the request with error code 413 and message "Photo file size must not exceed 5MB"
5. WHEN a valid photo is uploaded, THE System SHALL store the file to S3_Storage at path pattern children/{childCode}/photo-{timestamp}.{ext}
6. WHEN the photo is stored to S3_Storage, THE System SHALL create a ChildDocument record with documentType PHOTO_ID, storageUrl set to S3 URL, and storagePath set to local reference
7. WHEN the name field contains a full name, THE System SHALL split the value into firstName (first word) and lastName (remaining words)
8. WHEN the gender field value is "Male", "Female", or "Other", THE System SHALL map the value to Prisma ChildGender enum (MALE, FEMALE, OTHER)
9. WHEN the bloodGroup field value is "A+", "A-", "B+", "B-", "AB+", "AB-", "O+", or "O-", THE System SHALL map the value to Prisma BloodGroup enum (A_POSITIVE, A_NEGATIVE, B_POSITIVE, B_NEGATIVE, AB_POSITIVE, AB_NEGATIVE, O_POSITIVE, O_NEGATIVE)
10. WHEN the risk field value is "Low", "Medium", or "High", THE System SHALL map the value to Prisma RiskLevel enum (LOW, MEDIUM, HIGH)
11. WHEN the admissionDate field contains a future date, THE System SHALL reject the request with error code 400 and message "Admission date cannot be in the future"
12. WHEN the orphanage field is provided, THE System SHALL verify the orphanage exists in the Orphanage table
13. WHEN a user with ORPHANAGE role submits the request, THE System SHALL automatically set the orphanage field to the user's assigned orphanageId
14. WHEN the medicalCondition field is provided, THE System SHALL create an initial MedicalHistory record linked to the Child_Record
15. WHEN a Child_Record is created, THE System SHALL create an initial AIRiskScore record with risk level matching the form input
16. WHEN a Child_Record is successfully created, THE System SHALL create an AuditLog entry with action "CHILD_CREATED"
17. WHEN a Child_Record is successfully created, THE System SHALL return HTTP status 201 with response body containing childId and childCode
18. WHEN required fields (name, age, gender, bloodGroup, admissionDate, foundLocation, risk, medicalCondition, identificationMarks, notes) are missing, THE System SHALL reject the request with error code 400 and detailed validation messages
19. WHEN the age field value is less than 0 or greater than 18, THE System SHALL reject the request with error code 400 and message "Age must be between 0 and 18"
20. WHEN the name field length is less than 2 or greater than 100 characters, THE System SHALL reject the request with error code 400 and message "Name must be between 2 and 100 characters"
21. WHEN the foundLocation field length is less than 5 or greater than 200 characters, THE System SHALL reject the request with error code 400 and message "Found location must be between 5 and 200 characters"
22. WHEN the medicalCondition field length is less than 5 or greater than 500 characters, THE System SHALL reject the request with error code 400 and message "Medical condition must be between 5 and 500 characters"
23. WHEN the identificationMarks field length is less than 5 or greater than 500 characters, THE System SHALL reject the request with error code 400 and message "Identification marks must be between 5 and 500 characters"
24. WHEN the notes field length is less than 10 or greater than 1000 characters, THE System SHALL reject the request with error code 400 and message "Notes must be between 10 and 1000 characters"

### Requirement 2: Child List Retrieval Endpoint

**User Story:** As an Admin or Orphanage Staff member, I want to retrieve a paginated list of children with search and filtering, so that I can view children records relevant to my role.

#### Acceptance Criteria

1. WHEN a GET request is received, THE System SHALL return a paginated list of Child_Records
2. WHEN a page query parameter is provided, THE System SHALL return records for that page number with default page size 8
3. WHEN a limit query parameter is provided, THE System SHALL return that number of records per page
4. WHEN no page parameter is provided, THE System SHALL default to page 1
5. WHEN the authenticated user has ADMIN role, THE System SHALL return Child_Records from all orphanages
6. WHEN the authenticated user has ORPHANAGE role, THE System SHALL apply Role_Filter to return only Child_Records where orphanageId matches user.orphanageStaff[0].orphanageId
7. WHEN a search query parameter is provided, THE System SHALL filter Child_Records where the Search_Query matches childCode, firstName, lastName, orphanage name, or risk level (case-insensitive)
8. WHEN a Child_Record is returned, THE System SHALL compute the age field as years from dateOfBirth or use approximateAge
9. WHEN a Child_Record is returned, THE System SHALL compute the Attendance_Percentage as (PRESENT count / total AttendanceRecord count) * 100
10. WHEN a Child_Record is returned, THE System SHALL compute the Risk_Level from the latest AIRiskScore.riskLevel ordered by computedAt DESC
11. WHEN a Child_Record is returned, THE System SHALL compute the Health_Status from the healthStatus field mapped to frontend labels (HEALTHY → "Stable", UNDER_TREATMENT → "Observation", CRITICAL → "Needs Review")
12. WHEN Child_Records are returned, THE System SHALL include orphanage name, child ID, name, age, risk level, health status, and attendance percentage in each record
13. WHEN the response is prepared, THE System SHALL include total count, current page, total pages, and items array in the response body
14. WHEN the database query executes, THE System SHALL use indexed columns (orphanageId, isActive) for performance optimization
15. WHEN the request is processed, THE System SHALL return HTTP status 200 with JSON response body

### Requirement 3: Child Statistics Endpoint

**User Story:** As an Admin or Orphanage Staff member, I want to retrieve dashboard statistics for children, so that I can view summary counts for total children, high risk, adopted, and needs review.

#### Acceptance Criteria

1. WHEN a GET request is received at /children/stats, THE System SHALL compute Dashboard_Statistics
2. WHEN the authenticated user has ADMIN role, THE System SHALL compute statistics across all orphanages
3. WHEN the authenticated user has ORPHANAGE role, THE System SHALL apply Role_Filter to compute statistics only for children where orphanageId matches user.orphanageStaff[0].orphanageId
4. WHEN computing total count, THE System SHALL count Child_Records where isActive is true
5. WHEN computing high risk count, THE System SHALL count Child_Records where the latest AIRiskScore.riskLevel is HIGH or CRITICAL
6. WHEN computing adopted count, THE System SHALL count Child_Records where adoptionStatus is COMPLETED
7. WHEN computing needs review count, THE System SHALL count Child_Records where healthStatus is CRITICAL
8. WHEN statistics are computed, THE System SHALL return HTTP status 200 with response body containing total, high, adopted, and review counts

### Requirement 4: Child Profile Retrieval Endpoint

**User Story:** As an Admin or Orphanage Staff member, I want to retrieve comprehensive details for a single child, so that I can view complete profile information including medical history, adoption status, and guardian details.

#### Acceptance Criteria

1. WHEN a GET request is received at /children/:childId, THE System SHALL retrieve the Child_Record with all related data
2. WHEN the Child_Record is retrieved, THE System SHALL join with Orphanage table to include orphanage name and details
3. WHEN the Child_Record is retrieved, THE System SHALL join with MedicalHistory table to include all medical history records
4. WHEN the Child_Record is retrieved, THE System SHALL join with HealthReport table to include all health reports
5. WHEN the Child_Record is retrieved, THE System SHALL join with AttendanceRecord table to compute Attendance_Percentage
6. WHEN the Child_Record is retrieved, THE System SHALL join with AIRiskScore table to include latest risk score ordered by computedAt DESC
7. WHEN the Child_Record is retrieved, THE System SHALL join with AdoptionRecord table to include adoption status and details
8. WHEN the Child_Record is retrieved, THE System SHALL join with GuardianHistory table to include guardian details if adopted
9. WHEN the Child_Record is retrieved, THE System SHALL join with ChildDocument table to include document references
10. WHEN the authenticated user has ORPHANAGE role, THE System SHALL verify the Child_Record.orphanageId matches user.orphanageStaff[0].orphanageId
11. IF the authenticated user has ORPHANAGE role and the Child_Record.orphanageId does not match, THEN THE System SHALL return HTTP status 403 with message "You do not have permission to view this child record"
12. WHEN the Child_Record is not found, THE System SHALL return HTTP status 404 with message "Child record not found"
13. WHEN the Child_Record is retrieved and adoptionStatus is COMPLETED, THE System SHALL include parent/guardian details from GuardianHistory linked to Parent record
14. WHEN parent/guardian details are included, THE System SHALL include father name, mother name, father phone, mother phone, email, address, adoption order ID, and follow-up officer
15. WHEN the response is prepared, THE System SHALL map Prisma enum values to frontend human-readable strings using Enum_Mapper
16. WHEN the response is prepared, THE System SHALL compute age from dateOfBirth or use approximateAge
17. WHEN the response is prepared, THE System SHALL compute Attendance_Percentage from AttendanceRecord table
18. WHEN the response is prepared, THE System SHALL include AI safety score as percentage from latest AIRiskScore
19. WHEN the database query executes, THE System SHALL optimize join queries using indexed foreign key columns
20. WHEN the request is processed successfully, THE System SHALL return HTTP status 200 with comprehensive JSON response body

### Requirement 5: Enum Mapping Service

**User Story:** As a developer, I want bidirectional enum mapping utilities, so that frontend strings are correctly converted to Prisma enums and vice versa.

#### Acceptance Criteria

1. THE System SHALL provide an Enum_Mapper service class with static methods for all enum types
2. WHEN "Male" is mapped, THE System SHALL convert to ChildGender.MALE
3. WHEN "Female" is mapped, THE System SHALL convert to ChildGender.FEMALE
4. WHEN "Other" is mapped, THE System SHALL convert to ChildGender.OTHER
5. WHEN "A+" is mapped, THE System SHALL convert to BloodGroup.A_POSITIVE
6. WHEN "A-" is mapped, THE System SHALL convert to BloodGroup.A_NEGATIVE
7. WHEN "B+" is mapped, THE System SHALL convert to BloodGroup.B_POSITIVE
8. WHEN "B-" is mapped, THE System SHALL convert to BloodGroup.B_NEGATIVE
9. WHEN "AB+" is mapped, THE System SHALL convert to BloodGroup.AB_POSITIVE
10. WHEN "AB-" is mapped, THE System SHALL convert to BloodGroup.AB_NEGATIVE
11. WHEN "O+" is mapped, THE System SHALL convert to BloodGroup.O_POSITIVE
12. WHEN "O-" is mapped, THE System SHALL convert to BloodGroup.O_NEGATIVE
13. WHEN "Low" is mapped, THE System SHALL convert to RiskLevel.LOW
14. WHEN "Medium" is mapped, THE System SHALL convert to RiskLevel.MEDIUM
15. WHEN "High" is mapped, THE System SHALL convert to RiskLevel.HIGH
16. WHEN ChildGender.MALE is reverse-mapped, THE System SHALL convert to "Male"
17. WHEN ChildGender.FEMALE is reverse-mapped, THE System SHALL convert to "Female"
18. WHEN ChildGender.OTHER is reverse-mapped, THE System SHALL convert to "Other"
19. WHEN BloodGroup.A_POSITIVE is reverse-mapped, THE System SHALL convert to "A+"
20. WHEN BloodGroup.A_NEGATIVE is reverse-mapped, THE System SHALL convert to "A-"
21. WHEN BloodGroup.B_POSITIVE is reverse-mapped, THE System SHALL convert to "B+"
22. WHEN BloodGroup.B_NEGATIVE is reverse-mapped, THE System SHALL convert to "B-"
23. WHEN BloodGroup.AB_POSITIVE is reverse-mapped, THE System SHALL convert to "AB+"
24. WHEN BloodGroup.AB_NEGATIVE is reverse-mapped, THE System SHALL convert to "AB-"
25. WHEN BloodGroup.O_POSITIVE is reverse-mapped, THE System SHALL convert to "O+"
26. WHEN BloodGroup.O_NEGATIVE is reverse-mapped, THE System SHALL convert to "O-"
27. WHEN RiskLevel.LOW is reverse-mapped, THE System SHALL convert to "Low"
28. WHEN RiskLevel.MEDIUM is reverse-mapped, THE System SHALL convert to "Medium"
29. WHEN RiskLevel.HIGH is reverse-mapped, THE System SHALL convert to "High"
30. WHEN RiskLevel.CRITICAL is reverse-mapped, THE System SHALL convert to "High"
31. WHEN HealthStatus.HEALTHY is reverse-mapped, THE System SHALL convert to "Stable"
32. WHEN HealthStatus.UNDER_TREATMENT is reverse-mapped, THE System SHALL convert to "Observation"
33. WHEN HealthStatus.CRITICAL is reverse-mapped, THE System SHALL convert to "Needs Review"
34. WHEN an invalid enum value is provided for mapping, THE System SHALL throw a BadRequestException with message "Invalid enum value: {value}"

### Requirement 6: AWS S3 Photo Upload Service

**User Story:** As a developer, I want an AWS S3 integration service, so that child photos are securely stored in cloud storage with proper path organization.

#### Acceptance Criteria

1. THE System SHALL provide an S3UploadService class for managing photo uploads
2. WHEN a photo upload is initiated, THE System SHALL read AWS credentials from environment variables AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, and AWS_REGION
3. WHEN a photo upload is initiated, THE System SHALL read the S3 bucket name from environment variable AWS_S3_BUCKET_NAME
4. WHEN uploading a photo, THE System SHALL generate a unique filename using pattern photo-{timestamp}-{randomUUID}.{extension}
5. WHEN uploading a photo, THE System SHALL construct the S3 key as children/{childCode}/{filename}
6. WHEN uploading a photo, THE System SHALL set ContentType metadata based on file MIME type
7. WHEN uploading a photo, THE System SHALL set ACL to private
8. WHEN the upload completes successfully, THE System SHALL return the S3 URL in format https://{bucket}.s3.{region}.amazonaws.com/{key}
9. WHEN the upload completes successfully, THE System SHALL return the storage path as children/{childCode}/{filename}
10. IF the upload fails, THEN THE System SHALL throw an InternalServerErrorException with message "Failed to upload photo to S3"
11. WHEN the S3 client is initialized, THE System SHALL configure timeout of 30 seconds for upload operations
12. WHEN the S3 client is initialized, THE System SHALL enable automatic retry with exponential backoff for transient failures

### Requirement 7: Authorization and Role-Based Access Control

**User Story:** As a system administrator, I want role-based access control enforced on all endpoints, so that Admin users have full access and Orphanage staff can only access their orphanage's children.

#### Acceptance Criteria

1. THE System SHALL require JWT authentication token for all children endpoints
2. WHEN a request is received without a valid JWT token, THE System SHALL return HTTP status 401 with message "Unauthorized"
3. WHEN a request is received with an expired JWT token, THE System SHALL return HTTP status 401 with message "Token expired"
4. WHEN a request is received with a valid JWT token, THE System SHALL extract the user object from the token payload
5. WHEN the user object is extracted, THE System SHALL verify the user.role is either ADMIN or ORPHANAGE
6. WHEN the user.role is neither ADMIN nor ORPHANAGE, THE System SHALL return HTTP status 403 with message "Insufficient permissions"
7. WHEN the user.role is ORPHANAGE, THE System SHALL extract user.orphanageStaff[0].orphanageId for Role_Filter application
8. WHEN user.orphanageStaff array is empty for ORPHANAGE role, THE System SHALL return HTTP status 403 with message "Orphanage staff record not found"
9. WHEN applying Role_Filter to list endpoint, THE System SHALL add where clause orphanageId equals user.orphanageStaff[0].orphanageId
10. WHEN applying Role_Filter to detail endpoint, THE System SHALL verify Child_Record.orphanageId equals user.orphanageStaff[0].orphanageId after retrieval
11. WHEN the authorization check fails on detail endpoint, THE System SHALL not disclose whether the record exists
12. WHEN applying Role_Filter to registration endpoint for ORPHANAGE role, THE System SHALL override orphanage field with user.orphanageStaff[0].orphanageId regardless of request body value

### Requirement 8: Audit Logging

**User Story:** As a system administrator, I want all child record operations logged, so that I can track who created or modified records for security auditing.

#### Acceptance Criteria

1. WHEN a Child_Record is created, THE System SHALL create an AuditLog entry with action "CHILD_CREATED"
2. WHEN an AuditLog entry is created, THE System SHALL set userId to the authenticated user's ID
3. WHEN an AuditLog entry is created, THE System SHALL set resource to "Child"
4. WHEN an AuditLog entry is created, THE System SHALL set resourceId to the Child_Record.id
5. WHEN an AuditLog entry is created, THE System SHALL set details as JSON object containing childCode, name, orphanageId, and risk level
6. WHEN an AuditLog entry is created, THE System SHALL set ipAddress from request headers X-Forwarded-For or connection remoteAddress
7. WHEN an AuditLog entry is created, THE System SHALL set userAgent from request headers User-Agent
8. WHEN an AuditLog entry is created, THE System SHALL set success to true if operation completed without errors
9. IF an error occurs during Child_Record creation, THEN THE System SHALL create an AuditLog entry with success set to false and details containing error message
10. WHEN an AuditLog entry is created, THE System SHALL set createdAt timestamp to current UTC time

### Requirement 9: Validation and Error Handling

**User Story:** As a frontend developer, I want detailed validation error messages, so that I can display specific error messages to users for each form field.

#### Acceptance Criteria

1. WHEN validation fails on a request, THE System SHALL return HTTP status 400
2. WHEN multiple validation errors occur, THE System SHALL return all validation error messages in a single response
3. WHEN a validation error response is returned, THE System SHALL include statusCode 400, message array with all error messages, and error string "Bad Request"
4. WHEN a required field is missing, THE System SHALL include message "{fieldName} should not be empty"
5. WHEN a string field exceeds maximum length, THE System SHALL include message "{fieldName} must be shorter than or equal to {max} characters"
6. WHEN a string field is below minimum length, THE System SHALL include message "{fieldName} must be longer than or equal to {min} characters"
7. WHEN a numeric field exceeds maximum value, THE System SHALL include message "{fieldName} must not be greater than {max}"
8. WHEN a numeric field is below minimum value, THE System SHALL include message "{fieldName} must not be less than {min}"
9. WHEN an enum field has invalid value, THE System SHALL include message "{fieldName} must be one of the following values: {validValues}"
10. WHEN a file upload field has invalid file type, THE System SHALL include message "File must be of type {allowedTypes}"
11. WHEN a file upload exceeds size limit, THE System SHALL return HTTP status 413 with message "Payload too large"
12. WHEN an orphanage ID reference is invalid, THE System SHALL return HTTP status 400 with message "Orphanage not found"
13. WHEN a database constraint violation occurs, THE System SHALL return HTTP status 409 with message describing the conflict
14. WHEN an unexpected error occurs, THE System SHALL return HTTP status 500 with message "Internal server error"
15. WHEN an unexpected error occurs, THE System SHALL log the full error stack trace to application logs

### Requirement 10: API Documentation

**User Story:** As a frontend developer, I want comprehensive Swagger/OpenAPI documentation, so that I can understand endpoint schemas, request/response formats, and authentication requirements.

#### Acceptance Criteria

1. THE System SHALL expose Swagger UI at /api/docs endpoint
2. WHEN the Swagger UI is accessed, THE System SHALL display all children endpoints with request/response schemas
3. WHEN an endpoint is documented, THE System SHALL include HTTP method, path, description, and tags
4. WHEN an endpoint requires authentication, THE System SHALL display the security requirement as "bearer token"
5. WHEN an endpoint has request body, THE System SHALL display the DTO schema with all properties, types, and validation rules
6. WHEN an endpoint has query parameters, THE System SHALL display parameter name, type, required flag, and description
7. WHEN an endpoint has path parameters, THE System SHALL display parameter name, type, and description
8. WHEN an endpoint has response schemas, THE System SHALL display schema for each HTTP status code (200, 201, 400, 401, 403, 404, 500)
9. WHEN enum types are used, THE System SHALL display the list of allowed values in the schema
10. WHEN file upload is supported, THE System SHALL display the content type as multipart/form-data and file field details
11. WHEN the Swagger UI is accessed, THE System SHALL provide a "Try it out" feature for testing endpoints with authorization
12. WHEN request examples are defined, THE System SHALL display example request body for each endpoint

### Requirement 11: Performance and Optimization

**User Story:** As a system administrator, I want the API to handle 1000+ children records efficiently, so that list and detail endpoints respond within acceptable time limits.

#### Acceptance Criteria

1. WHEN the list endpoint is queried, THE System SHALL use database indexes on orphanageId, isActive, and currentStatus columns
2. WHEN the list endpoint is queried, THE System SHALL limit the result set to the page size before loading related data
3. WHEN the detail endpoint is queried, THE System SHALL use select queries with explicit column selection to avoid fetching unused fields
4. WHEN the detail endpoint is queried with 8+ table joins, THE System SHALL execute joins efficiently using indexed foreign key columns
5. WHEN the search query is applied, THE System SHALL use database full-text search indexes if available or ILIKE queries with indexed columns
6. WHEN computing Attendance_Percentage, THE System SHALL use aggregate queries rather than loading all records into memory
7. WHEN computing Dashboard_Statistics, THE System SHALL use aggregate queries with COUNT function rather than loading all records
8. WHEN the list endpoint is queried, THE System SHALL respond within 500ms for datasets up to 1000 records
9. WHEN the detail endpoint is queried, THE System SHALL respond within 300ms with all joined data
10. WHEN the registration endpoint is called, THE System SHALL complete within 2000ms including S3 upload operation
11. WHEN database queries are executed, THE System SHALL use connection pooling with minimum 5 connections and maximum 20 connections
12. WHEN database queries are executed, THE System SHALL set query timeout to 10 seconds to prevent long-running queries

### Requirement 12: Data Integrity and Consistency

**User Story:** As a system administrator, I want data integrity enforced through transactions and constraints, so that child records remain consistent and orphan records are prevented.

#### Acceptance Criteria

1. WHEN a Child_Record is created, THE System SHALL execute the operation within a database transaction
2. WHEN a Child_Record is created with photo upload, THE System SHALL execute photo upload, Child_Record creation, ChildDocument creation, MedicalHistory creation, and AIRiskScore creation within a single transaction
3. IF any operation within the transaction fails, THEN THE System SHALL roll back all changes including deleting uploaded S3 photo
4. WHEN the orphanageId foreign key is set, THE System SHALL verify the referenced Orphanage record exists
5. WHEN a Child_Record references an Orphanage that does not exist, THE System SHALL reject the operation with HTTP status 400
6. WHEN a Child_Record is created, THE System SHALL enforce unique constraint on childCode
7. WHEN a duplicate childCode is generated, THE System SHALL retry generation with incremented sequence number
8. WHEN Child_Code generation fails after 10 retries, THE System SHALL return HTTP status 500 with message "Failed to generate unique child code"
9. WHEN a ChildDocument is created, THE System SHALL enforce foreign key constraint to Child_Record
10. WHEN a MedicalHistory record is created, THE System SHALL enforce foreign key constraint to Child_Record
11. WHEN an AIRiskScore record is created, THE System SHALL enforce foreign key constraint to Child_Record
12. WHEN concurrent requests attempt to create Child_Records with the same childCode, THE System SHALL serialize operations using database locking

### Requirement 13: Child Code Generation

**User Story:** As a system administrator, I want child codes auto-generated in a standardized format, so that each child has a unique, identifiable code following organizational conventions.

#### Acceptance Criteria

1. WHEN generating a Child_Code, THE System SHALL use format CHD-YYYY-NNNNNN where YYYY is current year and NNNNNN is zero-padded sequence
2. WHEN determining the sequence number, THE System SHALL query the highest existing childCode for the current year
3. WHEN no Child_Records exist for the current year, THE System SHALL start the sequence at 000001
4. WHEN Child_Records exist for the current year, THE System SHALL increment the highest sequence number by 1
5. WHEN the sequence number reaches 999999, THE System SHALL return HTTP status 500 with message "Child code sequence exhausted for year {year}"
6. WHEN generating the Child_Code, THE System SHALL execute the query and increment operation atomically to prevent race conditions
7. WHEN a Child_Code is generated, THE System SHALL validate the generated code does not already exist in the database
8. IF the generated code already exists, THEN THE System SHALL retry generation with incremented sequence
9. WHEN retry attempts are exhausted, THE System SHALL return HTTP status 500 with message "Failed to generate unique child code"
10. WHEN a Child_Record is created, THE System SHALL store the childCode in the childCode column with unique constraint

### Requirement 14: Medical History Integration

**User Story:** As a medical staff member, I want initial medical conditions captured during registration, so that the child's medical history is initialized from admission details.

#### Acceptance Criteria

1. WHEN a Child_Record is created with medicalCondition field, THE System SHALL create a MedicalHistory record
2. WHEN creating the MedicalHistory record, THE System SHALL set conditionName to the value from medicalCondition field
3. WHEN creating the MedicalHistory record, THE System SHALL set diagnosedDate to the admissionDate value
4. WHEN creating the MedicalHistory record, THE System SHALL set isCurrent to true
5. WHEN creating the MedicalHistory record, THE System SHALL set severity to MILD as default
6. WHEN creating the MedicalHistory record, THE System SHALL link it to the Child_Record via childId foreign key
7. WHEN creating the MedicalHistory record, THE System SHALL set recordedById to the authenticated user's ID
8. WHEN the MedicalHistory record creation fails, THE System SHALL roll back the entire Child_Record creation transaction

### Requirement 15: AI Risk Score Initialization

**User Story:** As a safety administrator, I want initial risk scores captured during registration, so that each child has a baseline risk assessment from admission.

#### Acceptance Criteria

1. WHEN a Child_Record is created with risk field, THE System SHALL create an AIRiskScore record
2. WHEN creating the AIRiskScore record, THE System SHALL map the risk field value to RiskLevel enum using Enum_Mapper
3. WHEN creating the AIRiskScore record, THE System SHALL set score based on risk level (Low → 25, Medium → 50, High → 75)
4. WHEN creating the AIRiskScore record, THE System SHALL link it to the Child_Record via childId foreign key
5. WHEN creating the AIRiskScore record, THE System SHALL set computedAt to current timestamp
6. WHEN creating the AIRiskScore record, THE System SHALL set isComputedBySystem to false
7. WHEN creating the AIRiskScore record, THE System SHALL set computedById to the authenticated user's ID
8. WHEN creating the AIRiskScore record, THE System SHALL set notes to "Initial risk assessment from registration"
9. WHEN the AIRiskScore record creation fails, THE System SHALL roll back the entire Child_Record creation transaction
