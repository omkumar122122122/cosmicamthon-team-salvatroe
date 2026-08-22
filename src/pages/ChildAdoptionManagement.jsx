import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useForm } from "react-hook-form";
import {
  FiArchive,
  FiArrowRight,
  FiAward,
  FiCalendar,
  FiCheck,
  FiCheckCircle,
  FiClock,
  FiDownload,
  FiEye,
  FiFileText,
  FiHome,
  FiLink,
  FiRefreshCw,
  FiSave,
  FiSearch,
  FiShield,
  FiUploadCloud,
  FiUser,
  FiUsers,
  FiX,
} from "react-icons/fi";
import Button from "../components/Button";
import Breadcrumb from "../components/Breadcrumb";
import { adoptionsService } from "../services/adoptionsService";
import { useAuth } from "../context/AuthContext";

let parentRecord = {};
let childRecord = {};

const documentTemplates = [
  "Adoption Agreement",
  "Court Order",
  "Guardian Consent",
  "Identity Documents",
  "Medical Clearance",
  "Child Transfer Form",
  "Final Verification Letter",
  "Additional Documents",
];

const initialHistory = [];

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.06 } },
};

const item = {
  hidden: { opacity: 0, y: 14 },
  show: { opacity: 1, y: 0, transition: { duration: 0.35 } },
};

function todayLabel(date = new Date()) {
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}


function StatusBadge({ children, tone = "success" }) {
  const tones = {
    success: "badge-success",
    blue: "badge-blue",
    warning: "badge-warning",
    neutral: "badge-neutral",
  };

  return <span className={tones[tone]}>{children}</span>;
}

function SectionCard({ title, icon: Icon, children, action }) {
  return (
    <motion.section
      variants={item}
      className="rounded-2xl border border-gray-100 bg-white shadow-card dark:border-slate-800 dark:bg-slate-900"
    >
      <div className="flex flex-col gap-3 border-b border-gray-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between dark:border-slate-800">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-civic-50 text-civic-700 ring-1 ring-civic-100 dark:bg-civic-500/10 dark:text-civic-300 dark:ring-civic-500/20">
            <Icon className="h-5 w-5" />
          </span>
          <h2 className="text-base font-bold text-slate-900 dark:text-white">{title}</h2>
        </div>
        {action}
      </div>
      <div className="p-5">{children}</div>
    </motion.section>
  );
}

function Avatar({ initials, tone = "civic" }) {
  const tones = {
    civic: "from-civic-600 to-indigo-600",
    green: "from-emerald-600 to-cyan-600",
  };

  return (
    <div className={`flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br ${tones[tone]} text-2xl font-black text-white shadow-card`}>
      {initials}
    </div>
  );
}

function DetailGrid({ data }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {data.map(({ label, value }) => (
        <div key={label} className="field-block">
          <p className="field-label">{label}</p>
          <p className="field-value">{value}</p>
        </div>
      ))}
    </div>
  );
}

function ProfilePanel({ type, record, adopted, linkedParentName }) {
  const isParent = type === "parent";
  const fields = isParent
    ? [
        ["Parent ID", record.id],
        ["Age", record.age],
        ["Gender", record.gender],
        ["Email", record.email],
        ["Phone", record.phone],
        ["Address", record.address],
        ["Occupation", record.occupation],
        ["Annual Income", record.annualIncome],
        ["Family Members", record.familyMembers],
        ["KYC Status", record.kycStatus],
        ["AI Trust Score", record.aiTrustScore],
        ["Background Verification", record.backgroundVerification],
        ["Visit History", record.visitHistory],
        ["Adoption Eligibility", record.adoptionEligibility],
        ["Verification Badge", record.verificationBadge],
      ]
    : [
        ["Child ID", record.id],
        ["Age", record.age],
        ["Gender", record.gender],
        ["Blood Group", record.bloodGroup],
        ["Education", record.education],
        ["Medical Information", record.medicalInformation],
        ["Current Orphanage", record.currentOrphanage],
        ["Health Status", record.healthStatus],
        ["Current Adoption Status", adopted ? "Adopted" : record.adoptionStatus],
        ["AI Welfare Score", record.aiWelfareScore],
        ["Assigned Welfare Officer", record.assignedWelfareOfficer],
      ];

  return (
    <div className="rounded-2xl border border-gray-100 bg-slate-50/60 p-4 dark:border-slate-800 dark:bg-slate-950/40">
      <div className="mb-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <Avatar initials={record.photo} tone={isParent ? "civic" : "green"} />
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">
              {isParent ? "Verified Parent Profile" : "Eligible Child Profile"}
            </p>
            <h3 className="mt-1 text-xl font-bold text-slate-900 dark:text-white">{record.name}</h3>
            <div className="mt-2 flex flex-wrap gap-2">
              <StatusBadge>{isParent ? "Verified" : adopted ? "Adopted" : "Available"}</StatusBadge>
              <StatusBadge tone="blue">{isParent ? record.aiTrustScore : record.aiWelfareScore}</StatusBadge>
            </div>
          </div>
        </div>
        {!isParent && adopted && (
          <div className="rounded-2xl border border-green-200 bg-green-50 px-4 py-3 text-sm font-semibold text-green-700 dark:border-green-500/20 dark:bg-green-500/10 dark:text-green-300">
            Linked to {linkedParentName}
          </div>
        )}
      </div>
      <DetailGrid data={fields.map(([label, value]) => ({ label, value }))} />
    </div>
  );
}

