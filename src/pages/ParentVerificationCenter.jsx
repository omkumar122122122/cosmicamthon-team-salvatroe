import { useCallback, useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useForm } from "react-hook-form";
import {
  FiAlertTriangle,
  FiCheck,
  FiCheckCircle,
  FiClock,
  FiDownload,
  FiEye,
  FiFileText,
  FiFilter,
  FiMail,
  FiMessageSquare,
  FiPhone,
  FiSearch,
  FiSend,
  FiShield,
  FiSlash,
  FiUserCheck,
  FiX,
  FiExternalLink
} from "react-icons/fi";
import Breadcrumb from "../components/Breadcrumb";
import Button from "../components/Button";
import { classNames } from "../utils/formatters";
import { parentsService } from "../services/parentsService";

const summaryConfig = [
  ["Pending Parents", "Pending", FiClock],
  ["Verified Parents", "Verified", FiUserCheck],
  ["Rejected Applications", "Rejected", FiSlash],
  ["High Risk Profiles", "High Risk", FiAlertTriangle],
  ["Open Issues", "Open Issues", FiMessageSquare],
  ["Today's Requests", "Today", FiFileText]
];

const filters = ["All", "Pending", "Verified", "Rejected", "Under Review", "High Risk"];
const sortOptions = ["Newest", "Oldest", "Highest Risk"];
const riskStyles = {
  Low: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  Medium: "bg-amber-50 text-amber-700 ring-amber-200",
  High: "bg-red-50 text-red-700 ring-red-200"
};
const statusStyles = {
  Pending: "bg-amber-50 text-amber-700 ring-amber-200",
  Verified: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  Rejected: "bg-red-50 text-red-700 ring-red-200",
  "Under Review": "bg-blue-50 text-blue-700 ring-blue-200",
  "Re-upload Required": "bg-amber-50 text-amber-700 ring-amber-200",
  Approved: "bg-emerald-50 text-emerald-700 ring-emerald-200"
};

// Shape mapper: convert backend ParentBasicDto → local component shape
function mapToLocal(p) {
  return {
    id: p.id,
    name: p.name ?? "Unknown",
    dob: p.dateOfBirth ?? "",
    gender: p.gender ?? "",
    occupation: p.occupation ?? "",
    income: p.annualIncome ? `INR ${Number(p.annualIncome).toLocaleString("en-IN")}` : "Not provided",
    familyMembers: "",
    phone: p.phone ?? "",
    email: p.email ?? "",
    address: "",
    emergencyContact: "",
    registeredAt: p.registeredAt ? new Date(p.registeredAt).toISOString().slice(0, 10) : "",
    kycStatus: p.kycStatus ?? "PENDING",
    trustScore: p.trustScore ?? 0,
    status: p.verificationStatus === "APPROVED" ? "Verified" : p.verificationStatus === "REJECTED" ? "Rejected" : p.verificationStatus === "UNDER_REVIEW" ? "Under Review" : p.kycStatus === "RE_UPLOAD_REQUIRED" ? "Re-upload Required" : "Pending",
    issueStatus: "Open",
    riskLevel: (p.trustScore ?? 0) < 50 ? "High" : (p.trustScore ?? 0) < 75 ? "Medium" : "Low",
    photo: (p.name ?? "?").split(" ").map(n => n[0]).join("").slice(0, 2),
    recommendation: "",
    documents: p.documents || [],
    ai: { faceMatch: "N/A", ocrMatch: "N/A", identityMatch: "N/A", documentAuthenticity: "N/A", duplicateAccount: "N/A", backgroundCheck: "N/A", blacklistCheck: "N/A", phone: "N/A", email: "N/A" },
    issues: [],
    _backendId: p.id,
  };
}

