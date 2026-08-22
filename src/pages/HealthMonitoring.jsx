import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FiHeart, FiUser, FiCalendar, FiAlertCircle, FiCheckCircle,
  FiClock, FiPlus, FiEdit2, FiTrash2, FiDownload, FiChevronDown,
  FiChevronUp, FiActivity, FiShield, FiInfo, FiX
} from "react-icons/fi";
import Breadcrumb from "../components/Breadcrumb";
import Button from "../components/Button";
import Modal from "../components/Modal";
import SearchBar from "../components/SearchBar";
import { useAuth } from "../context/AuthContext";
import { healthRecords, healthSummary } from "../data/dummyData";
import { classNames } from "../utils/formatters";

/* ── helpers ─────────────────────────────────────────────── */
function daysUntil(isoDate) {
  if (!isoDate) return null;
  const diff = new Date(isoDate) - new Date();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

function formatDate(iso) {
  if (!iso) return "—";
  return new Date(`${iso}T00:00:00`).toLocaleDateString("en-IN", {
    day: "numeric", month: "short", year: "numeric"
  });
}

const healthStatusCfg = {
  "Healthy":           { badge: "badge-success", dot: "bg-green-500"  },
  "Under Observation": { badge: "badge-warning", dot: "bg-amber-500"  },
  "Critical":          { badge: "badge-danger",  dot: "bg-red-500"    },
};

const vaccStatusCfg = {
  "Completed": { badge: "badge-success", label: "Completed" },
  "Pending":   { badge: "badge-warning", label: "Pending"   },
  "Overdue":   { badge: "badge-danger",  label: "Overdue"   },
};

const summaryCards = [
  { key: "totalChildren",   label: "Total Children",     accent: "border-l-civic-500",  iconBg: "bg-civic-50 text-civic-600 dark:bg-civic-500/10 dark:text-civic-400" },
  { key: "healthyChildren", label: "Healthy Children",   accent: "border-l-green-500",  iconBg: "bg-green-50 text-green-600 dark:bg-green-500/10 dark:text-green-400" },
  { key: "checkupsDue",     label: "Checkups Due",       accent: "border-l-amber-500",  iconBg: "bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400" },
  { key: "overdueCheckups", label: "Overdue Checkups",   accent: "border-l-red-500",    iconBg: "bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400"         },
  { key: "vaccinationsDue", label: "Vaccinations Due",   accent: "border-l-indigo-500", iconBg: "bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400" },
];

/* ── Main page component ─────────────────────────────────── */
export default function HealthMonitoring() {
  const { user } = useAuth();
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState(healthRecords[0]);
  const [addOpen, setAddOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [scheduleOpen, setScheduleOpen] = useState(false);
  const [expandedHistory, setExpandedHistory] = useState(true);
  const [expandedVacc, setExpandedVacc] = useState(true);
  const [records, setRecords] = useState(healthRecords);

  const filtered = records.filter((r) =>
    `${r.childName} ${r.childId}`.toLowerCase().includes(search.toLowerCase())
  );

  function handleDelete() {
    setRecords((prev) => prev.filter((r) => r.childId !== selected.childId));
    setSelected(records.find((r) => r.childId !== selected.childId) || null);
    setDeleteOpen(false);
  }

  return (
    <div className="space-y-5">
      <Breadcrumb items={["Orphanage", "Health Monitoring"]} />

      {/* Page header */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-card dark:border-slate-800 dark:bg-slate-900"
      >
        <div className="flex flex-col justify-between gap-4 px-6 py-5 sm:flex-row sm:items-center">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400">
              <FiHeart className="h-5 w-5" />
            </div>
            <div>
              <p className="section-eyebrow">Medical Welfare</p>
              <h1 className="page-title">Health Monitoring</h1>
              <p className="page-subtitle">Track child health records, checkups, vaccinations, and medical history.</p>
            </div>
          </div>
          <div className="flex shrink-0 flex-wrap gap-2">
            <Button icon={FiPlus} onClick={() => setAddOpen(true)}>Add Health Record</Button>
            <Button icon={FiDownload} variant="secondary">Download Report</Button>
          </div>
        </div>
      </motion.div>

      {/* Summary cards */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {summaryCards.map((cfg, i) => (
          <motion.div
            key={cfg.key}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className={classNames(
              "relative overflow-hidden rounded-2xl border border-gray-100 bg-white p-5 shadow-card dark:border-slate-800 dark:bg-slate-900 border-l-4",
              cfg.accent
            )}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">{cfg.label}</p>
                <p className="mt-2 text-2xl font-bold text-slate-900 dark:text-white">{healthSummary[cfg.key]}</p>
              </div>
              <div className={classNames("flex h-9 w-9 shrink-0 items-center justify-center rounded-xl", cfg.iconBg)}>
                <FiHeart className="h-4 w-4" />
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Child selector + detail layout */}
      <div className="grid gap-5 xl:grid-cols-[300px_1fr]">

        {/* Left — child list */}
        <div className="space-y-3">
          <SearchBar value={search} onChange={setSearch} placeholder="Search child…" />
          <div className="space-y-2">
            {filtered.length === 0 && (
              <p className="py-6 text-center text-sm text-slate-400 dark:text-slate-500">No records found.</p>
            )}
            {filtered.map((rec) => {
              const cfg = healthStatusCfg[rec.healthStatus] ?? healthStatusCfg["Healthy"];
              const isActive = selected?.childId === rec.childId;
              return (
                <button
                  key={rec.childId}
                  onClick={() => setSelected(rec)}
                  className={classNames(
                    "w-full rounded-xl border p-4 text-left transition",
                    isActive
                      ? "border-civic-200 bg-civic-50 dark:border-civic-500/30 dark:bg-civic-500/10"
                      : "border-gray-100 bg-white hover:bg-gray-50 dark:border-slate-800 dark:bg-slate-900 dark:hover:bg-slate-800"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <div className={classNames(
                      "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-sm font-bold text-white",
                      isActive ? "bg-civic-600" : "bg-slate-400 dark:bg-slate-600"
                    )}>
                      {rec.childName.split(" ").map(n => n[0]).join("").slice(0, 2)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className={classNames("truncate text-[13px] font-bold", isActive ? "text-civic-700 dark:text-civic-300" : "text-slate-900 dark:text-white")}>{rec.childName}</p>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">{rec.childId} · Age {rec.age}</p>
                    </div>
                    <span className={classNames("badge shrink-0", cfg.badge)}>{rec.healthStatus}</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right — detail panels */}
        {selected ? (
          <div className="space-y-5 min-w-0">
            <ChildHealthOverview record={selected} onEdit={() => setAddOpen(true)} onDelete={() => setDeleteOpen(true)} onSchedule={() => setScheduleOpen(true)} />
            <MedicalInformation record={selected} />
            <CheckupTracker record={selected} onSchedule={() => setScheduleOpen(true)} />
            <VaccinationTracker record={selected} expanded={expandedVacc} onToggle={() => setExpandedVacc(v => !v)} />
            <HealthHistory record={selected} expanded={expandedHistory} onToggle={() => setExpandedHistory(v => !v)} />
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-gray-100 bg-white py-16 text-center shadow-card dark:border-slate-800 dark:bg-slate-900">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gray-100 dark:bg-slate-800">
              <FiHeart className="h-6 w-6 text-slate-400" />
            </div>
            <p className="mt-4 text-sm font-semibold text-slate-600 dark:text-slate-300">No child selected</p>
            <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">Select a child from the list to view health details.</p>
          </div>
        )}
      </div>

      {/* Modals */}
      <AddRecordModal open={addOpen} onClose={() => setAddOpen(false)} />
      <DeleteConfirmModal open={deleteOpen} name={selected?.childName} onClose={() => setDeleteOpen(false)} onConfirm={handleDelete} />
      <ScheduleModal open={scheduleOpen} record={selected} onClose={() => setScheduleOpen(false)} />
    </div>
  );
}

/* ── Section 1: Child Health Overview ───────────────────── */
function ChildHealthOverview({ record, onEdit, onDelete, onSchedule }) {
  const cfg = healthStatusCfg[record.healthStatus] ?? healthStatusCfg["Healthy"];
  const days = daysUntil(record.nextCheckup);
  const daysColor = days !== null && days <= 7 ? "text-red-600 dark:text-red-400" : days !== null && days <= 30 ? "text-amber-600 dark:text-amber-400" : "text-green-600 dark:text-green-400";

  return (
    <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-card dark:border-slate-800 dark:bg-slate-900">
      <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4 dark:border-slate-800">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400">
            <FiUser className="h-3.5 w-3.5" />
          </div>
          <h2 className="text-sm font-bold text-slate-900 dark:text-white">Child Health Overview</h2>
        </div>
        <div className="flex items-center gap-2">
          <Button icon={FiEdit2} variant="secondary" className="text-xs px-3 py-1.5" onClick={onEdit}>Edit</Button>
          <Button icon={FiTrash2} variant="danger" className="text-xs px-3 py-1.5" onClick={onDelete}>Delete</Button>
        </div>
      </div>
      <div className="p-5">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
          {/* Avatar */}
          <div className="flex shrink-0 flex-col items-center gap-3">
            <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-civic-600 text-2xl font-bold text-white shadow-sm">
              {record.childName.split(" ").map(n => n[0]).join("").slice(0, 2)}
            </div>
            <span className={classNames("badge", cfg.badge)}>
              <span className={classNames("h-1.5 w-1.5 rounded-full", cfg.dot)} />
              {record.healthStatus}
            </span>
          </div>
          {/* Details grid */}
          <div className="grid flex-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <InfoField label="Child Name"   value={record.childName} />
            <InfoField label="Age"          value={`${record.age} years`} />
            <InfoField label="Gender"       value={record.gender} />
            <InfoField label="Blood Group"  value={record.bloodGroup} accent />
            <InfoField label="Height"       value={record.height} />
            <InfoField label="Weight"       value={record.weight} />
            <InfoField label="BMI"          value={record.bmi} />
            <InfoField label="Doctor"       value={record.doctor} />
            <InfoField label="Last Checkup" value={formatDate(record.lastCheckup)} />
            <InfoField label="Next Checkup" value={formatDate(record.nextCheckup)} />
            <div className="field-block">
              <span className="field-label">Days Remaining</span>
              <p className={classNames("field-value mt-1.5 font-bold", daysColor)}>
                {days !== null ? `${days} days` : "—"}
              </p>
            </div>
            <InfoField label="Vaccination" value={record.vaccinationStatus} />
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Section 2: Medical Information ─────────────────────── */
function MedicalInformation({ record }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-card dark:border-slate-800 dark:bg-slate-900">
      <div className="flex items-center gap-2 border-b border-gray-100 px-5 py-4 dark:border-slate-800">
        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400">
          <FiActivity className="h-3.5 w-3.5" />
        </div>
        <h2 className="text-sm font-bold text-slate-900 dark:text-white">Medical Information</h2>
      </div>
      <div className="grid gap-3 p-5 sm:grid-cols-2 xl:grid-cols-3">
        <InfoField label="Allergies"            value={record.allergies} />
        <InfoField label="Medical Conditions"   value={record.conditions} />
        <InfoField label="Current Medications"  value={record.medications} wide />
        <InfoField label="Vaccination Status"   value={record.vaccinationStatus} />
        <InfoField label="Emergency Contact"    value={record.emergencyContact} />
        <InfoField label="Assigned Doctor"      value={record.doctor} />
      </div>
    </div>
  );
}

/* ── Section 3: Checkup Tracker ─────────────────────────── */
function CheckupTracker({ record, onSchedule }) {
  const days = daysUntil(record.nextCheckup);
  const urgency = days !== null && days <= 7  ? { bar: "bg-red-500",   text: "text-red-600 dark:text-red-400",     bg: "bg-red-50 dark:bg-red-500/10",     label: "Urgent" }
               : days !== null && days <= 30 ? { bar: "bg-amber-500", text: "text-amber-600 dark:text-amber-400", bg: "bg-amber-50 dark:bg-amber-500/10", label: "Due Soon" }
               :                              { bar: "bg-green-500",  text: "text-green-600 dark:text-green-400", bg: "bg-green-50 dark:bg-green-500/10",  label: "On Track" };

  const pct = days !== null ? Math.max(0, Math.min(100, Math.round((1 - days / 90) * 100))) : 0;

  return (
    <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-card dark:border-slate-800 dark:bg-slate-900">
      <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4 dark:border-slate-800">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-civic-50 text-civic-600 dark:bg-civic-500/10 dark:text-civic-400">
            <FiCalendar className="h-3.5 w-3.5" />
          </div>
          <h2 className="text-sm font-bold text-slate-900 dark:text-white">Health Checkup Tracker</h2>
        </div>
        <Button icon={FiCalendar} variant="secondary" className="text-xs px-3 py-1.5" onClick={onSchedule}>
          Schedule Checkup
        </Button>
      </div>
      <div className="grid gap-4 p-5 sm:grid-cols-2 xl:grid-cols-4">
        <InfoField label="Last Checkup"       value={formatDate(record.lastCheckup)} />
        <InfoField label="Next Checkup"       value={formatDate(record.nextCheckup)} />
        <div className="field-block">
          <span className="field-label">Days Remaining</span>
          <p className={classNames("field-value mt-1.5 font-bold", urgency.text)}>
            {days !== null ? `${days} days` : "—"}
          </p>
        </div>
        <div className={classNames("flex items-center gap-2 rounded-xl border border-transparent px-4 py-3", urgency.bg)}>
          <FiClock className={classNames("h-4 w-4 shrink-0", urgency.text)} />
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Reminder Status</p>
            <p className={classNames("text-sm font-bold", urgency.text)}>{urgency.label}</p>
          </div>
        </div>
      </div>
      {/* Progress bar */}
      <div className="border-t border-gray-100 px-5 py-3 dark:border-slate-800">
        <div className="mb-1.5 flex items-center justify-between">
          <span className="text-xs text-slate-500 dark:text-slate-400">Checkup cycle progress</span>
          <span className="text-xs font-bold text-slate-700 dark:text-slate-200">{pct}%</span>
        </div>
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-gray-100 dark:bg-slate-700">
          <motion.div
            className={classNames("h-full rounded-full", urgency.bar)}
            initial={{ width: 0 }}
            animate={{ width: `${pct}%` }}
            transition={{ duration: 0.7, ease: "easeOut" }}
          />
        </div>
      </div>
    </div>
  );
}

/* ── Section 4: Vaccination Tracker ─────────────────────── */
function VaccinationTracker({ record, expanded, onToggle }) {
  const overdue  = record.vaccinations.filter(v => v.status === "Overdue").length;
  const pending  = record.vaccinations.filter(v => v.status === "Pending").length;

  return (
    <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-card dark:border-slate-800 dark:bg-slate-900">
      <button
        onClick={onToggle}
        className="flex w-full items-center justify-between border-b border-gray-100 px-5 py-4 text-left dark:border-slate-800"
      >
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400">
            <FiShield className="h-3.5 w-3.5" />
          </div>
          <h2 className="text-sm font-bold text-slate-900 dark:text-white">Vaccination Tracker</h2>
          <div className="ml-2 flex gap-1.5">
            {overdue > 0 && <span className="badge badge-danger">{overdue} overdue</span>}
            {pending > 0 && <span className="badge badge-warning">{pending} pending</span>}
          </div>
        </div>
        {expanded
          ? <FiChevronUp className="h-4 w-4 text-slate-400" />
          : <FiChevronDown className="h-4 w-4 text-slate-400" />
        }
      </button>

      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead className="bg-gray-50 dark:bg-slate-800/80">
                  <tr>
                    {["Vaccine Name", "Date Given", "Next Due Date", "Status"].map(h => (
                      <th key={h} className="table-th">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 dark:divide-slate-800">
                  {record.vaccinations.map((v, i) => {
                    const cfg = vaccStatusCfg[v.status] ?? vaccStatusCfg["Pending"];
                    return (
                      <tr key={i} className="table-row">
                        <td className="table-td font-semibold text-slate-900 dark:text-white">{v.name}</td>
                        <td className="table-td">{formatDate(v.dateGiven)}</td>
                        <td className="table-td">{formatDate(v.nextDue)}</td>
                        <td className="table-td">
                          <span className={classNames("badge", cfg.badge)}>
                            {v.status === "Completed" && <FiCheckCircle className="h-3 w-3" />}
                            {v.status === "Pending"   && <FiClock        className="h-3 w-3" />}
                            {v.status === "Overdue"   && <FiAlertCircle  className="h-3 w-3" />}
                            {cfg.label}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ── Section 5: Health History ───────────────────────────── */
function HealthHistory({ record, expanded, onToggle }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-card dark:border-slate-800 dark:bg-slate-900">
      <button
        onClick={onToggle}
        className="flex w-full items-center justify-between border-b border-gray-100 px-5 py-4 text-left dark:border-slate-800"
      >
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-green-50 text-green-600 dark:bg-green-500/10 dark:text-green-400">
            <FiActivity className="h-3.5 w-3.5" />
          </div>
          <h2 className="text-sm font-bold text-slate-900 dark:text-white">Health History</h2>
          <span className="badge badge-neutral">{record.healthHistory.length} records</span>
        </div>
        {expanded
          ? <FiChevronUp className="h-4 w-4 text-slate-400" />
          : <FiChevronDown className="h-4 w-4 text-slate-400" />
        }
      </button>

      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            {/* Timeline view on md+, table on all sizes */}
            <div className="p-5">
              <div className="relative space-y-0">
                {record.healthHistory.map((entry, i) => (
                  <div key={i} className="relative flex gap-4">
                    {/* Timeline connector */}
                    <div className="flex flex-col items-center">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-civic-50 text-civic-600 dark:bg-civic-500/10 dark:text-civic-400 text-xs font-bold ring-4 ring-white dark:ring-slate-900">
                        {i + 1}
                      </div>
                      {i < record.healthHistory.length - 1 && (
                        <div className="mt-1 w-px flex-1 bg-gray-200 dark:bg-slate-700" style={{ minHeight: "1.5rem" }} />
                      )}
                    </div>
                    {/* Content card */}
                    <div className={classNames("flex-1 rounded-xl border border-gray-100 bg-gray-50 p-4 dark:border-slate-700 dark:bg-slate-800/50", i < record.healthHistory.length - 1 ? "mb-4" : "")}>
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <p className="text-[13px] font-bold text-slate-900 dark:text-white">{entry.diagnosis}</p>
                        <span className="text-xs font-medium text-slate-500 dark:text-slate-400">{formatDate(entry.date)}</span>
                      </div>
                      <div className="mt-2 grid gap-2 sm:grid-cols-2">
                        <div>
                          <span className="field-label">Doctor</span>
                          <p className="field-value">{entry.doctor}</p>
                        </div>
                        <div>
                          <span className="field-label">Treatment</span>
                          <p className="field-value">{entry.treatment}</p>
                        </div>
                        {entry.notes && (
                          <div className="sm:col-span-2">
                            <span className="field-label">Notes</span>
                            <p className="field-value">{entry.notes}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ── Add / Edit Record Modal ─────────────────────────────── */
function AddRecordModal({ open, onClose }) {
  const fieldCls = "mt-1.5 w-full rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none transition focus:border-civic-500 focus:ring-2 focus:ring-civic-500/15 dark:border-slate-700 dark:bg-slate-800 dark:text-white";
  const labelCls = "block text-[13px] font-semibold text-slate-700 dark:text-slate-300";

  return (
    <Modal open={open} title="Add / Edit Health Record" onClose={onClose}>
      <form
        className="space-y-4"
        onSubmit={(e) => { e.preventDefault(); onClose(); }}
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <label className={labelCls}>
            Child Name
            <input className={fieldCls} placeholder="e.g. Ishaan Roy" />
          </label>
          <label className={labelCls}>
            Child ID
            <input className={fieldCls} placeholder="e.g. CH-1021" />
          </label>
          <label className={labelCls}>
            Age
            <input type="number" className={fieldCls} placeholder="9" />
          </label>
          <label className={labelCls}>
            Blood Group
            <select className={fieldCls}>
              {["A+","A-","B+","B-","AB+","AB-","O+","O-"].map(g => <option key={g}>{g}</option>)}
            </select>
          </label>
          <label className={labelCls}>
            Height (cm)
            <input className={fieldCls} placeholder="132 cm" />
          </label>
          <label className={labelCls}>
            Weight (kg)
            <input className={fieldCls} placeholder="28 kg" />
          </label>
          <label className={labelCls}>
            Last Checkup Date
            <input type="date" className={fieldCls} />
          </label>
          <label className={labelCls}>
            Next Checkup Date
            <input type="date" className={fieldCls} />
          </label>
          <label className={labelCls}>
            Health Status
            <select className={fieldCls}>
              <option>Healthy</option>
              <option>Under Observation</option>
              <option>Critical</option>
            </select>
          </label>
          <label className={labelCls}>
            Assigned Doctor
            <input className={fieldCls} placeholder="Dr. Name" />
          </label>
          <label className={classNames(labelCls, "sm:col-span-2")}>
            Allergies
            <input className={fieldCls} placeholder="e.g. Dust allergy, Peanuts" />
          </label>
          <label className={classNames(labelCls, "sm:col-span-2")}>
            Medical Conditions
            <input className={fieldCls} placeholder="e.g. Asthma, Anaemia" />
          </label>
          <label className={classNames(labelCls, "sm:col-span-2")}>
            Current Medications
            <textarea rows={2} className={fieldCls} placeholder="List current medications…" />
          </label>
          <label className={labelCls}>
            Emergency Contact
            <input className={fieldCls} placeholder="+91 98765 XXXXX" />
          </label>
          <label className={labelCls}>
            Vaccination Status
            <select className={fieldCls}>
              <option>Up to date</option>
              <option>Booster pending</option>
              <option>Overdue</option>
            </select>
          </label>
        </div>
        <div className="flex justify-end gap-3 pt-2">
          <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
          <Button type="submit" icon={FiCheckCircle}>Save Record</Button>
        </div>
      </form>
    </Modal>
  );
}

/* ── Delete Confirm Modal ────────────────────────────────── */
function DeleteConfirmModal({ open, name, onClose, onConfirm }) {
  return (
    <Modal open={open} title="Delete Health Record" onClose={onClose}>
      <div className="flex items-start gap-4">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400">
          <FiTrash2 className="h-5 w-5" />
        </div>
        <div>
          <p className="text-sm font-semibold text-slate-900 dark:text-white">
            Delete record for <span className="font-bold text-red-600 dark:text-red-400">{name}</span>?
          </p>
          <p className="mt-1.5 text-xs leading-relaxed text-slate-500 dark:text-slate-400">
            This action cannot be undone. The health record, vaccination history, and all medical data for this child will be permanently removed.
          </p>
        </div>
      </div>
      <div className="mt-5 flex justify-end gap-3">
        <Button variant="secondary" onClick={onClose}>Cancel</Button>
        <Button variant="danger" icon={FiTrash2} onClick={onConfirm}>Delete Record</Button>
      </div>
    </Modal>
  );
}

/* ── Schedule Checkup Modal ──────────────────────────────── */
function ScheduleModal({ open, record, onClose }) {
  const fieldCls = "mt-1.5 w-full rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none transition focus:border-civic-500 focus:ring-2 focus:ring-civic-500/15 dark:border-slate-700 dark:bg-slate-800 dark:text-white";
  const labelCls = "block text-[13px] font-semibold text-slate-700 dark:text-slate-300";

  return (
    <Modal open={open} title="Schedule Next Checkup" onClose={onClose}>
      <form
        className="space-y-4"
        onSubmit={(e) => { e.preventDefault(); onClose(); }}
      >
        {record && (
          <div className="rounded-xl border border-civic-100 bg-civic-50 px-4 py-3 dark:border-civic-500/20 dark:bg-civic-500/10">
            <p className="text-xs font-semibold text-civic-700 dark:text-civic-300">
              Scheduling for: <span className="font-bold">{record.childName}</span> ({record.childId})
            </p>
            <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
              Last checkup: {formatDate(record.lastCheckup)}
            </p>
          </div>
        )}
        <div className="grid gap-4 sm:grid-cols-2">
          <label className={labelCls}>
            Scheduled Date
            <input type="date" className={fieldCls} />
          </label>
          <label className={labelCls}>
            Scheduled Time
            <input type="time" className={fieldCls} />
          </label>
          <label className={labelCls}>
            Doctor Name
            <input className={fieldCls} placeholder="Dr. Name" defaultValue={record?.doctor ?? ""} />
          </label>
          <label className={labelCls}>
            Checkup Type
            <select className={fieldCls}>
              <option>Full Body Checkup</option>
              <option>Dental Checkup</option>
              <option>Eye Checkup</option>
              <option>Vaccination</option>
              <option>Follow-up Visit</option>
            </select>
          </label>
          <label className={classNames(labelCls, "sm:col-span-2")}>
            Notes / Instructions
            <textarea rows={3} className={fieldCls} placeholder="Any special instructions for this checkup…" />
          </label>
        </div>
        <div className="flex justify-end gap-3 pt-2">
          <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
          <Button type="submit" icon={FiCalendar}>Confirm Schedule</Button>
        </div>
      </form>
    </Modal>
  );
}

/* ── Shared InfoField sub-component ──────────────────────── */
function InfoField({ label, value, wide = false, accent = false }) {
  return (
    <div className={classNames("field-block min-w-0", wide ? "sm:col-span-2" : "")}>
      <span className="field-label">{label}</span>
      <p className={classNames(
        "field-value mt-1.5 truncate",
        accent ? "font-bold text-civic-700 dark:text-civic-400" : ""
      )} title={value || "Not provided"}>
        {value || "Not provided"}
      </p>
    </div>
  );
}
