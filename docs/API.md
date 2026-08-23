# Velora — REST API Specification

## 1. Authentication Endpoints

### `POST /api/v1/auth/login`
- **Auth**: Public
- **Request**: `{ "email": "admin@velora.com", "password": "password123" }`
- **Response**: `{ "accessToken": "jwt_token", "user": { "id": "...", "role": "ADMIN" } }`

---

## 2. Gate & Access Control Endpoints

### `POST /api/v1/nfc/verify`
- **Auth**: Public / Gate Guard
- **Request**: `{ "credential": "NFC-VST-D3642D" | "STF-001" }`
- **Response**: `{ "status": "APPROVED", "result": "ENTRY" | "EXIT", "visitor": { ... }, "portalUrl": "..." }`

### `GET /api/v1/nfc/summary`
- **Auth**: Public / Guard View
- **Response**: `{ "todaySummary": { "totalExpected": 8, "activeInside": 3, "completed": 5 } }`

---

## 3. Reports & Analytics Endpoints

### `GET /api/v1/reports/management-analytics?period=30d`
- **Auth**: Public / Admin
- **Response**: Aggregated visit trends, peak gate movement hours, staff ratios, and population statistics.

### `GET /api/v1/reports/export-csv?type=visits`
- **Auth**: Public / Admin
- **Response**: Sanitized CSV format string of historical visit records.

---

## 4. Post-Adoption AI Welfare Endpoints

### `GET /api/v1/post-adoption/dashboard-summary`
- **Auth**: Public / Caseworker
- **Response**: Upcoming sessions, completed sessions, pending reviews, and AI Vision service status.

### `GET /api/v1/post-adoption/review-queue?status=ALL`
- **Auth**: Public / Caseworker
- **Response**: List of AI assessment observation cards with face verification % and sentiment indicators.

### `POST /api/v1/post-adoption/human-review`
- **Auth**: Public / Caseworker
- **Request**: `{ "assessmentId": "...", "decision": "REVIEWED" | "FOLLOW_UP_REQUIRED" | "ESCALATED", "notes": "..." }`
- **Response**: Confirmation with immutable audit record.