export default function ParentVerificationCenter() {
  const [parents, setParents] = useState([]);
  const [selectedParent, setSelectedParent] = useState(null);
  const [apiLoading, setApiLoading] = useState(true);
  const [detailOpen, setDetailOpen] = useState(false);
  const [activeModal, setActiveModal] = useState(null);
  const [previewDoc, setPreviewDoc] = useState(null);
  const [toast, setToast] = useState(null);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("All");
  const [sort, setSort] = useState("Newest");
  const [searching, setSearching] = useState(false);
  const [pagination, setPagination] = useState({ page: 1, limit: 50, total: 0, totalPages: 0 });

  useEffect(() => {
    loadVerificationQueue();
  }, [pagination.page, pagination.limit]);

  async function loadVerificationQueue() {
    setApiLoading(true);
    try {
      const result = await parentsService.getVerificationQueue({
        page: pagination.page,
        limit: pagination.limit
      });
      const items = result?.data ?? [];
      const mapped = items.map(mapToLocal);
      setParents(mapped);
      if (mapped.length > 0 && !selectedParent) {
        setSelectedParent(mapped[0]);
      }
      if (result?.pagination) {
        setPagination(prev => ({
          ...prev,
          total: result.pagination.total,
          totalPages: result.pagination.totalPages
        }));
      }
    } catch (err) {
      console.error('Failed to load verification queue:', err);
      setParents([]);
    } finally {
      setApiLoading(false);
    }
  }

  const stats = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10);
    return {
      Pending: parents.filter((parent) => parent.status === "Pending" || parent.status === "Under Review" || parent.verificationStatus === "UNDER_REVIEW" || parent.verificationStatus === "PENDING" || parent.kycStatus === "SUBMITTED" || parent.kycStatus === "UNDER_REVIEW").length,
      Verified: parents.filter((parent) => parent.status === "Verified" || parent.status === "Approved" || parent.verificationStatus === "APPROVED" || parent.kycStatus === "APPROVED").length,
      Rejected: parents.filter((parent) => parent.status === "Rejected" || parent.verificationStatus === "REJECTED" || parent.kycStatus === "REJECTED").length,
      "High Risk": parents.filter((parent) => parent.riskLevel === "High").length,
      "Open Issues": parents.reduce((total, parent) => total + (parent.issues?.filter((issue) => issue.status !== "Closed" && issue.status !== "Resolved").length || 0), 0),
      Today: parents.filter((parent) => parent.registeredAt === today).length
    };
  }, [parents]);

  const filteredParents = useMemo(() => {
    const term = search.trim().toLowerCase();
    const result = parents.filter((parent) => {
      const matchesTerm = [parent.name, parent.id, parent.email, parent.phone].some((value) => value.toLowerCase().includes(term));
      const matchesFilter = filter === "All"
        || parent.status === filter
        || (filter === "Verified" && (parent.status === "Verified" || parent.kycStatus === "APPROVED" || parent.verificationStatus === "APPROVED"))
        || (filter === "Rejected" && (parent.status === "Rejected" || parent.kycStatus === "REJECTED" || parent.verificationStatus === "REJECTED"))
        || (filter === "Pending" && (parent.status === "Pending" || parent.status === "Under Review" || parent.verificationStatus === "UNDER_REVIEW" || parent.verificationStatus === "PENDING" || parent.kycStatus === "SUBMITTED" || parent.kycStatus === "UNDER_REVIEW"))
        || (filter === "Under Review" && (parent.status === "Under Review" || parent.verificationStatus === "UNDER_REVIEW" || parent.kycStatus === "SUBMITTED" || parent.kycStatus === "UNDER_REVIEW"))
        || (filter === "High Risk" && parent.riskLevel === "High");
      return matchesTerm && matchesFilter;
    });

    return [...result].sort((a, b) => {
      if (sort === "Oldest") return new Date(a.registeredAt) - new Date(b.registeredAt);
      if (sort === "Highest Risk") return a.trustScore - b.trustScore;
      return new Date(b.registeredAt) - new Date(a.registeredAt);
    });
  }, [filter, parents, search, sort]);

  const handleSearch = (value) => {
    setSearch(value);
    setSearching(true);
    window.setTimeout(() => setSearching(false), 450);
  };

  const notify = (message) => {
    setToast(message);
    window.setTimeout(() => setToast(null), 2600);
  };

  const openDetails = async (parent) => {
    setSelectedParent(parent);
    setDetailOpen(true);
    if (parent._backendId) {
      try {
        const details = await parentsService.getVerificationDetails(parent._backendId);
        if (details) {
          const merged = {
            ...parent,
            name: `${details.user?.firstName || ''} ${details.user?.lastName || ''}`.trim() || parent.name,
            dob: details.dateOfBirth ? new Date(details.dateOfBirth).toLocaleDateString("en-IN") : parent.dob,
            gender: details.gender || parent.gender,
            occupation: details.occupation || parent.occupation,
            income: details.annualIncome ? `INR ${Number(details.annualIncome).toLocaleString("en-IN")}` : parent.income,
            address: details.addresses?.[0] ? `${details.addresses[0].addressLine1}, ${details.addresses[0].city}, ${details.addresses[0].state}` : parent.address,
            phone: details.user?.phone || details.alternatePhone || parent.phone,
            email: details.user?.email || parent.email,
            documents: details.documents || [],
            verifiedBy: details.verifiedBy ? `${details.verifiedBy.firstName} ${details.verifiedBy.lastName}` : null,
            verifiedAt: details.verifiedAt,
            kycSubmittedAt: details.kycSubmittedAt,
          };
          setSelectedParent(merged);
        }
      } catch (err) {
        console.error('Failed to fetch full details:', err);
      }
    }
  };

  const handleApproveParent = async () => {
    if (!selectedParent?._backendId) return;
    try {
      await parentsService.approveParent(selectedParent._backendId);
      notify("Parent Approved Successfully");
      setActiveModal(null);
      await loadVerificationQueue();
    } catch (err) {
      alert(err?.message || "Failed to approve parent");
    }
  };

  const handleRejectParent = async (reasonData) => {
    if (!selectedParent?._backendId) return;
    const reasonText = `${reasonData.reason}${reasonData.comments ? ': ' + reasonData.comments : ''}`;
    try {
      await parentsService.rejectParent(selectedParent._backendId, reasonText);
      notify("Application Rejected");
      setActiveModal(null);
      await loadVerificationQueue();
    } catch (err) {
      alert(err?.message || "Failed to reject application");
    }
  };

  const handleRequestReupload = async (data) => {
    if (!selectedParent?._backendId) return;
    const selectedTypes = Object.keys(data).filter((k) => data[k] === true && k !== 'reason');
    try {
      await parentsService.requestReupload(selectedParent._backendId, data.reason || 'Re-upload required', selectedTypes);
      notify("Re-upload Request Sent to Parent");
      setActiveModal(null);
      await loadVerificationQueue();
    } catch (err) {
      alert(err?.message || "Failed to request re-upload");
    }
  };

  return (
    <div className="space-y-6">
      <Breadcrumb items={["Admin", "Parent Verification"]} />
      <PageHeader stats={stats} />

      <div className="grid gap-6 xl:grid-cols-[1fr_320px]">
        <div className="space-y-6">
          <SummaryCards stats={stats} />
          <FilterBar search={search} onSearch={handleSearch} filter={filter} setFilter={setFilter} sort={sort} setSort={setSort} searching={searching} />
          <ParentTable
            parents={filteredParents}
            loading={searching || apiLoading}
            onView={openDetails}
            onApprove={(parent) => {
              setSelectedParent(parent);
              setActiveModal("approve");
            }}
            onReject={(parent) => {
              setSelectedParent(parent);
              setActiveModal("reject");
            }}
            onQuery={(parent) => {
              setSelectedParent(parent);
              setActiveModal("documents");
            }}
          />
        </div>
        <RightSidebar parents={parents} />
      </div>

      <AnimatePresence>
        {detailOpen && (
          <DetailModal
            parent={selectedParent}
            onClose={() => setDetailOpen(false)}
            onAction={setActiveModal}
            onPreviewDoc={setPreviewDoc}
            notify={notify}
          />
        )}
      </AnimatePresence>

      <ActionModal
        type={activeModal}
        parent={selectedParent}
        onClose={() => setActiveModal(null)}
        onApprove={handleApproveParent}
        onReject={handleRejectParent}
        onDocuments={handleRequestReupload}
      />

      <AnimatePresence>
        {previewDoc && (
          <DocumentPreviewModal doc={previewDoc} onClose={() => setPreviewDoc(null)} />
        )}
      </AnimatePresence>

      <AnimatePresence>{toast && <NotificationToast message={toast} />}</AnimatePresence>
    </div>
  );
}

