import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FiShield, FiUser, FiCalendar, FiCheckCircle, FiAlertCircle,
  FiClock, FiUpload, FiDownload, FiEye, FiFileText,
  FiX, FiCheck, FiRefreshCw, FiLock, FiInfo,
  FiAlertTriangle, FiUserCheck, FiTrash2, FiEdit2, FiExternalLink
} from "react-icons/fi";
import Breadcrumb from "../components/Breadcrumb";
import { PageSkeleton } from "../components/Loader";
import Button from "../components/Button";
import { classNames } from "../utils/formatters";
import { parentsService } from "../services/parentsService";
import { useAuth } from "../context/AuthContext";

/* ── Helpers ─────────────────────────────────────────────── */
function formatDate(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-IN", {
    day: "numeric", month: "short", year: "numeric"
  });
}

function formatBytes(bytes) {
  if (!bytes) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}

const DOCUMENT_TYPE_LABELS = {
  AADHAAR_CARD: "Aadhaar Card",
  PAN_CARD: "PAN Card",
  INCOME_PROOF: "Income Certificate / Proof",
  ADDRESS_PROOF: "Address Proof",
  PHOTO_ID: "Photograph / Photo ID",
  PASSPORT: "Passport",
  DRIVING_LICENSE: "Driving License",
  VOTER_ID: "Voter ID",
  BIRTH_CERTIFICATE: "Birth Certificate",
  MARRIAGE_CERTIFICATE: "Marriage Certificate",
  BANK_STATEMENT: "Bank Statement",
  EMPLOYMENT_LETTER: "Employment Letter",
  POLICE_CLEARANCE: "Police Clearance Certificate",
  OTHER: "Other Supporting Document",
};

const ALLOWED_MIME_TYPES = ["application/pdf", "image/jpeg", "image/jpg", "image/png"];
const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB

/* ── Status badge config ─────────────────────────────────── */
const statusCfg = {
  Verified:             { badge: "badge-success", icon: FiCheckCircle, label: "Verified" },
  Approved:             { badge: "badge-success", icon: FiCheckCircle, label: "Approved" },
  APPROVED:             { badge: "badge-success", icon: FiCheckCircle, label: "Approved (One-Time Verified)" },
  Submitted:            { badge: "badge-blue",    icon: FiFileText,    label: "Submitted" },
  SUBMITTED:            { badge: "badge-blue",    icon: FiFileText,    label: "Submitted (Under Review)" },
  "Under Review":       { badge: "badge-blue",    icon: FiClock,       label: "Under Review" },
  UNDER_REVIEW:         { badge: "badge-blue",    icon: FiClock,       label: "Under Review" },
  Pending:              { badge: "badge-warning", icon: FiClock,       label: "Draft / Pending" },
  PENDING:              { badge: "badge-warning", icon: FiClock,       label: "Draft / Pending" },
  "Re-upload Required": { badge: "badge-warning", icon: FiAlertTriangle, label: "Re-upload Required" },
  RE_UPLOAD_REQUIRED:   { badge: "badge-warning", icon: FiAlertTriangle, label: "Re-upload Required" },
  Compliant:            { badge: "badge-success", icon: FiCheckCircle, label: "Compliant" },
  REJECTED:             { badge: "badge-danger",  icon: FiX,           label: "Rejected" },
  Rejected:             { badge: "badge-danger",  icon: FiX,           label: "Rejected" },
};

function StatusBadge({ status }) {
  const cfg = statusCfg[status] ?? statusCfg["Pending"];
  const Icon = cfg.icon;
  return (
    <span className={classNames("badge gap-1.5 px-3 py-1 text-xs font-bold", cfg.badge)}>
      <Icon className="h-3.5 w-3.5" />
      {cfg.label || status}
    </span>
  );
}

/* ── Shared field-block display ──────────────────────────── */
function InfoField({ label, value, accent = false, icon: Icon }) {
  return (
    <div className="field-block min-w-0 rounded-xl border border-slate-100 bg-slate-50/70 p-3.5 dark:border-slate-800 dark:bg-slate-800/50">
      <div className="flex items-center gap-1.5 text-slate-400 dark:text-slate-500 mb-1">
        {Icon && <Icon className="h-3.5 w-3.5" />}
        <span className="text-[11px] font-bold uppercase tracking-wider">{label}</span>
      </div>
      <p className={classNames(
        "text-sm font-bold text-slate-900 dark:text-white truncate",
        accent ? "text-civic-700 dark:text-civic-400" : ""
      )} title={String(value || "—")}>
        {value || "—"}
      </p>
    </div>
  );
}

