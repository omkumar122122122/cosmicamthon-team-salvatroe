# Velora AI: Parent Visit QR Access & Staff RFID System
## Live Multi-Device Demo & Deployment Guide

This guide documents the multi-port and public tunneling architecture for running and demonstrating the Velora Orphanage Child Safety System, Gate Checkpoint, Staff Portal, and Parent Visit Portal across multiple devices.

---

## 1. System Architecture & Port Allocation

| Service / Subsystem | Local URL | Port | Public Live Tunnel URL | Role & Purpose |
| :--- | :--- | :---: | :--- | :--- |
| **Velora Main Dashboard** | `http://localhost:5173/` | `5173` | Local / Deployed Host | Orphanage admin management, child records, visit approvals, and Gate Checkpoint (`/orphanage/gate`) |
| **Staff Access Portal** | `http://localhost:5174/` | `5174` | `https://fans-outsourcing-oct-cherry.trycloudflare.com` | Standalone public clearance view for staff members (`/staff/:staffId`) |
| **Parent Visit Portal** | `http://localhost:5175/` | `5175` | `https://viii-income-mitsubishi-sphere.trycloudflare.com` | Standalone public visitor pass & live lifecycle timeline (`/visit/:passId`) |
| **Backend API (NestJS)** | `http://localhost:3000/api/v1` | `3000` | Local / Render Host | Authoritative 14-rule gate verification, state machine, and scan audit logging |
| **AI Microservice (FastAPI)** | `http://localhost:8000/` | `8000` | Local Host | Child safety biometric & face monitoring microservice |
| **Database** | Neon Serverless | `5432` | AWS ap-southeast-1 | PostgreSQL with Prisma ORM (`visit_requests`, `nfc_visits`, `nfc_scans`) |

---

## 2. Startup Commands

### Step 1: Start Backend API
```bash
cd backend
npm run start:dev
```
*Listens on `http://localhost:3000` with API prefix `/api/v1`.*

### Step 2: Start Main Velora Dashboard & Gate (Port 5173)
```bash
npm run dev
```
*Runs on `http://localhost:5173/`. Access gate at `http://localhost:5173/orphanage/gate`.*

### Step 3: Start Staff Access Portal (Port 5174)
```bash
npm run dev:portal
```
*Runs on `http://localhost:5174/` (Routes: `/staff`, `/staff/:staffId`).*

### Step 4: Start Parent Visit Portal (Port 5175)
```bash
npm run dev:parent-portal
```
*Runs on `http://localhost:5175/` (Routes: `/visit`, `/visit/:identifier`).*

### Step 5: Start Public Cloudflare Tunnels (For Multi-Device / Phone Access)
- **Parent Portal Tunnel (Port 5175)**:
  ```bash
  cloudflared tunnel --url http://localhost:5175
  ```
- **Staff Portal Tunnel (Port 5174)**:
  ```bash
  cloudflared tunnel --url http://localhost:5174
  ```

---

## 3. Environment Variables Configuration

### Frontend Root (`.env`):
```ini
VITE_API_URL=http://localhost:3000/api/v1
VITE_APP_NAME="Orphan Age Child Safety System"
VITE_APP_VERSION="1.0.0"
VITE_STAFF_PORTAL_URL=https://fans-outsourcing-oct-cherry.trycloudflare.com
VITE_PARENT_PORTAL_URL=https://viii-income-mitsubishi-sphere.trycloudflare.com
```

### Backend (`backend/.env`):
```ini
PORT=3000
API_PREFIX=api/v1
CORS_ORIGINS=http://localhost:5173,http://localhost:5174,http://localhost:5175,https://fans-outsourcing-oct-cherry.trycloudflare.com,https://viii-income-mitsubishi-sphere.trycloudflare.com
STAFF_PORTAL_URL=https://fans-outsourcing-oct-cherry.trycloudflare.com
PARENT_PORTAL_URL=https://viii-income-mitsubishi-sphere.trycloudflare.com
DATABASE_URL="postgresql://...neon.tech/neondb?sslmode=require"
```

---

## 4. Multi-Device Live Demo Walkthrough

### Demonstration Setup:
- **Device A (Laptop / Gate Terminal)**: Open Gate at `http://localhost:5173/orphanage/gate`
- **Device B (Mobile Phone / Visitor Device)**: Open Parent Visit Portal at `https://viii-income-mitsubishi-sphere.trycloudflare.com/visit/NFC-VST-D3642D`

### Flow:
1. **Device B (Visitor)**: Shows `✓ APPROVED` digital pass with scannable QR code.
2. **Device A (Security Guard)**:
   - Toggle Gate mode to `[ PARENT QR ]`.
   - Scan QR displayed on Device B.
   - Result: `✓ ACCESS GRANTED — ENTRY AUTHORIZED`.
   - Gate outputs `[ OPEN VISIT PORTAL ]` and `[ COPY VISIT LINK ]`.
3. **Device B (Visitor)**:
   - Real-time 12-second background sync (or manual refresh) updates portal status to `✓ CHECKED IN` with active Entry Timestamp.
4. **Device A (Departure)**:
   - Security Guard scans the QR on Device B once more upon visitor departure.
   - Result: `✓ EXIT VERIFIED — VISIT COMPLETED` with total duration in minutes.
5. **Device B (Final State)**:
   - Portal updates to `✓ VISIT COMPLETED` with full 4-step verified audit timeline.
   - Any subsequent scan of the same QR is safely rejected (`COMPLETED / ACCESS DENIED`).

### Staff RFID Demonstration:
1. Security Guard toggles Gate mode to `[ STAFF RFID ]`.
2. Enter or tap `RFID-STF-001`.
3. Gate authorizes movement (`ENTRY` / `EXIT`), generates live Staff Portal link (`https://fans-outsourcing-oct-cherry.trycloudflare.com/staff/STF-001`), and records the movement in the unified activity stream.