function PageHeader({ stats }) {
  const headerStats = [
    ["Today's Registrations", stats.Today],
    ["Pending Verification", stats.Pending],
    ["Approved", stats.Verified],
    ["Rejected", stats.Rejected],
  ];

  return (
    <section className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-card dark:border-slate-800 dark:bg-slate-900">
      <div className="flex flex-col gap-5 px-6 py-6 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="section-eyebrow">Secure Identity Verification Workflow</p>
          <h1 className="mt-1 page-title">Parent Verification &amp; Approval Center</h1>
          <p className="page-subtitle">Review, validate and securely approve parent registrations.</p>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {headerStats.map(([label, value]) => (
            <div key={label} className="rounded-xl border border-slate-100 bg-slate-50 px-4 py-3 dark:border-slate-700 dark:bg-slate-800">
              <p className="text-xl font-bold tabular-nums text-slate-900 dark:text-white">{value}</p>
              <p className="mt-0.5 text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">{label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function SummaryCards({ stats }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {summaryConfig.map(([label, key, Icon]) => (
        <motion.div
          key={label}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-5 shadow-card dark:border-slate-800 dark:bg-slate-900"
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">{label}</p>
              <p className="mt-2 text-3xl font-bold tabular-nums text-slate-900 dark:text-white">{stats[key]}</p>
            </div>
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-civic-50 text-civic-600 dark:bg-civic-500/10 dark:text-civic-400">
              <Icon className="h-5 w-5" />
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
}

function FilterBar({ search, onSearch, filter, setFilter, sort, setSort, searching }) {
  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white shadow-card dark:border-slate-800 dark:bg-slate-900">
      <div className="border-b border-slate-100 px-6 py-4 dark:border-slate-800">
        <h3 className="flex items-center gap-2 text-sm font-bold text-slate-900 dark:text-white">
          <FiFilter className="h-4 w-4 text-slate-400" />
          Search &amp; Filter
        </h3>
      </div>
      <div className="space-y-5 p-6">
        <div>
          <span className="mb-2 block text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
            Search by name, ID, email or phone
          </span>
          <div className="flex min-h-[42px] items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-4 transition focus-within:border-civic-500 focus-within:ring-2 focus-within:ring-civic-500/15 dark:border-slate-700 dark:bg-slate-800">
            <FiSearch className="h-4 w-4 shrink-0 text-slate-400" />
            <input
              value={search}
              onChange={(e) => onSearch(e.target.value)}
              className="w-full bg-transparent text-sm text-slate-900 outline-none placeholder:text-slate-400 dark:text-white dark:placeholder:text-slate-500"
              placeholder="Search parent records…"
            />
            {searching && <span className="h-2 w-2 animate-ping rounded-full bg-civic-500" />}
          </div>
        </div>

        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="min-w-0">
            <span className="mb-2 block text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
              Status Filter
            </span>
            <div className="flex flex-wrap gap-2">
              {filters.map((item) => (
                <button
                  key={item}
                  onClick={() => setFilter(item)}
                  className={classNames(
                    "rounded-lg px-3 py-1.5 text-xs font-semibold transition",
                    filter === item
                      ? "bg-civic-600 text-white shadow-sm"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
                  )}
                >
                  {item}
                </button>
              ))}
            </div>
          </div>
          <div className="shrink-0">
            <span className="mb-2 block text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
              Sort By
            </span>
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value)}
              className="min-h-[38px] w-44 rounded-xl border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 outline-none focus:border-civic-500 focus:ring-2 focus:ring-civic-500/15 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            >
              {sortOptions.map((item) => <option key={item}>{item}</option>)}
            </select>
          </div>
        </div>
      </div>
    </div>
  );
}

function ParentTable({ parents, loading, onView, onApprove, onReject, onQuery }) {
  if (loading) return <SkeletonTable />;

  return (
    <div className="section-card">
      <div className="section-card-header">
        <div>
          <h2 className="section-card-title">Parent Registration Queue</h2>
          <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">Registration → AI Verification → Admin Review → Approval / Rejection → Account Activated</p>
        </div>
      </div>
      {parents.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-[1080px] divide-y divide-slate-200 text-left dark:divide-slate-800">
            <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500 dark:bg-slate-950/70 dark:text-slate-400">
              <tr>
                {["Photo", "Parent ID", "Name", "Registration Date", "KYC Status", "AI Trust Score", "Verification Status", "Actions"].map((heading) => (
                  <th key={heading} className="px-4 py-3 font-bold">
                    {heading}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {parents.map((parent) => (
                <tr key={parent.id} className="align-top transition hover:bg-civic-50/50 dark:hover:bg-slate-800/60">
                  <td className="px-4 py-4">
                    <Avatar initials={parent.photo} risk={parent.riskLevel} />
                  </td>
                  <td className="px-4 py-4 text-sm font-bold text-slate-900 dark:text-white">{parent.id}</td>
                  <td className="px-4 py-4">
                    <p className="text-sm font-bold text-slate-950 dark:text-white">{parent.name}</p>
                    <p className="text-xs text-slate-500">{parent.email}</p>
                  </td>
                  <td className="px-4 py-4 text-sm text-slate-600 dark:text-slate-300">{parent.registeredAt}</td>
                  <td className="px-4 py-4">
                    <Badge label={parent.kycStatus} />
                  </td>
                  <td className="px-4 py-4">
                    <TrustMeter score={parent.trustScore} />
                  </td>
                  <td className="px-4 py-4">
                    <Badge label={parent.status} className={statusStyles[parent.status]} />
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex flex-wrap gap-2">
                      <IconButton label="View Dossier" icon={FiEye} onClick={() => onView(parent)} />
                      <IconButton label="Approve" icon={FiCheckCircle} onClick={() => onApprove(parent)} />
                      <IconButton label="Reject" icon={FiSlash} onClick={() => onReject(parent)} danger />
                      <IconButton label="Request Re-upload" icon={FiMessageSquare} onClick={() => onQuery(parent)} />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function DetailModal({ parent, onClose, onAction, onPreviewDoc, notify }) {
  const { register, handleSubmit } = useForm({ defaultValues: { notes: "" } });
  const submitNotes = () => notify("Internal Remarks Saved");

  return (
    <motion.div className="fixed inset-0 z-50 bg-slate-950/60 p-3 backdrop-blur-sm sm:p-5" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      <motion.div
        className="mx-auto flex h-full max-w-7xl flex-col overflow-hidden rounded-xl border border-white/70 bg-slate-50 shadow-2xl dark:border-white/10 dark:bg-slate-950"
        initial={{ y: 28, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 28, opacity: 0 }}
      >
        <div className="flex items-center justify-between gap-4 border-b border-slate-200 bg-white px-5 py-4 dark:border-slate-800 dark:bg-slate-900">
          <div className="min-w-0">
            <p className="text-xs font-bold uppercase tracking-wide text-civic-600 dark:text-civic-100">Secure Parent Identity Dossier</p>
            <h2 className="truncate text-xl font-extrabold text-slate-950 dark:text-white">{parent.name}</h2>
          </div>
          <Button variant="ghost" icon={FiX} onClick={onClose} className="px-3" aria-label="Close verification dossier" />
        </div>

        <div className="flex-1 overflow-y-auto p-5">
          <div className="grid gap-5 xl:grid-cols-[1fr_0.85fr]">
            <Section title="Parent Profile Information">
              <div className="flex flex-col gap-4 md:flex-row">
                <Avatar initials={parent.photo} risk={parent.riskLevel} large />
                <InfoGrid
                  items={[
                    ["Parent ID", parent.id],
                    ["Name", parent.name],
                    ["DOB", parent.dob],
                    ["Gender", parent.gender],
                    ["Occupation", parent.occupation],
                    ["Income", parent.income],
                    ["Phone", parent.phone],
                    ["Email", parent.email],
                    ["Address", parent.address || "Not provided"],
                  ]}
                />
              </div>
            </Section>

            <Section title="AI Verification Summary">
              <div className="grid gap-3 sm:grid-cols-2">
                <MetricCard label="Overall Trust Score" value={`${parent.trustScore}/100`} highlight />
                <MetricCard label="Risk Level" value={parent.riskLevel} />
                <MetricCard label="KYC Status" value={parent.kycStatus} />
                <MetricCard label="Verification Status" value={parent.status} />
              </div>
            </Section>

            <Section title="Identity Verification & Uploaded Documents">
              <div className="space-y-4">
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  <MetricCard label="Identity Verification" value={parent.status === "Verified" || parent.status === "Approved" ? "Verified (One-Time)" : "Pending Verification"} highlight />
                  <MetricCard label="Status" value={parent.status} />
                  <MetricCard label="Submitted Date" value={parent.registeredAt || "—"} />
                  <MetricCard label="Verified Date" value={parent.verifiedAt ? new Date(parent.verifiedAt).toLocaleDateString("en-IN") : (parent.status === "Verified" ? "Verified" : "—")} />
                  <MetricCard label="Verified By" value={parent.verifiedBy || (parent.status === "Verified" ? "Administrator" : "Pending Review")} />
                  <MetricCard label="Documents Submitted" value={`${parent.documents?.length || 0} Documents`} />
                </div>

                {/* Document Cards with PDF & Image Preview support */}
                {parent.documents && parent.documents.length > 0 ? (
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 pt-2">
                    {parent.documents.map((doc, idx) => {
                      const docName = typeof doc === 'string' ? doc : (doc.originalName || doc.fileName || doc.documentType?.replace(/_/g, ' '));
                      const docUrl = typeof doc === 'object' ? doc.storageUrl : null;
                      const docType = typeof doc === 'object' ? doc.documentType : doc;
                      return (
                        <DocumentCard
                          key={doc.id || idx}
                          name={docName}
                          docType={docType}
                          url={docUrl}
                          status={doc.status}
                          onPreview={() => onPreviewDoc(typeof doc === 'object' ? doc : { name: docName, storageUrl: docUrl })}
                        />
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-xs text-slate-400 py-4 text-center">No documents attached yet.</p>
                )}
              </div>
            </Section>

            <Section title="Admin Verification Remarks">
              <form onSubmit={handleSubmit(submitNotes)} className="space-y-3">
                <textarea
                  {...register("notes")}
                  rows={4}
                  className="w-full rounded-lg border border-slate-200 bg-white p-3 text-sm outline-none focus:ring-2 focus:ring-civic-500 dark:border-slate-800 dark:bg-slate-950 dark:text-white"
                  placeholder="Internal remarks for verification officers..."
                />
                <Button type="submit" icon={FiFileText} size="sm">Save Internal Remarks</Button>
              </form>
            </Section>
          </div>
        </div>

        {/* Action Buttons Bar */}
        <div className="flex flex-wrap gap-3 border-t border-slate-200 bg-white px-5 py-4 dark:border-slate-800 dark:bg-slate-900">
          <Button icon={FiUserCheck} onClick={() => onAction("approve")}>Approve Parent</Button>
          <Button variant="danger" icon={FiSlash} onClick={() => onAction("reject")}>Reject Parent</Button>
          <Button variant="secondary" icon={FiFileText} onClick={() => onAction("documents")}>Request Re-upload</Button>
        </div>
      </motion.div>
    </motion.div>
  );
}

/* ── Action Modals: Approve, Reject with Remarks, Request Re-upload ── */
function ActionModal({ type, parent, onClose, onApprove, onReject, onDocuments }) {
  const { register, handleSubmit, watch } = useForm({ defaultValues: { declaration: false, reason: "Incomplete Documents", comments: "" } });
  if (!type || !parent) return null;

  const titles = {
    approve: "Approve Parent Application",
    reject: "Reject Parent Application",
    documents: "Request Document Re-upload"
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm">
      <motion.form
        onSubmit={handleSubmit(type === "approve" ? onApprove : type === "reject" ? onReject : onDocuments)}
        initial={{ scale: 0.96, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="w-full max-w-lg rounded-2xl border border-white/70 bg-white p-6 shadow-2xl dark:border-white/10 dark:bg-slate-900 space-y-4"
      >
        <div className="flex items-center justify-between gap-3 border-b border-slate-100 pb-3 dark:border-slate-800">
          <h3 className="text-lg font-extrabold text-slate-950 dark:text-white">{titles[type]}</h3>
          <Button type="button" variant="ghost" icon={FiX} onClick={onClose} className="px-2" />
        </div>

        {type === "approve" && (
          <div className="space-y-4">
            <div className="rounded-xl bg-slate-50 p-4 dark:bg-slate-800 text-xs space-y-1">
              <p className="font-bold text-slate-900 dark:text-white">{parent.name} ({parent.id})</p>
              <p className="text-slate-500">{parent.email}</p>
            </div>
            <label className="flex items-start gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3.5 text-xs font-semibold text-slate-700 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-200">
              <input type="checkbox" {...register("declaration", { required: true })} className="mt-0.5 rounded" />
              I confirm that parent identity documents and background checks have been verified.
            </label>
            <div className="flex gap-3 pt-2">
              <Button type="button" variant="secondary" fullWidth onClick={onClose}>Cancel</Button>
              <Button type="submit" fullWidth icon={FiCheckCircle} disabled={!watch("declaration")}>Approve Parent</Button>
            </div>
          </div>
        )}

        {type === "reject" && (
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">Rejection Reason</label>
              <select {...register("reason")} className="input-field w-full">
                {["Incomplete Documents", "Identity Mismatch", "Invalid Address Proof", "Fraud / Fake Documents", "High Risk Profile", "Other"].map((r) => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">Rejection Remarks for Parent</label>
              <textarea
                {...register("comments")}
                rows={4}
                required
                className="input-field w-full resize-none"
                placeholder="Detailed rejection remarks explaining what went wrong..."
              />
            </div>
            <div className="flex gap-3 pt-2">
              <Button type="button" variant="secondary" fullWidth onClick={onClose}>Cancel</Button>
              <Button type="submit" variant="danger" fullWidth icon={FiSlash}>Confirm Rejection</Button>
            </div>
          </div>
        )}

        {type === "documents" && (
          <div className="space-y-4">
            <p className="text-xs text-slate-500">Select which documents require re-upload by the parent:</p>
            <div className="grid gap-2 sm:grid-cols-2">
              {[
                ["AADHAAR_CARD", "Aadhaar Card"],
                ["PAN_CARD", "PAN Card"],
                ["INCOME_PROOF", "Income Proof"],
                ["ADDRESS_PROOF", "Address Proof"],
                ["PHOTO_ID", "Photo ID"],
                ["MARRIAGE_CERTIFICATE", "Marriage Certificate"]
              ].map(([key, label]) => (
                <label key={key} className="flex items-center gap-2.5 rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs font-bold text-slate-700 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-200 cursor-pointer">
                  <input type="checkbox" {...register(key)} className="rounded" />
                  {label}
                </label>
              ))}
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">Re-upload Instructions / Remarks</label>
              <textarea
                {...register("reason")}
                rows={3}
                required
                className="input-field w-full resize-none"
                placeholder="Explain why re-upload is required (e.g. Scans were blurry)..."
              />
            </div>
            <div className="flex gap-3 pt-2">
              <Button type="button" variant="secondary" fullWidth onClick={onClose}>Cancel</Button>
              <Button type="submit" fullWidth icon={FiSend}>Send Re-upload Request</Button>
            </div>
          </div>
        )}
      </motion.form>
    </div>
  );
}

/* ── Document Preview Modal (PDF & Image Viewer) ───────── */
function DocumentPreviewModal({ doc, onClose }) {
  if (!doc) return null;

  const url = doc.storageUrl || doc.url;
  const docName = doc.originalName || doc.fileName || doc.name || doc.documentType?.replace(/_/g, ' ') || 'Document';
  const isPdf = doc.mimeType?.includes('pdf') || url?.toLowerCase().endsWith('.pdf') || docName?.toLowerCase().endsWith('.pdf');

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
              <p className="text-xs text-slate-400">{doc.documentType?.replace(/_/g, ' ') || 'Document Preview'}</p>
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

function SidebarPanel({ title, items, icon: Icon, alert = false }) {
  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white shadow-card dark:border-slate-800 dark:bg-slate-900">
      <div className="flex items-center gap-2.5 border-b border-slate-100 px-5 py-3.5 dark:border-slate-800">
        <div className={classNames("flex h-7 w-7 shrink-0 items-center justify-center rounded-lg", alert ? "bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400" : "bg-civic-50 text-civic-600 dark:bg-civic-500/10 dark:text-civic-400")}>
          <Icon className="h-3.5 w-3.5" />
        </div>
        <h3 className="text-sm font-bold text-slate-900 dark:text-white">{title}</h3>
      </div>
      <div className="space-y-2 p-4">
        {items.length
          ? items.map((item) => (
            <p key={item} className="rounded-lg bg-slate-50 px-3 py-2.5 text-xs font-medium leading-snug text-slate-600 dark:bg-slate-800 dark:text-slate-300">{item}</p>
          ))
          : <p className="py-2 text-xs text-slate-400 dark:text-slate-500">No records</p>
        }
      </div>
    </div>
  );
}

function RightSidebar({ parents }) {
  const highRisk = parents.filter((parent) => parent.riskLevel === "High");
  const pending = parents.filter((parent) => parent.status === "Pending" || parent.status === "Under Review" || parent.status === "Re-upload Required");
  const approved = parents.filter((parent) => parent.status === "Verified" || parent.status === "Approved");

  return (
    <aside className="space-y-4 xl:sticky xl:top-40 xl:self-start">
      <SidebarPanel title="Recent Registrations" items={parents.slice(0, 3).map((parent) => `${parent.name} - ${parent.id}`)} icon={FiFileText} />
      <SidebarPanel title="Recent Approvals" items={approved.map((parent) => `${parent.name} - activated`)} icon={FiCheckCircle} />
      <SidebarPanel title="High Risk Alerts" items={highRisk.map((parent) => `${parent.name} - trust ${parent.trustScore}`)} icon={FiAlertTriangle} alert />
      <SidebarPanel title="Pending Reviews" items={pending.map((parent) => `${parent.name} - ${parent.status}`)} icon={FiClock} />
    </aside>
  );
}

function Section({ title, children }) {
  return (
    <section className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-card dark:border-slate-800 dark:bg-slate-900">
      <h3 className="mb-4 text-sm font-bold text-slate-900 dark:text-white">{title}</h3>
      {children}
    </section>
  );
}

function InfoGrid({ items }) {
  return (
    <div className="grid flex-1 gap-3 sm:grid-cols-2">
      {items.map(([label, value]) => (
        <div key={label} className="rounded-lg border border-slate-200 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-950">
          <p className="text-[11px] font-bold uppercase text-slate-500">{label}</p>
          <p className="mt-1 text-sm font-bold text-slate-900 dark:text-white">{value}</p>
        </div>
      ))}
    </div>
  );
}

function DocumentCard({ name, docType, url, status, onPreview }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 p-3.5 dark:border-slate-800 dark:bg-slate-950 flex flex-col justify-between">
      <div>
        <div className="flex items-start justify-between gap-2 mb-2">
          <FiFileText className="h-5 w-5 text-civic-600 shrink-0 mt-0.5" />
          <Badge label={status || "Uploaded"} className="text-[10px]" />
        </div>
        <p className="text-xs font-extrabold text-slate-950 dark:text-white truncate" title={name}>{name}</p>
        {docType && <p className="text-[10px] text-slate-400 mt-0.5">{docType.replace(/_/g, ' ')}</p>}
      </div>
      <div className="mt-3 flex items-center gap-2 pt-2 border-t border-slate-100 dark:border-slate-800/60">
        <button
          type="button"
          onClick={onPreview}
          className="flex-1 inline-flex items-center justify-center gap-1.5 py-1.5 text-xs font-bold rounded-lg bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-200 transition"
        >
          <FiEye className="h-3.5 w-3.5" /> Preview
        </button>
        {url && (
          <a
            href={url}
            target="_blank"
            rel="noreferrer"
            className="p-2 rounded-lg text-slate-400 hover:text-civic-600 hover:bg-white dark:hover:bg-slate-800 transition"
            title="Download Document"
          >
            <FiDownload className="h-4 w-4" />
          </a>
        )}
      </div>
    </div>
  );
}

function MetricCard({ label, value, highlight = false, wide = false }) {
  return (
    <div className={classNames("rounded-lg border border-slate-200 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-950", wide && "sm:col-span-2", highlight && "border-civic-200 bg-civic-50")}>
      <p className="text-[11px] font-bold uppercase text-slate-500">{label}</p>
      <p className="mt-1 text-sm font-extrabold text-slate-950 dark:text-white">{value}</p>
    </div>
  );
}

function Avatar({ initials, risk, large = false }) {
  return (
    <div className={classNames("flex shrink-0 items-center justify-center rounded-xl bg-civic-600 font-extrabold text-white shadow-sm", large ? "h-24 w-24 text-2xl" : "h-10 w-10 text-xs", risk === "High" && "bg-red-600")}>
      {initials}
    </div>
  );
}

function Badge({ label, className = "" }) {
  return <span className={classNames("inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-extrabold ring-1 ring-inset", className || "bg-slate-100 text-slate-700 ring-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:ring-slate-700")}>{label}</span>;
}

function TrustMeter({ score }) {
  const tone = score >= 80 ? "bg-emerald-500" : score >= 60 ? "bg-amber-500" : "bg-red-500";
  return (
    <div className="w-28">
      <div className="flex items-center justify-between text-xs font-bold text-slate-600 dark:text-slate-300">
        <span>{score}%</span>
        <span>AI</span>
      </div>
      <div className="mt-1 h-2 rounded-full bg-slate-200 dark:bg-slate-800">
        <div className={classNames("h-2 rounded-full", tone)} style={{ width: `${score}%` }} />
      </div>
    </div>
  );
}

function IconButton({ label, icon: Icon, danger = false, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={label}
      className={classNames(
        "inline-flex min-h-8 items-center gap-1.5 rounded-lg px-2.5 text-xs font-bold transition",
        danger ? "bg-red-50 text-red-700 hover:bg-red-100" : "bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
      )}
    >
      <Icon className="h-3.5 w-3.5" />
      <span>{label}</span>
    </button>
  );
}

function SkeletonTable() {
  return (
    <div className="section-card">
      <div className="section-card-header">
        <div className="flex items-center gap-2 text-sm font-semibold text-civic-600 dark:text-civic-400">
          <FiSearch className="h-4 w-4 animate-pulse" /> Searching verification records…
        </div>
      </div>
      <div className="space-y-3 p-5">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="skeleton h-14 rounded-xl" />
        ))}
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="p-12 text-center text-slate-400">
      <FiShield className="mx-auto mb-3 h-10 w-10 opacity-50" />
      <p className="font-bold text-sm text-slate-700 dark:text-slate-300">No parent verification records found</p>
      <p className="text-xs mt-1">Adjust your search or status filters to view parents.</p>
    </div>
  );
}

function NotificationToast({ message }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      className="fixed bottom-6 right-6 z-[80] flex items-center gap-3 rounded-2xl bg-slate-900 px-5 py-3.5 text-sm font-bold text-white shadow-2xl dark:bg-white dark:text-slate-900"
    >
      <FiCheckCircle className="h-5 w-5 text-emerald-400 dark:text-emerald-600" />
      {message}
    </motion.div>
  );
}