/* ── Section wrapper (card with header) ─────────────────── */
function Section({ title, icon: Icon, iconBg = "bg-civic-50 text-civic-600 dark:bg-civic-500/10 dark:text-civic-400", action, children }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-card dark:border-slate-800 dark:bg-slate-900">
      <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4 dark:border-slate-800">
        <div className="flex items-center gap-2.5">
          <div className={classNames("flex h-8 w-8 items-center justify-center rounded-xl", iconBg)}>
            <Icon className="h-4 w-4" />
          </div>
          <h2 className="text-sm font-bold text-slate-900 dark:text-white">{title}</h2>
        </div>
        {action && <div>{action}</div>}
      </div>
      <div>{children}</div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════
   MAIN PAGE: ParentKYC
 ═══════════════════════════════════════════════════════════ */
export default function ParentKYC() {
  const { user } = useAuth();
  const [kyc, setKyc] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  /* Client-side staged files before submission */
  const [stagedDocs, setStagedDocs] = useState({});
  const [validationError, setValidationError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  /* Modal state */
  const [kycOpen, setKycOpen] = useState(false);
  const [docsOpen, setDocsOpen] = useState(false);
  const [requestUpdateOpen, setRequestUpdateOpen] = useState(false);
  const [previewDoc, setPreviewDoc] = useState(null);

  useEffect(() => {
    loadKycStatus();
  }, []);

  async function loadKycStatus() {
    setLoading(true);
    try {
      const data = await parentsService.getKycStatus();
      setKyc(data);
    } catch (err) {
      setError(err?.message || "Failed to load KYC status");
    } finally {
      setLoading(false);
    }
  }

  /* File staging handler with validation */
  const handleStageFile = (documentType, file) => {
    setValidationError(null);
    if (!file) return;

    // Validate type
    if (!ALLOWED_MIME_TYPES.includes(file.type) && !/\.(pdf|jpg|jpeg|png)$/i.test(file.name)) {
      setValidationError(`Invalid file type: "${file.name}". Allowed formats: PDF, JPG, JPEG, PNG.`);
      return;
    }

    // Validate size
    if (file.size > MAX_FILE_SIZE_BYTES) {
      setValidationError(`File too large: "${file.name}" (${formatBytes(file.size)}). Maximum size allowed is 5 MB.`);
      return;
    }

    const previewUrl = URL.createObjectURL(file);
    setStagedDocs((prev) => ({
      ...prev,
      [documentType]: {
        documentType,
        file,
        fileName: file.name,
        fileSize: file.size,
        mimeType: file.type || (file.name.endsWith(".pdf") ? "application/pdf" : "image/jpeg"),
        previewUrl,
      },
    }));
  };

  const handleRemoveStaged = (documentType) => {
    setStagedDocs((prev) => {
      const next = { ...prev };
      if (next[documentType]?.previewUrl) {
        URL.revokeObjectURL(next[documentType].previewUrl);
      }
      delete next[documentType];
      return next;
    });
  };

  /* Batch Submit KYC Package */
  async function handleKycSubmit(notes) {
    const stagedList = Object.values(stagedDocs);
    setIsSubmitting(true);
    setUploadProgress(10);
    try {
      // 1. Upload all staged files in batch to Cloudinary via backend API
      if (stagedList.length > 0) {
        setUploadProgress(30);
        await parentsService.uploadBatchDocuments(kyc.parentId, stagedList);
        setUploadProgress(70);
      }

      // 2. Submit KYC package for review
      await parentsService.submitKyc(notes);
      setUploadProgress(100);

      // Clean up object URLs
      stagedList.forEach((item) => {
        if (item.previewUrl) URL.revokeObjectURL(item.previewUrl);
      });
      setStagedDocs({});

      await loadKycStatus();
      setKycOpen(false);
    } catch (err) {
      alert(err?.message || "Failed to submit KYC package");
    } finally {
      setIsSubmitting(false);
      setUploadProgress(0);
    }
  }

  async function handleRequestUpdateSubmit(reason) {
    try {
      await parentsService.requestDocumentUpdate(reason);
      alert("Document update request submitted successfully for administrator review.");
      setRequestUpdateOpen(false);
      await loadKycStatus();
    } catch (err) {
      alert(err?.message || "Failed to submit document update request");
    }
  }

  if (loading) return <PageSkeleton />;

  if (error) return (
    <div className="rounded-2xl border border-red-100 bg-red-50 p-8 text-center text-red-700">
      <FiAlertCircle className="mx-auto mb-3 h-12 w-12" />
      <h2 className="text-lg font-bold">Error Loading KYC</h2>
      <p className="mt-1">{error}</p>
      <Button className="mt-4" onClick={loadKycStatus}>Retry</Button>
    </div>
  );

  const isApproved = kyc.kycStatus === "APPROVED";
  const isRejected = kyc.kycStatus === "REJECTED";
  const isReuploadRequired = kyc.kycStatus === "RE_UPLOAD_REQUIRED";
  const canSubmit = kyc.kycStatus === "PENDING" || isRejected || isReuploadRequired;

  const summaryCards = [
    { label: "KYC Status", value: kyc.kycStatus, sub: isApproved ? "One-Time Complete" : isRejected ? "Re-upload Required" : "Verification Pending", accent: isApproved ? "border-l-green-500" : isRejected ? "border-l-red-500" : "border-l-amber-500", iconBg: isApproved ? "bg-green-50 text-green-600" : isRejected ? "bg-red-50 text-red-600" : "bg-amber-50 text-amber-600" },
    { label: "Compliance Status", value: kyc.complianceStatus, sub: isApproved ? "Compliant & Verified" : "Action Needed", accent: isApproved ? "border-l-emerald-500" : "border-l-amber-500", iconBg: "bg-emerald-50 text-emerald-600" },
    { label: "Submitted Date", value: formatDate(kyc.lastKycDate), sub: kyc.lastKycDate ? "Package Submitted" : "Not Submitted", accent: "border-l-indigo-500", iconBg: "bg-indigo-50 text-indigo-600" },
    { label: "Verified Date", value: formatDate(kyc.kycApprovedAt), sub: isApproved ? "Verification Granted" : "Pending Verification", accent: "border-l-violet-500", iconBg: "bg-violet-50 text-violet-600" },
    { label: "Trust Score", value: `${kyc.trustScore}/100`, sub: kyc.trustScore >= 70 ? "High Trust Rating" : "Standard Rating", accent: "border-l-blue-500", iconBg: "bg-blue-50 text-blue-600" },
  ];

  return (
    <div className="space-y-5">
      <Breadcrumb items={["Parent", "KYC Verification"]} />

      {/* Page Header */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-card dark:border-slate-800 dark:bg-slate-900">
        <div className="flex flex-col justify-between gap-4 px-6 py-5 sm:flex-row sm:items-center">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-civic-50 text-civic-600 dark:bg-civic-500/10 dark:text-civic-400">
              <FiShield className="h-6 w-6" />
            </div>
            <div>
              <p className="section-eyebrow">Pre-Adoption Background Check</p>
              <h1 className="page-title">Identity Verification (KYC)</h1>
              <p className="page-subtitle">One-Time Identity &amp; Background Verification prior to adoption</p>
            </div>
          </div>
          <div className="flex shrink-0 flex-wrap gap-2">
            {canSubmit && (
              <Button icon={FiRefreshCw} onClick={() => setKycOpen(true)}>
                Submit KYC Package
              </Button>
            )}
            {isApproved && (
              <Button icon={FiLock} variant="secondary" onClick={() => setRequestUpdateOpen(true)}>
                Request Document Update
              </Button>
            )}
            <Button icon={FiEye} variant="secondary" onClick={() => setDocsOpen(true)}>
              View Documents
            </Button>
          </div>
        </div>
      </motion.div>

      {/* Rejection / Re-upload Alert Banner */}
      {(isRejected || isReuploadRequired) && (
        <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} className="rounded-2xl border border-red-200 bg-red-50/90 p-5 dark:border-red-900/40 dark:bg-red-950/30 text-red-900 dark:text-red-200 shadow-sm space-y-2">
          <div className="flex items-center gap-2.5 font-bold text-base text-red-950 dark:text-red-100">
            <FiAlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400 shrink-0" />
            <span>KYC Verification Action Required</span>
          </div>
          <p className="text-sm font-semibold opacity-95">
            Remarks from Administrator: <span className="font-bold underline">{kyc.kycRejectionReason || kyc.rejectionReason || "Please review and re-upload your verification documents."}</span>
          </p>
          <p className="text-xs opacity-80">
            Select the required document type below, stage your updated file, preview it, and click <span className="font-bold underline">Submit KYC Package</span> to resubmit for approval.
          </p>
        </motion.div>
      )}

      {/* Summary Metric Cards */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {summaryCards.map((card, i) => (
          <div key={i} className={classNames("rounded-2xl border border-gray-100 bg-white p-5 shadow-sm border-l-4 dark:bg-slate-900 dark:border-slate-800", card.accent)}>
            <div className="flex justify-between items-start">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">{card.label}</p>
                <p className="mt-1 text-lg font-extrabold text-slate-900 dark:text-white">{card.value}</p>
                <p className="mt-0.5 text-[11px] text-slate-400">{card.sub}</p>
              </div>
              <div className={classNames("h-8 w-8 rounded-lg flex items-center justify-center shrink-0", card.iconBg)}>
                <FiCheckCircle className="h-4 w-4" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Main Grid */}
      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        <div className="space-y-6">
          {/* Identity Verification Main Card */}
          <IdentityVerificationCard kyc={kyc} onViewDocs={() => setDocsOpen(true)} onRequestUpdate={() => setRequestUpdateOpen(true)} />

          {/* Document Staging & Preview Section */}
          <KycStagingSection
            kyc={kyc}
            stagedDocs={stagedDocs}
            validationError={validationError}
            onStage={handleStageFile}
            onRemove={handleRemoveStaged}
            onPreview={setPreviewDoc}
            onSubmitPackage={() => setKycOpen(true)}
          />

          {/* Verification History */}
          <VerificationHistory history={kyc.verificationHistory} />
        </div>

        {/* Right Sidebar: Status & Document Summary */}
        <div className="space-y-6">
          <IdentityStatusSummaryPanel kyc={kyc} onViewDocs={() => setDocsOpen(true)} stagedCount={Object.keys(stagedDocs).length} />
        </div>
      </div>

      {/* Modals */}
      <SubmitKycModal
        open={kycOpen}
        onClose={() => setKycOpen(false)}
        onConfirm={handleKycSubmit}
        stagedCount={Object.keys(stagedDocs).length}
        existingCount={kyc.documents?.length || 0}
        isSubmitting={isSubmitting}
        uploadProgress={uploadProgress}
      />
      <RequestUpdateModal open={requestUpdateOpen} onClose={() => setRequestUpdateOpen(false)} onConfirm={handleRequestUpdateSubmit} />
      <ViewDocsModal open={docsOpen} onClose={() => setDocsOpen(false)} docs={kyc.documents} onPreview={setPreviewDoc} />

      <AnimatePresence>
        {previewDoc && (
          <DocumentPreviewModal doc={previewDoc} onClose={() => setPreviewDoc(null)} />
        )}
      </AnimatePresence>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════
   COMPONENTS
 ═══════════════════════════════════════════════════════════ */

/* ── Identity Verification Card ─────────────────────────── */
function IdentityVerificationCard({ kyc, onViewDocs, onRequestUpdate }) {
  const isApproved = kyc.kycStatus === "APPROVED";
  const docsSubmittedCount = kyc.documents?.length || 0;
  const docsRequiredCount = kyc.requiredDocuments?.length || 0;

  return (
    <Section
      title="Identity Verification Profile"
      icon={FiShield}
      action={
        <Button icon={FiEye} variant="secondary" size="sm" onClick={onViewDocs}>
          View Documents
        </Button>
      }
    >
      <div className="p-6 space-y-6">
        {/* Profile Avatar & Status Banner */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between rounded-xl bg-slate-50 p-4 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-civic-600 text-xl font-bold text-white shadow-sm">
              {kyc.parentAvatar || "P"}
            </div>
            <div>
              <h3 className="text-base font-extrabold text-slate-900 dark:text-white">{kyc.parentName}</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">Parent ID: {kyc.parentId}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">{kyc.email}</p>
            </div>
          </div>
          <div className="flex flex-col items-start sm:items-end gap-1.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Verification Status</span>
            <StatusBadge status={kyc.kycStatus} />
          </div>
        </div>

        {/* Required Verification Fields */}
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          <InfoField label="Identity Verification" value={isApproved ? "Verified One-Time" : "Pending Verification"} icon={FiShield} accent={isApproved} />
          <InfoField label="Status" value={kyc.kycStatus} icon={FiCheckCircle} />
          <InfoField label="Submitted Date" value={formatDate(kyc.lastKycDate)} icon={FiCalendar} />
          <InfoField label="Verified Date" value={formatDate(kyc.kycApprovedAt)} icon={FiUserCheck} />
          <InfoField label="Verified By" value={kyc.verifiedBy || (isApproved ? "Central Authority Admin" : "Pending Review")} icon={FiUser} />
          <InfoField label="Documents Submitted" value={`${docsSubmittedCount} of ${docsRequiredCount} Files`} icon={FiFileText} />
        </div>

        {/* Lock / Update Notice */}
        {isApproved ? (
          <div className="flex items-start gap-3 rounded-xl border border-green-200 bg-green-50/70 p-4 text-emerald-900 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-300">
            <FiLock className="h-5 w-5 shrink-0 text-emerald-600 dark:text-emerald-400 mt-0.5" />
            <div className="flex-1 text-xs">
              <p className="font-bold text-sm text-emerald-900 dark:text-emerald-200">KYC Verification Completed</p>
              <p className="mt-0.5 opacity-90">Your identity and background verification is complete (One-Time Verification). Documents are locked for security. If you need to revise any document, submit a formal request.</p>
            </div>
            <Button size="sm" variant="secondary" icon={FiLock} onClick={onRequestUpdate}>Request Update</Button>
          </div>
        ) : (
          <div className="flex items-center gap-3 rounded-xl border border-amber-200 bg-amber-50/70 p-4 text-amber-900 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-300 text-xs">
            <FiInfo className="h-5 w-5 shrink-0 text-amber-600 dark:text-amber-400" />
            <p><span className="font-bold">Verification Pending:</span> Stage required identity documents below, view their previews, and click <span className="font-bold underline">Submit KYC Package</span>.</p>
          </div>
        )}
      </div>
    </Section>
  );
}

/* ── Document Staging & Preview Section ──────────────────── */
function KycStagingSection({ kyc, stagedDocs, validationError, onStage, onRemove, onPreview, onSubmitPackage }) {
  const isApproved = kyc.kycStatus === "APPROVED";
  const [selectedType, setSelectedType] = useState(kyc.missingDocuments?.[0] || "AADHAAR_CARD");

  const stagedList = Object.values(stagedDocs);
  const requiredTypes = kyc.requiredDocuments || ["AADHAAR_CARD", "PAN_CARD", "INCOME_PROOF", "ADDRESS_PROOF", "PHOTO_ID"];

  return (
    <Section title="Required Documents & Staged Uploads" icon={FiUpload}>
      <div className="p-6 space-y-6">
        {/* Required Documents Pills */}
        <div>
          <label className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2 block">Required Verification Documents</label>
          <div className="flex flex-wrap gap-2">
            {requiredTypes.map((d) => {
              const hasUploaded = kyc.documents?.some((doc) => doc.documentType === d && doc.status !== "REJECTED");
              const hasStaged = !!stagedDocs[d];
              return (
                <span
                  key={d}
                  className={classNames(
                    "px-3 py-1.5 rounded-xl text-xs font-bold border flex items-center gap-1.5 transition",
                    hasUploaded
                      ? "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-300"
                      : hasStaged
                      ? "border-indigo-200 bg-indigo-50 text-indigo-800 dark:border-indigo-500/30 dark:bg-indigo-500/10 dark:text-indigo-300"
                      : "border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-300"
                  )}
                >
                  {hasUploaded ? <FiCheckCircle className="h-3.5 w-3.5 text-emerald-600" /> : hasStaged ? <FiClock className="h-3.5 w-3.5 text-indigo-600" /> : <FiAlertTriangle className="h-3.5 w-3.5 text-amber-600" />}
                  {DOCUMENT_TYPE_LABELS[d] || d.replace(/_/g, " ")}
                  {hasStaged && <span className="ml-1 text-[10px] bg-indigo-200 dark:bg-indigo-900 px-1.5 py-0.5 rounded">Staged</span>}
                </span>
              );
            })}
          </div>
        </div>

        {/* Validation Error Alert */}
        {validationError && (
          <div className="flex items-center gap-2.5 rounded-xl border border-red-200 bg-red-50 p-3.5 text-xs font-bold text-red-700 dark:border-red-900/30 dark:bg-red-950/30 dark:text-red-300">
            <FiAlertCircle className="h-4 w-4 shrink-0 text-red-600" />
            <span>{validationError}</span>
          </div>
        )}

        {/* File Selection Bar (Disabled if Approved) */}
        {!isApproved ? (
          <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50/50 p-4 dark:border-slate-800 dark:bg-slate-900/50 space-y-3">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">Select Document to Stage &amp; Preview</p>
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="block text-[11px] font-bold text-slate-500 mb-1">1. Document Type</label>
                <select
                  value={selectedType}
                  onChange={(e) => setSelectedType(e.target.value)}
                  className="input-field w-full text-xs font-semibold"
                >
                  {Object.entries(DOCUMENT_TYPE_LABELS).map(([key, label]) => (
                    <option key={key} value={key}>{label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-500 mb-1">2. Choose File (PDF/JPG/PNG, Max 5MB)</label>
                <input
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={(e) => {
                    if (e.target.files?.[0]) {
                      onStage(selectedType, e.target.files[0]);
                      e.target.value = "";
                    }
                  }}
                  className="text-xs text-slate-500 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-civic-600 file:text-white hover:file:bg-civic-700 cursor-pointer w-full"
                />
              </div>
            </div>
            <p className="text-[11px] text-slate-400">
              * Note: Files are verified and previewed locally first. Upload to cloud server occurs only when you click <span className="font-bold underline">Submit KYC Package</span>.
            </p>
          </div>
        ) : (
          <div className="rounded-xl border border-slate-100 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950 flex items-center justify-between text-xs text-slate-500">
            <span className="flex items-center gap-2 font-bold text-slate-700 dark:text-slate-300">
              <FiLock className="h-4 w-4 text-emerald-600" />
              Document selection is locked for verified profiles.
            </span>
          </div>
        )}

        {/* Staged Cards Grid */}
        {stagedList.length > 0 && (
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-extrabold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                Staged Documents Ready for Submission ({stagedList.length})
              </h4>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              {stagedList.map((doc) => (
                <div
                  key={doc.documentType}
                  className="relative flex flex-col justify-between rounded-xl border border-indigo-200 bg-indigo-50/40 p-4 shadow-sm dark:border-indigo-900/50 dark:bg-indigo-950/20"
                >
                  <div className="space-y-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className="inline-flex items-center gap-1 text-[11px] font-extrabold text-indigo-700 dark:text-indigo-300 uppercase tracking-wider">
                        <FiFileText className="h-3.5 w-3.5" />
                        {DOCUMENT_TYPE_LABELS[doc.documentType] || doc.documentType}
                      </span>
                      <span className="text-[10px] font-bold text-slate-400">{formatBytes(doc.fileSize)}</span>
                    </div>
                    <p className="text-xs font-bold text-slate-900 dark:text-white truncate" title={doc.fileName}>
                      {doc.fileName}
                    </p>
                  </div>

                  <div className="mt-4 flex items-center justify-between border-t border-indigo-100 pt-3 dark:border-indigo-900/40">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => onPreview({ url: doc.previewUrl, originalName: doc.fileName, documentType: doc.documentType, mimeType: doc.mimeType })}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-white text-indigo-700 border border-indigo-200 hover:bg-indigo-50 dark:bg-slate-800 dark:text-indigo-300 dark:border-indigo-800 transition"
                      >
                        <FiEye className="h-3.5 w-3.5" /> View
                      </button>

                      <label className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-white text-slate-700 border border-slate-200 hover:bg-slate-50 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700 transition cursor-pointer">
                        <FiEdit2 className="h-3.5 w-3.5" /> Replace
                        <input
                          type="file"
                          accept=".pdf,.jpg,.jpeg,.png"
                          className="hidden"
                          onChange={(e) => {
                            if (e.target.files?.[0]) {
                              onStage(doc.documentType, e.target.files[0]);
                              e.target.value = "";
                            }
                          }}
                        />
                      </label>
                    </div>

                    <button
                      type="button"
                      onClick={() => onRemove(doc.documentType)}
                      className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg transition"
                      title="Remove from staging"
                    >
                      <FiTrash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-end pt-2">
              <Button icon={FiUpload} onClick={onSubmitPackage}>
                Submit KYC Package ({stagedList.length} Files)
              </Button>
            </div>
          </div>
        )}
      </div>
    </Section>
  );
}

/* ── Verification History ────────────────────────────────── */
function VerificationHistory({ history }) {
  const cleanHistory = history?.filter((h) => {
    if (!h) return false;
    // Exclude individual draft/pending unreviewed document upload entries
    if (h.status === 'UPLOADED' || h.status === 'PENDING' || h.status === 'Draft / Pending') return false;
    return Boolean(h.attemptNumber || h.status === 'APPROVED' || h.status === 'REJECTED' || h.status === 'SUBMITTED' || h.status === 'UNDER_REVIEW' || h.status === 'RE_UPLOAD_REQUIRED');
  });

  return (
    <Section title="Verification Audit Trail & History" icon={FiClock}>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 dark:bg-slate-800 text-slate-500 font-bold text-xs uppercase tracking-wider">
            <tr>
              <th className="p-3.5">Verification Activity</th>
              <th className="p-3.5">Status</th>
              <th className="p-3.5">Date</th>
              <th className="p-3.5">Audit Remarks & Notes</th>
            </tr>
          </thead>
          <tbody className="divide-y dark:divide-slate-800">
            {cleanHistory?.map((h, i) => {
              const label = h.attemptNumber
                ? `KYC Submission Package (Attempt #${h.attemptNumber})`
                : (DOCUMENT_TYPE_LABELS[h.type] || h.type?.replace(/_/g, " ") || "Document Upload");

              const noteText = typeof h.notes === 'string'
                ? h.notes
                : h.reviewedBy
                ? `Verified by ${h.reviewedBy}`
                : h.fileName
                ? `File: ${h.fileName}`
                : "Record logged";

              return (
                <tr key={h.id || i} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition">
                  <td className="p-3.5">
                    <div className="flex items-center gap-2.5">
                      <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-800 text-civic-600 dark:text-civic-400 font-bold shrink-0">
                        <FiFileText className="h-3.5 w-3.5" />
                      </div>
                      <span className="font-bold text-slate-900 dark:text-white text-xs">{label}</span>
                    </div>
                  </td>
                  <td className="p-3.5"><StatusBadge status={h.status} /></td>
                  <td className="p-3.5 text-xs font-medium text-slate-500 dark:text-slate-400">{formatDate(h.date)}</td>
                  <td className="p-3.5 text-xs text-slate-600 dark:text-slate-300 max-w-xs truncate" title={noteText}>
                    {noteText}
                  </td>
                </tr>
              );
            })}
            {(!cleanHistory || cleanHistory.length === 0) && (
              <tr>
                <td colSpan="4" className="p-8 text-center text-slate-400 dark:text-slate-500">
                  <FiClock className="mx-auto mb-2 h-8 w-8 opacity-40" />
                  <p className="text-xs font-bold text-slate-600 dark:text-slate-400">No verification activity logged yet</p>
                  <p className="text-[11px] mt-0.5">Your KYC package submission attempts and audit reviews will appear here.</p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </Section>
  );
}

/* ── Right Panel: Identity Status & Documents Summary ────── */
function IdentityStatusSummaryPanel({ kyc, onViewDocs, stagedCount }) {
  const isApproved = kyc.kycStatus === "APPROVED";

  return (
    <div className="space-y-4">
      {/* Identity Verification Summary Box */}
      <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-card dark:border-slate-800 dark:bg-slate-900 space-y-4">
        <div className="flex items-center gap-2.5 border-b border-slate-100 pb-3 dark:border-slate-800">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-civic-50 text-civic-600 dark:bg-civic-500/10 dark:text-civic-400">
            <FiShield className="h-4 w-4" />
          </div>
          <h3 className="font-bold text-sm text-slate-900 dark:text-white">Identity Verification Summary</h3>
        </div>

        <div className="space-y-3 text-xs">
          <div className="flex justify-between items-center py-1 border-b border-slate-50 dark:border-slate-800/50">
            <span className="text-slate-500">Identity Verification</span>
            <span className="font-bold text-slate-900 dark:text-white">{isApproved ? "Verified (One-Time)" : "Pending"}</span>
          </div>
          <div className="flex justify-between items-center py-1 border-b border-slate-50 dark:border-slate-800/50">
            <span className="text-slate-500">Status</span>
            <StatusBadge status={kyc.kycStatus} />
          </div>
          <div className="flex justify-between items-center py-1 border-b border-slate-50 dark:border-slate-800/50">
            <span className="text-slate-500">Submitted Date</span>
            <span className="font-bold text-slate-900 dark:text-white">{formatDate(kyc.lastKycDate)}</span>
          </div>
          <div className="flex justify-between items-center py-1 border-b border-slate-50 dark:border-slate-800/50">
            <span className="text-slate-500">Verified Date</span>
            <span className="font-bold text-slate-900 dark:text-white">{formatDate(kyc.kycApprovedAt)}</span>
          </div>
          <div className="flex justify-between items-center py-1 border-b border-slate-50 dark:border-slate-800/50">
            <span className="text-slate-500">Staged Documents</span>
            <span className="font-bold text-indigo-600 dark:text-indigo-400">{stagedCount} Ready</span>
          </div>
          <div className="flex justify-between items-center py-1">
            <span className="text-slate-500">Cloud Storage</span>
            <span className="font-bold text-emerald-600 dark:text-emerald-400">Cloudinary Encrypted</span>
          </div>
        </div>

        <Button fullWidth variant="secondary" icon={FiEye} onClick={onViewDocs}>
          View Submitted Documents
        </Button>
      </div>

      {/* Security Info Card */}
      <div className="rounded-2xl border border-blue-100 bg-blue-50/50 p-4 dark:border-blue-900/30 dark:bg-blue-950/20 text-xs text-blue-900 dark:text-blue-200 space-y-2">
        <div className="flex items-center gap-2 font-bold text-sm text-blue-950 dark:text-blue-100">
          <FiInfo className="h-4 w-4 text-blue-600" />
          Production KYC Policy
        </div>
        <p className="leading-relaxed opacity-90">
          All document uploads are processed securely via memory buffers directly to Cloudinary storage. No binary files are stored on local servers. Once approved, documents are locked against edits.
        </p>
      </div>
    </div>
  );
}

/* ── Modals ──────────────────────────────────────────────── */

function SubmitKycModal({ open, onClose, onConfirm, stagedCount, existingCount, isSubmitting, uploadProgress }) {
  const [notes, setNotes] = useState("");
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm">
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4">
        <h3 className="text-lg font-bold text-slate-900 dark:text-white">Submit KYC Package</h3>
        <p className="text-xs text-slate-500">
          You are submitting <span className="font-bold text-indigo-600 dark:text-indigo-400">{stagedCount} staged file(s)</span> along with existing documents for central administrator verification.
        </p>

        {isSubmitting ? (
          <div className="space-y-3 py-4">
            <div className="flex items-center justify-between text-xs font-bold text-indigo-600">
              <span>Uploading to Cloud Storage…</span>
              <span>{uploadProgress}%</span>
            </div>
            <div className="h-2.5 w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
              <div className="h-full bg-civic-600 transition-all duration-300" style={{ width: `${uploadProgress}%` }} />
            </div>
          </div>
        ) : (
          <>
            <textarea
              className="input-field w-full h-24 resize-none text-xs"
              placeholder="Optional notes for the reviewer (e.g. Updating address proof)..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
            <div className="flex gap-3">
              <Button variant="secondary" fullWidth onClick={onClose}>Cancel</Button>
              <Button fullWidth onClick={() => onConfirm(notes)} icon={FiUpload}>Confirm Submission</Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function RequestUpdateModal({ open, onClose, onConfirm }) {
  const [reason, setReason] = useState("");
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm">
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4">
        <h3 className="text-lg font-bold text-slate-900 dark:text-white">Request Document Update</h3>
        <p className="text-xs text-slate-500">Specify why you need to update or replace your verified identity documents.</p>
        <textarea
          className="input-field w-full h-24 resize-none text-xs"
          placeholder="Reason for update (e.g. Address changed, Passport renewed)..."
          value={reason}
          onChange={(e) => setReason(e.target.value)}
        />
        <div className="flex gap-3">
          <Button variant="secondary" fullWidth onClick={onClose}>Cancel</Button>
          <Button fullWidth disabled={!reason.trim()} onClick={() => onConfirm(reason)}>Send Request</Button>
        </div>
      </div>
    </div>
  );
}

function ViewDocsModal({ open, onClose, docs, onPreview }) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm">
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 max-w-2xl w-full shadow-2xl space-y-4">
        <div className="flex justify-between items-center border-b border-slate-100 pb-3 dark:border-slate-800">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">Submitted Identity Documents</h3>
          <Button variant="ghost" icon={FiX} onClick={onClose} className="px-2" />
        </div>

        <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-1">
          {docs?.map((doc) => (
            <div key={doc.id} className="flex items-center justify-between p-3.5 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40">
              <div className="flex items-center gap-3">
                <FiFileText className="h-5 w-5 text-civic-600 shrink-0" />
                <div>
                  <p className="text-xs font-bold text-slate-900 dark:text-white">
                    {DOCUMENT_TYPE_LABELS[doc.documentType] || doc.documentType?.replace(/_/g, " ")}
                  </p>
                  <p className="text-[10px] text-slate-400 truncate max-w-xs">{doc.fileName}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <StatusBadge status={doc.status} />
                <button
                  type="button"
                  onClick={() => onPreview({ url: doc.storageUrl, originalName: doc.fileName, documentType: doc.documentType, mimeType: doc.mimeType })}
                  className="p-2 rounded-lg text-slate-400 hover:text-civic-600 hover:bg-white dark:hover:bg-slate-800 transition"
                  title="Preview Document"
                >
                  <FiEye className="h-4 w-4" />
                </button>
                {doc.storageUrl && (
                  <a
                    href={doc.storageUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="p-2 rounded-lg text-slate-400 hover:text-civic-600 hover:bg-white dark:hover:bg-slate-800 transition"
                    title="Download File"
                  >
                    <FiDownload className="h-4 w-4" />
                  </a>
                )}
              </div>
            </div>
          ))}

          {(!docs || docs.length === 0) && (
            <p className="text-center py-10 text-slate-400 text-sm">No documents submitted yet.</p>
          )}
        </div>
      </div>
    </div>
  );
}

/* ── Document Preview Modal (PDF & Image Viewer) ───────── */
function DocumentPreviewModal({ doc, onClose }) {
  if (!doc) return null;

  const url = doc.storageUrl || doc.url || doc.previewUrl;
  const docName = doc.originalName || doc.fileName || doc.name || DOCUMENT_TYPE_LABELS[doc.documentType] || "Document";
  const isPdf = doc.mimeType?.includes("pdf") || url?.toLowerCase().endsWith(".pdf") || docName?.toLowerCase().endsWith(".pdf");

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm">
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="w-full max-w-4xl rounded-2xl border border-white/70 bg-white p-5 shadow-2xl dark:border-white/10 dark:bg-slate-900 space-y-4 flex flex-col max-h-[90vh]"
      >
        <div className="flex items-center justify-between border-b border-slate-100 pb-3 dark:border-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            <FiFileText className="h-5 w-5 text-civic-600" />
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">{docName}</h3>
              <p className="text-xs text-slate-400">{DOCUMENT_TYPE_LABELS[doc.documentType] || doc.documentType || "Document Preview"}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {url && (
              <a
                href={url}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl bg-civic-50 text-civic-700 hover:bg-civic-100 transition"
              >
                <FiExternalLink className="h-3.5 w-3.5" />
                Open / Download
              </a>
            )}
            <Button variant="ghost" icon={FiX} onClick={onClose} className="px-2" />
          </div>
        </div>

        {/* Content Viewer Container */}
        <div className="flex-1 min-h-[450px] overflow-hidden rounded-xl bg-slate-100 dark:bg-slate-950 flex items-center justify-center p-2">
          {url ? (
            isPdf ? (
              <iframe
                src={url}
                title={docName}
                className="w-full h-full min-h-[500px] rounded-lg border-0"
              />
            ) : (
              <img
                src={url}
                alt={docName}
                className="max-h-[65vh] w-auto max-w-full rounded-lg shadow-md object-contain"
              />
            )
          ) : (
            <div className="text-center py-12 text-slate-400 text-sm">
              <FiFileText className="h-10 w-10 mx-auto mb-2 opacity-50" />
              Document URL is not available.
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