function SkeletonBlock() {
  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-card dark:border-slate-800 dark:bg-slate-900">
      <div className="mb-5 flex items-center gap-4">
        <div className="skeleton h-16 w-16 rounded-2xl" />
        <div className="flex-1 space-y-2">
          <div className="skeleton h-4 w-1/3 rounded-full" />
          <div className="skeleton h-3 w-1/2 rounded-full" />
        </div>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        {Array.from({ length: 8 }).map((_, index) => (
          <div key={index} className="skeleton h-20 rounded-xl" />
        ))}
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="rounded-2xl border border-dashed border-gray-200 bg-white p-8 text-center shadow-card dark:border-slate-700 dark:bg-slate-900">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-300">
        <FiSearch className="h-6 w-6" />
      </div>
      <h3 className="mt-4 text-sm font-bold text-slate-900 dark:text-white">No verified adoption record loaded</h3>
      <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
        Enter the parent and child IDs, then verify details to load system records.
      </p>
    </div>
  );
}

function ToastStack({ toasts }) {
  return (
    <div className="fixed right-4 top-20 z-50 space-y-2">
      <AnimatePresence>
        {toasts.map((toast) => (
          <motion.div
            key={toast.id}
            initial={{ opacity: 0, x: 30, scale: 0.98 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 30, scale: 0.98 }}
            className="flex min-w-[260px] items-center gap-3 rounded-2xl border border-green-200 bg-white px-4 py-3 text-sm font-semibold text-slate-800 shadow-modal dark:border-green-500/20 dark:bg-slate-900 dark:text-slate-100"
          >
            <FiCheckCircle className="h-5 w-5 shrink-0 text-green-600" />
            {toast.message}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}

function SuccessModal({ open, adoptionId, onClose, completedRecord, parent, child }) {
  if (!open) return null;

  const updates = [
    'Child Status Updated to "Adopted"',
    "Parent Linked Successfully",
    "Adoption Record Created",
    "Welfare Monitoring Schedule Created",
    "First AI Welfare Verification Scheduled",
  ];

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <motion.div
          initial={{ opacity: 0, y: 18, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 18, scale: 0.98 }}
          className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-gray-100 bg-white shadow-modal dark:border-slate-800 dark:bg-slate-900"
        >
          <div className="flex items-start justify-between border-b border-gray-100 p-6 dark:border-slate-800">
            <div>
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-green-50 text-green-700 ring-1 ring-green-200 dark:bg-green-500/10 dark:text-green-300 dark:ring-green-500/20">
                <FiCheckCircle className="h-7 w-7" />
              </div>
              <h2 className="mt-4 text-2xl font-black text-slate-900 dark:text-white">Adoption Successfully Completed</h2>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Final legal adoption workflow has been closed and monitoring is active.</p>
            </div>
            <button
              onClick={onClose}
              className="flex h-9 w-9 items-center justify-center rounded-xl text-slate-500 transition hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
              aria-label="Close success modal"
            >
              <FiX className="h-5 w-5" />
            </button>
          </div>

          <div className="space-y-5 p-6">
            <div className="grid gap-3 sm:grid-cols-2">
              {[
                ["Adoption ID", adoptionId],
                ["Parent Name", completedRecord?.parent ?? parent?.name],
                ["Child Name", completedRecord?.child ?? child?.name],
                ["Adoption Date", completedRecord?.date ?? todayLabel()],
              ].map(([label, value]) => (
                <div key={label} className="field-block">
                  <p className="field-label">{label}</p>
                  <p className="field-value">{value}</p>
                </div>
              ))}
            </div>

            <div className="rounded-2xl border border-green-100 bg-green-50/70 p-4 dark:border-green-500/20 dark:bg-green-500/10">
              <p className="text-sm font-bold text-green-800 dark:text-green-200">System Updates</p>
              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                {updates.map((update) => (
                  <div key={update} className="flex items-center gap-2 text-sm font-semibold text-green-700 dark:text-green-300">
                    <FiCheck className="h-4 w-4 shrink-0" />
                    {update}
                  </div>
                ))}
              </div>
            </div>

            <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
              <Button variant="secondary" icon={FiDownload}>Download Adoption Certificate</Button>
              <Button variant="outline" icon={FiEye}>View Child Profile</Button>
              <Button icon={FiHome}>Go to Dashboard</Button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

export default function ChildAdoptionManagement() {
  const { user } = useAuth();
  const [adoptionId, setAdoptionId] = useState("");
  const [verified, setVerified] = useState(false);
  const [searching, setSearching] = useState(false);
  const [documents, setDocuments] = useState(
    documentTemplates.map((name) => ({
      name,
      fileName: "",
      progress: 0,
      status: "Pending",
    }))
  );
  const [declared, setDeclared] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [toasts, setToasts] = useState([]);
  const [history, setHistory] = useState(initialHistory);
  const [completedRecord, setCompletedRecord] = useState(null);

  const { register, handleSubmit, reset } = useForm({
    defaultValues: { parentId: "", childId: "" },
  });

  useEffect(() => {
    adoptionsService.getAll().then((result) => setHistory((result.data || []).map((entry) => ({
      id: entry.id, child: entry.child?.name || '—', parent: entry.parent?.name || '—',
      date: entry.completedDate ? todayLabel(new Date(entry.completedDate)) : 'Pending',
      status: entry.status === 'COMPLETED' ? 'Completed' : entry.status.replaceAll('_', ' '),
      nextCheck: entry.postAdoptionFollowUp1 ? new Date(entry.postAdoptionFollowUp1).toLocaleDateString('en-IN') : 'Pending',
    })))).catch(() => setHistory([]));
  }, []);

  const addToast = (message) => {
    const id = `${Date.now()}-${message}`;
    setToasts((current) => [...current, { id, message }]);
    window.setTimeout(() => {
      setToasts((current) => current.filter((toast) => toast.id !== id));
    }, 2600);
  };

  const uploadedCount = documents.filter((doc) => doc.status === "Verified").length;
  const allDocumentsUploaded = uploadedCount === documents.length;
  const workflowStage = completed ? 6 : allDocumentsUploaded && declared ? 5 : verified ? 4 : 1;
  const currentStatus = completed ? "Adoption Completed" : verified ? "Final Verification in Progress" : "Pending Verification";
  const eligibilityItems = ["Parent Verified", "Child Available for Adoption", "KYC Completed", "Visit Completed"];

  const summaryItems = useMemo(
    () => [
      { label: "Parent Verified", done: verified, icon: FiUser },
      { label: "Child Eligible", done: verified && !completed, icon: FiUsers },
      { label: "Documents Uploaded", done: allDocumentsUploaded, icon: FiFileText },
      { label: "AI Recommendation", done: verified, icon: FiShield, value: verified ? "Approved" : "Awaiting" },
      { label: "Current Workflow Stage", done: completed, icon: FiClock, value: completed ? "Adoption Completed" : `Step ${workflowStage} of 6` },
    ],
    [allDocumentsUploaded, completed, verified, workflowStage]
  );

  const onVerify = async ({ parentId, childId }) => {
    setSearching(true);
    try {
      const result = await adoptionsService.verify(parentId, childId);
      if (!result.eligible) throw new Error(result.blockers.join('. '));
      parentRecord = { ...result.parent, photo: result.parent.name.split(' ').map((name) => name[0]).join('').slice(0, 2), age: '—', gender: '—', occupation: 'Not provided', annualIncome: 'Not provided', familyMembers: '—', aiTrustScore: `${result.parent.trustScore} / 100`, backgroundVerification: result.parent.verificationStatus, visitHistory: `${result.completedVisits} completed visit(s)`, adoptionEligibility: 'Eligible for final adoption', verificationBadge: 'Government Verified Parent' };
      childRecord = { ...result.child, id: result.child.id, photo: result.child.name.split(' ').map((name) => name[0]).join('').slice(0, 2), education: 'Not provided', medicalInformation: 'Not provided', currentOrphanage: result.child.orphanageName, healthStatus: result.child.healthStatus, aiWelfareScore: 'Not available', assignedWelfareOfficer: 'Not assigned' };
      setAdoptionId(result.adoption?.id || "");
      setVerified(true);
      addToast('Eligibility verified');
    } catch (error) { addToast(error.message || 'Unable to verify adoption eligibility'); }
    finally { setSearching(false); }
  };

  const onReset = () => {
    reset({ parentId: "", childId: "" });
    parentRecord = {}; childRecord = {}; setAdoptionId("");
    setVerified(false);
    setSearching(false);
    setCompleted(false);
    setDeclared(false);
    setCompletedRecord(null);
    setDocuments(documentTemplates.map((name) => ({ name, fileName: "", progress: 0, status: "Pending" })));
  };

  const uploadDocument = async (index, file) => {
    if (!file) return;
    if (!declared) { addToast('Accept the legal declaration before uploading documents'); return; }
    setDocuments((current) => current.map((doc, docIndex) => docIndex === index ? { ...doc, fileName: file.name, progress: 40, status: "Uploading" } : doc));
    try {
      let recordId = adoptionId;
      if (!recordId) {
        const draft = await adoptionsService.create({ parentId: parentRecord.id, childId: childRecord.id, declarationAccepted: true });
        recordId = draft.id;
        setAdoptionId(recordId);
      }
      await adoptionsService.uploadDocument(recordId, documents[index].name, file);
      setDocuments((current) =>
        current.map((doc, docIndex) =>
          docIndex === index ? { ...doc, progress: 100, status: "Verified" } : doc
        )
      );
      addToast("Document uploaded");
    } catch (error) { setDocuments((current) => current.map((doc, docIndex) => docIndex === index ? { ...doc, progress: 0, status: 'Pending' } : doc)); addToast(error.message || 'Document upload failed'); }
  };

  const completeAdoption = async () => {
    if (!verified) {
      addToast("Verify parent and child details first");
      return;
    }

    if (!allDocumentsUploaded || !declared) {
      addToast("Complete document verification and declaration");
      return;
    }

    const record = {
      id: adoptionId,
      child: childRecord.name,
      parent: parentRecord.name,
      date: todayLabel(),
      status: user?.role === 'admin' ? "Completed" : "Under Review",
      nextCheck: "Pending approval",
    };
    try {
      if (user?.role === 'admin') await adoptionsService.updateStatus(adoptionId, { status: 'COMPLETED' });
    } catch (error) { addToast(error.message || 'Could not update adoption'); return; }
    const isAdmin = user?.role === 'admin';
    setCompleted(isAdmin);
    setCompletedRecord(record);
    setHistory((current) => [record, ...current.filter((entry) => entry.id !== adoptionId)]);
    setModalOpen(isAdmin);
    addToast(isAdmin ? "Adoption completed" : "Adoption submitted for admin approval");
  };

  const steps = [
    "Verify Parent",
    "Verify Child",
    "Review Details",
    "Upload Documents",
    "Final Approval",
    "Adoption Completed",
  ];

  return (
    <div className="min-h-full">
      <ToastStack toasts={toasts} />
      <SuccessModal
        open={modalOpen}
        adoptionId={adoptionId}
        onClose={() => setModalOpen(false)}
        completedRecord={completedRecord}
      />

      <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
        <Breadcrumb items={["Orphanage", "Child Adoption Management"]} />

        <motion.header
          variants={item}
          className="sticky top-0 z-20 rounded-2xl border border-gray-100 bg-white/95 p-5 shadow-card backdrop-blur-xl dark:border-slate-800 dark:bg-slate-900/95"
        >
          <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
            <div>
              <p className="section-eyebrow">Final Legal Adoption Workflow</p>
              <h1 className="mt-1 text-2xl font-black tracking-tight text-slate-900 dark:text-white">Child Adoption Management</h1>
              <p className="mt-1 max-w-3xl text-sm leading-6 text-slate-500 dark:text-slate-400">
                Complete and verify the legal adoption process by linking a verified parent with an eligible child.
              </p>
            </div>
            <div className="grid gap-2 sm:grid-cols-3 xl:min-w-[520px]">
              <div className="rounded-2xl border border-civic-100 bg-civic-50 px-4 py-3 dark:border-civic-500/20 dark:bg-civic-500/10">
                <p className="text-[10px] font-bold uppercase tracking-widest text-civic-700 dark:text-civic-300">Adoption Status</p>
                <p className="mt-1 text-sm font-bold text-slate-900 dark:text-white">{currentStatus}</p>
              </div>
              <div className="rounded-2xl border border-gray-100 bg-slate-50 px-4 py-3 dark:border-slate-700 dark:bg-slate-800">
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">Current Date</p>
                <p className="mt-1 text-sm font-bold text-slate-900 dark:text-white">{todayLabel()}</p>
              </div>
              <div className="rounded-2xl border border-green-100 bg-green-50 px-4 py-3 dark:border-green-500/20 dark:bg-green-500/10">
                <p className="text-[10px] font-bold uppercase tracking-widest text-green-700 dark:text-green-300">Adoption ID</p>
                <p className="mt-1 text-sm font-bold text-slate-900 dark:text-white">{adoptionId}</p>
              </div>
            </div>
          </div>
        </motion.header>

        <motion.div variants={item} className="rounded-2xl border border-gray-100 bg-white p-4 shadow-card dark:border-slate-800 dark:bg-slate-900">
          <div className="grid gap-3 md:grid-cols-3 xl:grid-cols-6">
            {steps.map((step, index) => {
              const number = index + 1;
              const active = number <= workflowStage;
              const done = completed || number < workflowStage;
              return (
                <div key={step} className="flex items-center gap-3 rounded-2xl border border-gray-100 bg-slate-50 px-3 py-3 dark:border-slate-800 dark:bg-slate-950/50">
                  <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-sm font-black ${active ? "bg-civic-600 text-white" : "bg-white text-slate-400 ring-1 ring-gray-200 dark:bg-slate-900 dark:ring-slate-700"}`}>
                    {done ? <FiCheck className="h-4 w-4" /> : number}
                  </span>
                  <p className={`text-sm font-bold ${active ? "text-slate-900 dark:text-white" : "text-slate-500 dark:text-slate-400"}`}>{step}</p>
                </div>
              );
            })}
          </div>
        </motion.div>

        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
          <main className="space-y-6">
            <SectionCard title="Search and Verify" icon={FiSearch}>
              <form onSubmit={handleSubmit(onVerify)} className="grid gap-4 lg:grid-cols-[1fr_1fr_auto] lg:items-end">
                <label className="block">
                  <span className="field-label">Parent ID</span>
                  <input className="input-field" {...register("parentId", { required: true })} />
                </label>
                <label className="block">
                  <span className="field-label">Child ID</span>
                  <input className="input-field" {...register("childId", { required: true })} />
                </label>
                <div className="flex flex-col gap-2 sm:flex-row lg:justify-end">
                  <Button type="submit" icon={FiShield} loading={searching}>Verify Details</Button>
                  <Button type="button" variant="secondary" icon={FiRefreshCw} onClick={onReset}>Reset</Button>
                </div>
              </form>
              {searching && (
                <div className="mt-4 flex items-center gap-3 rounded-2xl border border-civic-100 bg-civic-50 px-4 py-3 text-sm font-semibold text-civic-700 dark:border-civic-500/20 dark:bg-civic-500/10 dark:text-civic-300">
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  Searching verified parent, child, legal, and AI safety records
                </div>
              )}
            </SectionCard>

            {!verified && !searching && <EmptyState />}
            {searching && <SkeletonBlock />}

            <AnimatePresence>
              {verified && !searching && (
                <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 14 }} className="space-y-6">
                  <SectionCard title="Parent Details" icon={FiUser}>
                    <ProfilePanel type="parent" record={parentRecord} />
                  </SectionCard>

                  <SectionCard title="Child Details" icon={FiUsers}>
                    <ProfilePanel type="child" record={childRecord} adopted={completed} />
                  </SectionCard>

                  <SectionCard title="Eligibility Check" icon={FiCheckCircle}>
                    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                      {eligibilityItems.map((check) => (
                        <div key={check} className="flex items-center gap-3 rounded-2xl border border-green-100 bg-green-50/70 p-4 dark:border-green-500/20 dark:bg-green-500/10">
                          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-green-600 text-white">
                            <FiCheck className="h-4 w-4" />
                          </span>
                          <div>
                            <p className="text-sm font-bold text-slate-900 dark:text-white">{check}</p>
                            <StatusBadge>Complete</StatusBadge>
                          </div>
                        </div>
                      ))}
                    </div>
                  </SectionCard>

                  <SectionCard title="Document Upload" icon={FiUploadCloud}>
                    <div className="grid gap-4 md:grid-cols-2">
                      {documents.map((doc, index) => (
                        <div key={doc.name} className="rounded-2xl border border-gray-100 bg-slate-50/70 p-4 dark:border-slate-800 dark:bg-slate-950/40">
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <p className="text-sm font-bold text-slate-900 dark:text-white">{doc.name}</p>
                              <p className="mt-1 min-h-[18px] text-xs text-slate-500 dark:text-slate-400">{doc.fileName || "No file uploaded"}</p>
                            </div>
                            <StatusBadge tone={doc.status === "Verified" ? "success" : doc.status === "Uploading" ? "warning" : "neutral"}>{doc.status}</StatusBadge>
                          </div>
                          <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
                            <motion.div
                              className="h-full rounded-full bg-civic-600"
                              initial={false}
                              animate={{ width: `${doc.progress}%` }}
                              transition={{ duration: 0.35 }}
                            />
                          </div>
                          <div className="mt-4 flex items-center justify-between gap-3">
                            <span className="text-xs font-bold text-slate-500 dark:text-slate-400">{doc.progress}% uploaded</span>
                            <label className="cursor-pointer"><input className="hidden" type="file" accept="application/pdf,image/png,image/jpeg" onChange={(event) => uploadDocument(index, event.target.files?.[0])} disabled={doc.status === "Verified"} /><Button type="button" variant="secondary" icon={FiUploadCloud} disabled={doc.status === "Verified"}>Upload</Button></label>
                          </div>
                        </div>
                      ))}
                    </div>
                  </SectionCard>

                  <SectionCard title="Final Review" icon={FiAward}>
                    <div className="grid gap-4 lg:grid-cols-2">
                      <DetailGrid
                        data={[
                          { label: "Parent Information", value: `${parentRecord.name} (${parentRecord.id})` },
                          { label: "Child Information", value: `${childRecord.name} (${childRecord.id})` },
                          { label: "Relationship", value: completed ? "Legally linked adoptive parent" : "Pending final adoption linkage" },
                          { label: "Adoption Date", value: todayLabel() },
                          { label: "Linked Orphanage", value: childRecord.currentOrphanage },
                          { label: "Required Documents", value: `${uploadedCount} of ${documents.length} verified` },
                          { label: "Verification Status", value: allDocumentsUploaded ? "Ready for final approval" : "Document verification pending" },
                          { label: "Post-Adoption Monitoring", value: completed ? "Schedule initialized" : "Prepared after completion" },
                        ]}
                      />
                      <div className="rounded-2xl border border-gray-100 bg-slate-50/70 p-5 dark:border-slate-800 dark:bg-slate-950/40">
                        <p className="text-sm font-bold text-slate-900 dark:text-white">Terms and Declaration</p>
                        <label className="mt-4 flex cursor-pointer items-start gap-3 rounded-2xl border border-gray-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900">
                          <input
                            type="checkbox"
                            checked={declared}
                            onChange={(event) => setDeclared(event.target.checked)}
                            className="mt-1 h-4 w-4 rounded border-gray-300 text-civic-600 focus:ring-civic-500"
                          />
                          <span className="text-sm leading-6 text-slate-700 dark:text-slate-200">
                            I confirm all legal documents have been verified and the adoption process follows applicable child welfare guidelines.
                          </span>
                        </label>
                      </div>
                    </div>
                  </SectionCard>

                  <SectionCard title="Actions" icon={FiArchive}>
                    <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                      <Button variant="secondary" icon={FiSave} onClick={() => addToast("Draft Saved")}>Save Draft</Button>
                      <Button variant="outline" icon={FiFileText} onClick={() => addToast("Adoption Report Generated")}>Generate Adoption Report</Button>
                      <Button icon={FiCheckCircle} onClick={completeAdoption}>{user?.role === 'admin' ? 'Approve & Complete Adoption' : 'Submit for Admin Approval'}</Button>
                    </div>
                  </SectionCard>
                </motion.div>
              )}
            </AnimatePresence>

            <SectionCard title="Adoption History" icon={FiClock}>
              {history.length === 0 ? (
                <EmptyState />
              ) : (
                <div className="table-wrapper overflow-x-auto">
                  <table className="min-w-[820px] w-full">
                    <thead className="table-header">
                      <tr>
                        {["Adoption ID", "Child Name", "Parent Name", "Date", "Status", "Next Welfare Check", "Action"].map((heading) => (
                          <th key={heading} className="table-th">{heading}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 bg-white dark:divide-slate-800 dark:bg-slate-900">
                      {history.map((entry) => (
                        <tr key={entry.id} className="table-row">
                          <td className="table-td font-bold text-civic-700 dark:text-civic-300">{entry.id}</td>
                          <td className="table-td">{entry.child}</td>
                          <td className="table-td">{entry.parent}</td>
                          <td className="table-td">{entry.date}</td>
                          <td className="table-td"><StatusBadge tone={entry.status === "Completed" ? "success" : "blue"}>{entry.status}</StatusBadge></td>
                          <td className="table-td">{entry.nextCheck}</td>
                          <td className="table-td">
                            <Button variant="ghost" icon={FiArrowRight} className="min-h-[32px] px-3 py-1.5">Open</Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </SectionCard>
          </main>

          <motion.aside variants={item} className="space-y-4 xl:sticky xl:top-32 xl:self-start">
            <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-card dark:border-slate-800 dark:bg-slate-900">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-civic-50 text-civic-700 dark:bg-civic-500/10 dark:text-civic-300">
                  <FiShield className="h-5 w-5" />
                </span>
                <div>
                  <p className="section-eyebrow">Quick Summary</p>
                  <h2 className="text-base font-bold text-slate-900 dark:text-white">Workflow Health</h2>
                </div>
              </div>

              <div className="mt-5 space-y-3">
                {summaryItems.map(({ label, done, icon: Icon, value }) => (
                  <div key={label} className="flex items-center justify-between gap-3 rounded-2xl border border-gray-100 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-950/40">
                    <div className="flex min-w-0 items-center gap-3">
                      <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${done ? "bg-green-100 text-green-700 dark:bg-green-500/10 dark:text-green-300" : "bg-white text-slate-500 dark:bg-slate-900 dark:text-slate-400"}`}>
                        <Icon className="h-4 w-4" />
                      </span>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-bold text-slate-900 dark:text-white">{label}</p>
                        {value && <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">{value}</p>}
                      </div>
                    </div>
                    <StatusBadge tone={done ? "success" : "neutral"}>{done ? "Yes" : "No"}</StatusBadge>
                  </div>
                ))}
              </div>
            </div>

            {completed && (
              <div className="rounded-2xl border border-green-200 bg-green-50 p-5 shadow-card dark:border-green-500/20 dark:bg-green-500/10">
                <div className="flex items-center gap-3">
                  <FiLink className="h-5 w-5 text-green-700 dark:text-green-300" />
                  <p className="text-sm font-bold text-green-900 dark:text-green-100">Adoption Link Active</p>
                </div>
                <p className="mt-2 text-sm leading-6 text-green-800 dark:text-green-200">
                  {childRecord.name} is now linked to {parentRecord.name}. The next welfare check is scheduled for 08 Oct 2026.
                </p>
              </div>
            )}

            <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-card dark:border-slate-800 dark:bg-slate-900">
              <p className="text-sm font-bold text-slate-900 dark:text-white">Monitoring Schedule</p>
              <div className="mt-4 space-y-3">
                {[
                  ["First AI welfare verification", completed ? "08 Oct 2026" : "After final approval"],
                  ["Officer home visit", completed ? "15 Oct 2026" : "Pending adoption completion"],
                  ["Quarterly review", completed ? "08 Jan 2027" : "Pending adoption completion"],
                ].map(([label, value]) => (
                  <div key={label} className="flex gap-3">
                    <span className="mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                      <FiCalendar className="h-3.5 w-3.5" />
                    </span>
                    <div>
                      <p className="text-sm font-semibold text-slate-900 dark:text-white">{label}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">{value}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.aside>
        </div>
      </motion.div>
    </div>
  );
}
