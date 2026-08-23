# Velora — Complete Live Demonstration Guide

## 1. Demo Credentials & System Ports
- **Main Dashboard**: `http://localhost:5173` (Admin / Caseworker login: `admin@velora.com` / `password123`)
- **Gate Control Center**: `http://localhost:5173/orphanage/gate`
- **Staff Access Portal**: `http://localhost:5174/staff/STF-001`
- **Parent Visit Portal**: `http://localhost:5175/visit/NFC-VST-D3642D`
- **AI Vision Microservice**: `http://localhost:8000/docs`

---

## 2. Step-by-Step Live Demonstration Flow

### Step 1: Executive Dashboard & Overview
1. Open `http://localhost:5173`.
2. Review real-time population metrics (Children, Staff, Active Visits, Pending Adoptions).

### Step 2: Staff RFID Gate Clearance
1. Navigate to `/orphanage/gate`.
2. Under **Staff RFID Simulation**, select `STF-001 (Priya Sharma - Senior Caretaker)`.
3. Click `Simulate Tap`.
4. Observe **ENTRY APPROVED** verification card and live presence update.
5. Click **Open Staff Portal Link** (`:5174`) to show mobile-optimized staff badge.

### Step 3: Parent Visit Request & Gate QR Access
1. In Gate Control Center, toggle to **Parent QR Scanner**.
2. Scan / Enter Pass ID `NFC-VST-D3642D`.
3. Observe **ACCESS GRANTED** status with child matching `Aarav Sharma`.
4. Click **View Verified Parent Portal** (`:5175`) to show live session timer and rules.
5. Click **Record Exit** to complete visit lifecycle.

### Step 4: Real-time Access Audit Trail
1. Navigate to `/access-audit`.
2. Search for `STF-001` or `NFC-VST-D3642D`.
3. Verify timestamped append-only records with verification method badges.

### Step 5: Management Analytics & Export
1. Navigate to `/analytics`.
2. Toggle period selector (`7 Days`, `30 Days`, `90 Days`, `1 Year`).
3. Click **Download CSV Report** to demonstrate instant compliance reporting.
4. Click **Print Executive Summary** for PDF/printer layout.

### Step 6: Post-Adoption AI Welfare Monitoring
1. Navigate to `/ai-welfare`.
2. Review KPI Summary Cards (`Upcoming Sessions`, `Completed Sessions`, `Pending Reviews`).
3. Switch to **AI Review Queue** tab.
4. Click **Review** on a pending case to demonstrate human caseworker decision support.
5. Record decision (`✓ Mark Reviewed`) with casework notes.
