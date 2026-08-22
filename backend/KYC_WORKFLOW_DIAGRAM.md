# KYC-Notification-Alert Workflow - Complete Integration

## Project Flow Diagram

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    PARENT KYC VERIFICATION WORKFLOW                      │
│              Complete Notification & Alert Integration                   │
└─────────────────────────────────────────────────────────────────────────┘

┌──────────────────┐
│  PARENT UPLOADS  │
│    DOCUMENTS     │
│  (Frontend UI)   │
└────────┬─────────┘
         │
         │ Documents uploaded to backend
         │ POST /parents/:id/documents
         │
         ▼
┌──────────────────────────────────────────────┐
│         All Required Documents Ready         │
│    (Aadhaar, PAN, Address Proof, etc.)      │
└────────┬─────────────────────────────────────┘
         │
         │ Parent clicks "Submit KYC"
         │ POST /parents/kyc/submit
         │
         ▼
╔════════════════════════════════════════════════════════════╗
║            submitKyc() - ParentsService                    ║
║  ┌──────────────────────────────────────────────────────┐ ║
║  │  1. Validate all required documents uploaded        │ ║
║  │  2. Update Parent:                                   │ ║
║  │     • kycStatus = SUBMITTED                          │ ║
║  │     • verificationStatus = UNDER_REVIEW             │ ║
║  │     • kycSubmittedAt = now()                        │ ║
║  │  3. ✨ SEND NOTIFICATION TO ALL ADMINS ✨            │ ║
║  │     Title: "New KYC Submitted"                       │ ║
║  │     Body: "[Parent Name] has submitted KYC           │ ║
║  │            documents for verification"               │ ║
║  │     Type: KYC_STATUS_CHANGED                         │ ║
║  └──────────────────────────────────────────────────────┘ ║
╚════════════════════════════════════════════════════════════╝
         │
         │ Database Updated
         │
         ▼
┌─────────────────────────────────────────────────────────────┐
│              ✅ ADMIN NOTIFICATION CREATED                  │
│  • All active ADMIN users receive in-app notification       │
│  • Notification appears in Admin Dashboard                  │
│  • Notification table record created                        │
└────────┬────────────────────────────────────────────────────┘
         │
         │ Admin reviews from dashboard
         │
         ▼
┌─────────────────────────────────────────────────────────────┐
│              ADMIN REVIEWS KYC SUBMISSION                   │
│           (Admin Dashboard → Notifications)                 │
│                                                              │
│  Admin has 2 options:                                       │
│    1. Approve (POST /parents/:id/approve)                   │
│    2. Reject  (POST /parents/:id/reject)                    │
└────────┬─────────────────────────┬──────────────────────────┘
         │                         │
         │ APPROVED               │ REJECTED
         │                         │
         ▼                         ▼
╔═══════════════════════════╗  ╔══════════════════════════════════════╗
║  approveParent()          ║  ║  rejectParent()                      ║
║  ParentsService           ║  ║  ParentsService                      ║
║  ┌─────────────────────┐ ║  ║  ┌────────────────────────────────┐ ║
║  │ 1. Update Parent:   │ ║  ║  │ 1. Update Parent:              │ ║
║  │    • verification   │ ║  ║  │    • verificationStatus =      │ ║
║  │      Status =       │ ║  ║  │      REJECTED                  │ ║
║  │      APPROVED       │ ║  ║  │    • kycStatus = REJECTED      │ ║
║  │    • kycStatus =    │ ║  ║  │    • rejectionReason = reason  │ ║
║  │      APPROVED       │ ║  ║  │    • kycRejectionReason = ...  │ ║
║  │    • kycApprovedAt  │ ║  ║  │ 2. ⚠️ CREATE HIGH ALERT ⚠️     │ ║
║  │    • verifiedById   │ ║  ║  │    • severity = HIGH           │ ║
║  │    • verifiedAt     │ ║  ║  │    • type =                    │ ║
║  │    • isActive=true  │ ║  ║  │      KYC_VERIFICATION_FAILED  │ ║
║  │ 2. Update User:     │ ║  ║  │    • status = OPEN             │ ║
║  │    • role = PARENT  │ ║  ║  │    • parentId = parent.id      │ ║
║  │                     │ ║  ║  │    • createdById = adminId     │ ║
║  └─────────────────────┘ ║  ║  │    • metadata = {parentName,   │ ║
║                           ║  ║  │      email, reason, timestamp} │ ║
╚═══════════════════════════╝  ║  │ 3. ✨ NOTIFY PARENT ✨         │ ║
         │                     ║  │    Title: "KYC Rejected"       │ ║
         │                     ║  │    Body: Reason + instructions │ ║
         ▼                     ║  │ 4. ✨ NOTIFY ALL ADMINS ✨     │ ║
┌─────────────────────────┐   ║  │    Title: "KYC Verification    │ ║
│ ✨ SEND 2 NOTIFICATIONS │   ║  │            Failed"             │ ║
│                         │   ║  │    Body: Parent + reason +     │ ║
│ 1. TO PARENT:           │   ║  │          "alert created"       │ ║
│    Title: "KYC Approved"│   ║  └────────────────────────────────┘ ║
│    Body: "You can now   │   ╚══════════════════════════════════════╝
│           access all    │                │
│           features"     │                │
│    Type: KYC_STATUS_    │                ▼
│          CHANGED        │   ┌────────────────────────────────────┐
│                         │   │  ✅ ALERT CREATED IN DATABASE      │
│ 2. TO ALL ADMINS:       │   │  • severity = HIGH                 │
│    Title: "Parent       │   │  • type = KYC_VERIFICATION_FAILED  │
│            Verified"    │   │  • status = OPEN                   │
│    Body: "[Parent Name] │   │  • Visible in Admin Alerts panel   │
│           successfully  │   └──────────────┬─────────────────────┘
│           verified"     │                  │
│    Type: KYC_STATUS_    │                  │
│          CHANGED        │                  ▼
└────────┬────────────────┘   ┌────────────────────────────────────┐
         │                    │  ✨ SEND 2 NOTIFICATIONS ✨         │
         │                    │                                     │
         ▼                    │  1. TO PARENT:                      │
