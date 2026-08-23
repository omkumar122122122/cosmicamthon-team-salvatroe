# Velora — Security & Compliance Architecture

## 1. Authentication & Session Management
- **Passport JWT Access Strategy**: Short-lived cryptographic tokens signed with server-side secrets.
- **Password Protection**: Salted bcrypt password hashing.

## 2. Authorization & RBAC
- **Multi-Role Protection**: Role-based access control guarding administrative functionality from parent and visitor accounts.
- **Port Isolation**:
  - `:5173` $\rightarrow$ Orphanage Administrative Control Center.
  - `:5174` $\rightarrow$ Staff Access Portal.
  - `:5175` $\rightarrow$ Parent Visit Portal.

## 3. Physical Access & Gate Security
- **Dual-Mode Scan Engine**: Validates RFID tags and Parent QR passes against scheduled slot windows.
- **Replay & Tamper Defense**: State machine prevents duplicate entries, unapproved exits, and replay scans.
- **Append-Only Audit**: All movements (`ENTRY`, `EXIT`, `DENIED`) recorded immutably in PostgreSQL.