┌─────────────────────────┐   │     Title: "KYC Rejected"          │
│ ✅ SUCCESS               │   │     Body: "Reason: [reason].       │
│                         │   │            Please update docs"     │
│ • Parent notified       │   │     Type: KYC_STATUS_CHANGED       │
│ • All admins notified   │   │                                     │
│ • Parent can now:       │   │  2. TO ALL ADMINS:                 │
│   - Submit visit req    │   │     Title: "KYC Verification       │
│   - Access features     │   │             Failed"                │
│   - Use Sahayak AI      │   │     Body: "[Parent Name]           │
│                         │   │            verification failed.    │
└─────────────────────────┘   │            Reason: [reason].       │
                              │            High-priority alert     │
                              │            created"                │
                              │     Type: KYC_STATUS_CHANGED       │
                              └──────────────┬─────────────────────┘
                                             │
                                             ▼
                              ┌────────────────────────────────────┐
                              │ ✅ REJECTION COMPLETE              │
                              │                                     │
                              │ • Parent notified with reason      │
                              │ • All admins notified              │
                              │ • HIGH alert created & visible     │
                              │ • Parent can resubmit after fixes  │
                              └────────────────────────────────────┘
```

---

## Summary of Integration Points

### 1. **KYC Submission** (`POST /parents/kyc/submit`)
- **Action:** Parent submits KYC for review
- **Notifications:** 
  - ✅ Admin notification (NEW)
  - Title: "New KYC Submitted"
  - Recipients: All active admins

### 2. **KYC Approval** (`POST /parents/:id/approve`)
- **Action:** Admin approves parent KYC
- **Notifications:**
  - ✅ Parent notification (EXISTING)
  - ✅ Admin notification (NEW)
  - Title: "Parent Verified"
  - Recipients: All active admins

### 3. **KYC Rejection** (`POST /parents/:id/reject`)
- **Action:** Admin rejects parent KYC
- **Notifications:**
  - ✅ Parent notification (EXISTING - ENHANCED)
  - ✅ Admin notification (NEW)
  - Title: "KYC Verification Failed"
  - Recipients: All active admins
- **Alerts:**
  - ✅ HIGH severity alert (NEW)
  - Type: KYC_VERIFICATION_FAILED
  - Visible in: Admin Alerts dashboard

---

## Database Models Used

### Notification Table
```typescript
{
  userId: string           // Recipient user ID
  type: NotificationType   // KYC_STATUS_CHANGED
  channel: 'IN_APP'
  title: string
  body: string
  relatedEntityType: 'PARENT'
  relatedEntityId: parentId
  isRead: boolean
  sentAt: DateTime
}
```

### Alert Table
```typescript
{
  severity: 'HIGH'
  type: 'KYC_VERIFICATION_FAILED'  // ← NEW ENUM VALUE
  status: 'OPEN'
  title: 'KYC Verification Rejected'
  details: string              // Full rejection details
  parentId: string
  createdById: adminId
  metadata: {
    parentName: string
    parentEmail: string
    rejectionReason: string
    rejectedBy: adminId
    rejectedAt: ISO timestamp
  }
}
```

---

## Frontend Integration

### Admin Dashboard
- **Notifications Panel:** Shows all KYC-related notifications
  - New submissions
  - Approvals confirmed
  - Rejections logged

- **Alerts Panel:** Shows high-priority KYC rejections
  - Filterable by severity (HIGH)
  - Filterable by type (KYC_VERIFICATION_FAILED)
  - Contains parent details and rejection reason

### Parent Dashboard
- **Notifications Panel:** Shows KYC status updates
  - Approval confirmation
  - Rejection notice with reason and next steps

---

## Key Benefits

✅ **Complete Visibility:** Admins notified at every KYC stage  
✅ **High-Priority Tracking:** Rejections create alerts for follow-up  
✅ **Parent Communication:** Clear feedback on approval/rejection  
✅ **Audit Trail:** All actions logged with timestamps and metadata  
✅ **No Breaking Changes:** All existing functionality preserved  
✅ **Transaction Safety:** Database operations wrapped in transactions  
✅ **Error Resilience:** Notification failures don't block KYC workflow  

---

## Files Modified

1. **backend/prisma/schema.prisma**
   - Added `KYC_VERIFICATION_FAILED` to `AlertType` enum
   - Removed duplicate enum values

2. **backend/src/parents/services/parents.service.ts**
   - Enhanced `submitKyc()` - Added admin notifications
   - Enhanced `approveParent()` - Added admin notifications
   - Enhanced `rejectParent()` - Added alert creation + dual notifications

---

## Testing Checklist

- [ ] Parent submits KYC → Admin receives notification
- [ ] Admin approves KYC → Parent receives notification
- [ ] Admin approves KYC → All admins receive confirmation
- [ ] Admin rejects KYC → Parent receives rejection with reason
- [ ] Admin rejects KYC → All admins receive notification
- [ ] Admin rejects KYC → HIGH alert created in alerts table
- [ ] Alert visible in admin dashboard alerts panel
- [ ] Notifications visible in notification panels
- [ ] Notification failures don't block KYC workflow
- [ ] Database transactions maintain consistency
