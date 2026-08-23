import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FiShield,
  FiUser,
  FiCreditCard,
  FiLogIn,
  FiLogOut,
  FiCheckCircle,
  FiSlash,
  FiSearch,
  FiFilter,
  FiRefreshCw,
  FiEye,
  FiCalendar,
  FiClock,
  FiX,
  FiAlertCircle,
  FiAlertTriangle,
  FiActivity,
  FiBell,
  FiChevronRight,
  FiUsers,
  FiHeart,
  FiCheck,
} from "react-icons/fi";
import Card from "../components/Card.jsx";
import { gateService } from "../services/gateService.js";
import { classNames } from "../utils/formatters.js";

export default function AccessAudit() {
  const [records, setRecords] = useState([]);
  const [summary, setSummary] = useState(null);
  const [alerts, setAlerts] = useState([]);
  const [dismissedAlerts, setDismissedAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);

  // Child & Parent History modal states
  const [historyModal, setHistoryModal] = useState(null); // { type: 'CHILD'|'PARENT', id: string, name: string, data: object }
  const [historyLoading, setHistoryLoading] = useState(false);

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("ALL");
  const [movementFilter, setMovementFilter] = useState("ALL");
  const [resultFilter, setResultFilter] = useState("ALL");
  const [activeTab, setActiveTab] = useState("AUDIT"); // "AUDIT" | "ALERTS" | "EXPECTED" | "INSIDE"
  const [page, setPage] = useState(1);

  useEffect(() => {
    loadAuditData();
  }, [typeFilter, movementFilter, resultFilter]);

  async function loadAuditData(silent = false) {
    if (!silent) setLoading(true);
    else setIsRefreshing(true);

    try {
      const [auditData, summaryData] = await Promise.all([
        gateService.getAccessAudit({
          type: typeFilter,
          movement: movementFilter,
          result: resultFilter,
          search: searchQuery,
          page,
          limit: 25,
        }),
        gateService.getGateSummary(),
      ]);

      setRecords(auditData.records || []);
      setSummary(summaryData || null);
      setAlerts(summaryData?.alerts || []);
    } catch (err) {
      console.error("Access Audit fetch error:", err);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    loadAuditData();
  };

  const handleDismissAlert = (alertId) => {
    setDismissedAlerts((prev) => [...prev, alertId]);
  };

  const handleViewChildHistory = async (childId, childName) => {
    if (!childId) return;
    setHistoryLoading(true);
    setHistoryModal({ type: "CHILD", id: childId, name: childName, data: null });
    try {
      const hist = await gateService.getChildVisitHistory(childId);
      setHistoryModal((prev) => (prev ? { ...prev, data: hist } : null));
    } catch (e) {
      console.error("Child history load error:", e);
    } finally {
      setHistoryLoading(false);
    }
  };

  const handleViewParentHistory = async (parentId, parentName) => {
    if (!parentId) return;
    setHistoryLoading(true);
    setHistoryModal({ type: "PARENT", id: parentId, name: parentName, data: null });
    try {
      const hist = await gateService.getParentVisitHistory(parentId);
      setHistoryModal((prev) => (prev ? { ...prev, data: hist } : null));
    } catch (e) {
      console.error("Parent history load error:", e);
    } finally {
      setHistoryLoading(false);
    }
  };

  // Local filtered view for instant responsiveness
  const filteredRecords = records.filter((rec) => {
    const matchesSearch =
      !searchQuery.trim() ||
      rec.personName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      rec.referenceId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (rec.childName && rec.childName.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesType = typeFilter === "ALL" || rec.type === typeFilter;
    const matchesMovement = movementFilter === "ALL" || rec.movement === movementFilter;
    const matchesResult = resultFilter === "ALL" || rec.result === resultFilter;

    return matchesSearch && matchesType && matchesMovement && matchesResult;
  });

  const activeAlerts = alerts.filter((a) => !dismissedAlerts.includes(a.id));

  return (
    <div className="space-y-6 pb-12">
      {/* ── Page Header ────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400">
              <FiShield className="h-4 w-4" />
            </span>
            <h1 className="text-xl font-bold text-slate-900 dark:text-white font-display">
              Smart Visitor Monitoring & Access Audit
            </h1>
          </div>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            Child-safety-aware visitor verification, late arrival alerts, overstay detection, and access audit logs
          </p>
        </div>

        <button
          type="button"
          onClick={() => loadAuditData(true)}
          disabled={isRefreshing}
          className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-700 shadow-2xs hover:bg-slate-50 disabled:opacity-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200"
        >
          <FiRefreshCw className={classNames("h-3.5 w-3.5", isRefreshing && "animate-spin text-indigo-500")} />
          <span>{isRefreshing ? "Syncing..." : "Refresh Logs & Alerts"}</span>
        </button>
      </div>

      {/* ── Security & Visit Alerts Banner (If Active Alerts Exist) ─────────── */}
      {activeAlerts.length > 0 && (
        <div className="space-y-2">
          {activeAlerts.map((alt) => (
            <motion.div
              key={alt.id}
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className={classNames(
                "flex items-center justify-between gap-4 rounded-2xl p-4 border text-xs shadow-xs",
                alt.priority === "CRITICAL"
                  ? "bg-rose-50 border-rose-200 text-rose-900 dark:bg-rose-500/10 dark:border-rose-500/20 dark:text-rose-200"
                  : "bg-amber-50 border-amber-200 text-amber-900 dark:bg-amber-500/10 dark:border-amber-500/20 dark:text-amber-200"
              )}
            >
              <div className="flex items-center gap-3">
                <span className={classNames(
                  "flex h-8 w-8 shrink-0 items-center justify-center rounded-xl font-bold",
                  alt.priority === "CRITICAL" ? "bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-400" : "bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400"
                )}>
                  <FiAlertTriangle className="h-4 w-4" />
                </span>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold font-display uppercase tracking-wide text-[11px]">
                      {alt.title}
                    </span>
                    <span className="rounded-md px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider bg-white/70 dark:bg-slate-900/60">
                      {alt.priority}
                    </span>
                  </div>
                  <p className="mt-0.5 text-[11px] opacity-90">
                    <span className="font-semibold">{alt.personName}</span>
                    {alt.childName && <span> • Child: {alt.childName}</span>}
                    <span> — {alt.details}</span>
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => handleDismissAlert(alt.id)}
                  className="rounded-lg px-2.5 py-1 text-[11px] font-bold bg-white/80 hover:bg-white dark:bg-slate-800 dark:hover:bg-slate-700 transition-colors"
                >
                  Dismiss
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* ── KPI Summary Cards ──────────────────────────────────── */}
      {summary?.todaySummary && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card className="border-slate-200/90 dark:border-slate-800 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  Staff Movements
                </p>
                <p className="mt-1 text-2xl font-black text-slate-900 dark:text-white font-display">
                  {summary.todaySummary.staffEntries + summary.todaySummary.staffExits}
                </p>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-[#2563EB] dark:bg-blue-500/10 dark:text-blue-400">
                <FiCreditCard className="h-5 w-5" />
              </div>
            </div>
            <div className="mt-3 flex items-center gap-3 text-[11px] text-slate-500">
              <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                ↑ {summary.todaySummary.staffEntries} Entries
              </span>
              <span>•</span>
              <span className="font-semibold text-purple-600 dark:text-purple-400">
                ↓ {summary.todaySummary.staffExits} Exits
              </span>
            </div>
          </Card>

          <Card className="border-slate-200/90 dark:border-slate-800 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  Parent Visit Scans
                </p>
                <p className="mt-1 text-2xl font-black text-indigo-600 dark:text-indigo-400 font-display">
                  {summary.todaySummary.parentEntries + summary.todaySummary.parentExits}
                </p>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400">
                <FiUser className="h-5 w-5" />
              </div>
            </div>
            <div className="mt-3 flex items-center gap-3 text-[11px] text-slate-500">
              <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                ↑ {summary.todaySummary.parentEntries} Entries
              </span>
              <span>•</span>
              <span className="font-semibold text-purple-600 dark:text-purple-400">
                ↓ {summary.todaySummary.completedVisits || 0} Completed
              </span>
            </div>
          </Card>

          <Card className="border-slate-200/90 dark:border-slate-800 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  Currently Inside
                </p>
                <p className="mt-1 text-2xl font-black text-emerald-600 dark:text-emerald-400 font-display">
                  {summary.todaySummary.activeInside}
                </p>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400">
                <FiActivity className="h-5 w-5" />
              </div>
            </div>
            <div className="mt-3 flex items-center gap-2 text-[11px] text-slate-500">
              <span>{summary.todaySummary.staffInside || 3} Staff</span>
              <span>•</span>
              <span>{summary.todaySummary.parentsInside || 0} Visiting Parents</span>
            </div>
          </Card>

          <Card className="border-slate-200/90 dark:border-slate-800 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  Expected Visitors
                </p>
                <p className="mt-1 text-2xl font-black text-amber-600 dark:text-amber-400 font-display">
                  {summary.todaySummary.expectedVisitors}
                </p>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400">
                <FiClock className="h-5 w-5" />
              </div>
            </div>
            <p className="mt-3 text-[11px] text-slate-500">
              Approved slots awaiting arrival
            </p>
          </Card>
        </div>
      )}

      {/* ── Sub-navigation Tabs: Audit Log / Expected Visitors / Inside Visitors / Alerts ──── */}
      <div className="flex rounded-2xl bg-slate-100 p-1 dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 max-w-xl">
        <button
          type="button"
          onClick={() => setActiveTab("AUDIT")}
          className={classNames(
            "flex-1 flex items-center justify-center gap-1.5 rounded-xl py-2 text-xs font-bold font-display transition-all",
            activeTab === "AUDIT"
              ? "bg-white text-slate-900 shadow-xs dark:bg-slate-800 dark:text-white"
              : "text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
          )}
        >
          <FiShield className="h-3.5 w-3.5" />
          <span>Access Audit</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("EXPECTED")}
          className={classNames(
            "flex-1 flex items-center justify-center gap-1.5 rounded-xl py-2 text-xs font-bold font-display transition-all",
            activeTab === "EXPECTED"
              ? "bg-white text-amber-600 shadow-xs dark:bg-slate-800 dark:text-amber-400"
              : "text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
          )}
        >
          <FiClock className="h-3.5 w-3.5" />
          <span>Expected ({summary?.expectedVisitors?.length || 0})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("INSIDE")}
          className={classNames(
            "flex-1 flex items-center justify-center gap-1.5 rounded-xl py-2 text-xs font-bold font-display transition-all",
            activeTab === "INSIDE"
              ? "bg-white text-emerald-600 shadow-xs dark:bg-slate-800 dark:text-emerald-400"
              : "text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
          )}
        >
          <FiActivity className="h-3.5 w-3.5" />
          <span>Currently Inside ({summary?.currentlyInside?.length || 0})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("ALERTS")}
          className={classNames(
            "flex-1 flex items-center justify-center gap-1.5 rounded-xl py-2 text-xs font-bold font-display transition-all",
            activeTab === "ALERTS"
              ? "bg-white text-rose-600 shadow-xs dark:bg-slate-800 dark:text-rose-400"
              : "text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
          )}
        >
          <FiBell className="h-3.5 w-3.5" />
          <span>Alerts ({activeAlerts.length})</span>
        </button>
      </div>

      {/* ── Tab View 1: Expected Visitors ───────────────────────── */}
      {activeTab === "EXPECTED" && (
        <Card className="border-slate-200/90 dark:border-slate-800 p-0 overflow-hidden shadow-card">
          <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
            <div>
              <h3 className="font-display text-sm font-bold text-slate-900 dark:text-white">
                Today's Expected Visitors & Approved Schedules
              </h3>
              <p className="text-xs text-slate-500">
                Approved parent visits scheduled for today awaiting gate verification
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/70 text-[11px] font-bold uppercase text-slate-400 dark:border-slate-800 dark:bg-slate-900/50">
                  <th className="py-3 px-4">Visitor / Parent</th>
                  <th className="py-3 px-4">Visiting Child</th>
                  <th className="py-3 px-4">Approved Slot</th>
                  <th className="py-3 px-4">Status & Countdown</th>
                  <th className="py-3 px-4">Pass ID Ref</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {!summary?.expectedVisitors || summary.expectedVisitors.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-10 text-center text-slate-400">
                      <div className="flex flex-col items-center gap-2">
                        <FiClock className="h-6 w-6 text-slate-300 dark:text-slate-700" />
                        <p className="text-xs font-bold text-slate-600 dark:text-slate-400">No Expected Visitors Pending</p>
                        <p className="text-[11px]">All approved visits for today have already checked in or concluded.</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  summary.expectedVisitors.map((exp) => (
                    <tr key={exp.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40">
                      <td className="py-3 px-4 font-bold text-slate-900 dark:text-white font-display">
                        {exp.name}
                      </td>
                      <td className="py-3 px-4 text-slate-600 dark:text-slate-300">
                        {exp.childName}
                      </td>
                      <td className="py-3 px-4 font-mono text-[11px] text-slate-600 dark:text-slate-300">
                        {exp.visitTime}
                      </td>
                      <td className="py-3 px-4">
                        <span className={classNames(
                          "inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-[10px] font-bold uppercase",
                          exp.isLate
                            ? "bg-rose-50 text-rose-700 ring-1 ring-rose-200 dark:bg-rose-500/10 dark:text-rose-400"
                            : "bg-amber-50 text-amber-700 ring-1 ring-amber-200 dark:bg-amber-500/10 dark:text-amber-400"
                        )}>
                          <span>{exp.status}</span>
                          <span className="font-normal opacity-80">({exp.countdown})</span>
                        </span>
                      </td>
                      <td className="py-3 px-4 font-mono text-[11px] text-indigo-500 font-bold">
                        {exp.referenceId}
                      </td>
                      <td className="py-3 px-4 text-right">
                        {exp.childId && (
                          <button
                            type="button"
                            onClick={() => handleViewChildHistory(exp.childId, exp.childName)}
                            className="inline-flex items-center gap-1 rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300"
                          >
                            <FiHeart className="h-3 w-3 text-rose-500" />
                            <span>Child History</span>
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* ── Tab View 2: Currently Inside ────────────────────────── */}
      {activeTab === "INSIDE" && (
        <Card className="border-slate-200/90 dark:border-slate-800 p-0 overflow-hidden shadow-card">
          <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
            <div>
              <h3 className="font-display text-sm font-bold text-slate-900 dark:text-white">
                Visitors & Personnel Currently Inside Facility
              </h3>
              <p className="text-xs text-slate-500">
                Live presence tracking with real-time duration and overstay alerts
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/70 text-[11px] font-bold uppercase text-slate-400 dark:border-slate-800 dark:bg-slate-900/50">
                  <th className="py-3 px-4">Person Name</th>
                  <th className="py-3 px-4">Type</th>
                  <th className="py-3 px-4">Visiting Child / Role</th>
                  <th className="py-3 px-4">Entry Time</th>
                  <th className="py-3 px-4">Current Duration</th>
                  <th className="py-3 px-4">Gate</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {!summary?.currentlyInside || summary.currentlyInside.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-10 text-center text-slate-400">
                      <div className="flex flex-col items-center gap-2">
                        <FiActivity className="h-6 w-6 text-slate-300 dark:text-slate-700" />
                        <p className="text-xs font-bold text-slate-600 dark:text-slate-400">No Visitors Currently Inside</p>
                        <p className="text-[11px]">All checked-in personnel and visitors have concluded departure.</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  summary.currentlyInside.map((ins) => (
                    <tr key={ins.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40">
                      <td className="py-3 px-4 font-bold text-slate-900 dark:text-white font-display">
                        {ins.name}
                      </td>
                      <td className="py-3 px-4">
                        <span className={classNames(
                          "inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[10px] font-bold uppercase",
                          ins.type === "PARENT"
                            ? "bg-indigo-50 text-indigo-700 ring-1 ring-indigo-200 dark:bg-indigo-500/10 dark:text-indigo-400"
                            : "bg-blue-50 text-blue-700 ring-1 ring-blue-200 dark:bg-blue-500/10 dark:text-blue-400"
                        )}>
                          {ins.type}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-600 dark:text-slate-300">
                        {ins.childName || "Staff Member"}
                      </td>
                      <td className="py-3 px-4 font-mono text-[11px] text-slate-600 dark:text-slate-300">
                        {new Date(ins.entryTime).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td className="py-3 px-4 font-bold text-emerald-600 dark:text-emerald-400 font-mono text-[11px]">
                        {ins.duration || "Active"}
                      </td>
                      <td className="py-3 px-4 text-slate-600 dark:text-slate-300">
                        {ins.gate}
                      </td>
                      <td className="py-3 px-4">
                        <span className={classNames(
                          "inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[10px] font-bold uppercase",
                          ins.isOverstay
                            ? "bg-rose-50 text-rose-700 ring-1 ring-rose-200 dark:bg-rose-500/10 dark:text-rose-400"
                            : "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400"
                        )}>
                          <span>{ins.status}</span>
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        {ins.childId && (
                          <button
                            type="button"
                            onClick={() => handleViewChildHistory(ins.childId, ins.childName)}
                            className="inline-flex items-center gap-1 rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300"
                          >
                            <FiHeart className="h-3 w-3 text-rose-500" />
                            <span>Child History</span>
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* ── Tab View 3: Smart Security Alerts ───────────────────── */}
      {activeTab === "ALERTS" && (
        <Card className="border-slate-200/90 dark:border-slate-800 p-0 overflow-hidden shadow-card">
          <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
            <div>
              <h3 className="font-display text-sm font-bold text-slate-900 dark:text-white">
                Security, Overstay & Gate Anomaly Alerts
              </h3>
              <p className="text-xs text-slate-500">
                Automated detection of late arrivals, duration overstays, and unauthorized scan attempts
              </p>
            </div>
          </div>

          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {activeAlerts.length === 0 ? (
              <div className="py-12 text-center text-slate-400">
                <div className="flex flex-col items-center gap-2">
                  <FiCheckCircle className="h-8 w-8 text-emerald-500" />
                  <p className="text-xs font-bold text-slate-700 dark:text-slate-300">No Active Security Alerts</p>
                  <p className="text-[11px] text-slate-400">All checkpoints operating within authorized safety parameters.</p>
                </div>
              </div>
            ) : (
              activeAlerts.map((alt) => (
                <div key={alt.id} className="p-4 flex items-center justify-between gap-4 hover:bg-slate-50/50 dark:hover:bg-slate-800/20">
                  <div className="flex items-center gap-3">
                    <span className={classNames(
                      "flex h-9 w-9 shrink-0 items-center justify-center rounded-xl font-bold",
                      alt.priority === "CRITICAL" ? "bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-400" : "bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400"
                    )}>
                      <FiAlertTriangle className="h-5 w-5" />
                    </span>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900 dark:text-white font-display text-xs">
                          {alt.title}
                        </span>
                        <span className={classNames(
                          "rounded-md px-1.5 py-0.2 text-[9px] font-bold uppercase",
                          alt.priority === "CRITICAL" ? "bg-rose-100 text-rose-800 dark:bg-rose-500/20 dark:text-rose-300" : "bg-amber-100 text-amber-800 dark:bg-amber-500/20 dark:text-amber-300"
                        )}>
                          {alt.priority}
                        </span>
                      </div>
                      <p className="mt-0.5 text-xs text-slate-600 dark:text-slate-300">
                        {alt.details}
                      </p>
                      <p className="mt-1 text-[10px] text-slate-400">
                        Target: {alt.personName} {alt.childName ? `• Child: ${alt.childName}` : ""} • Checkpoint: {alt.gate} • Time: {alt.time}
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleDismissAlert(alt.id)}
                    className="rounded-lg border border-slate-200 px-3 py-1 text-xs font-bold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                  >
                    Acknowledge
                  </button>
                </div>
              ))
            )}
          </div>
        </Card>
      )}

      {/* ── Tab View 4: Standard Access Audit Table ─────────────── */}
      {activeTab === "AUDIT" && (
        <>
          {/* Search & Filter Controls */}
          <Card className="border-slate-200/90 dark:border-slate-800 p-4 space-y-4 shadow-card">
            <form onSubmit={handleSearchSubmit} className="flex flex-col md:flex-row items-stretch md:items-center gap-3">
              <div className="relative flex-1">
                <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 h-4 w-4" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by visitor name, child name, or pass ID..."
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/70 pl-10 pr-4 py-2 text-xs font-medium text-slate-900 placeholder-slate-400 focus:border-indigo-500 focus:bg-white focus:outline-none dark:border-slate-800 dark:bg-slate-950 dark:text-white"
                />
              </div>

              <div className="flex flex-wrap items-center gap-2 text-xs">
                {/* Type Filter */}
                <select
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value)}
                  className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 focus:outline-none"
                >
                  <option value="ALL">All Types</option>
                  <option value="STAFF">Staff Only</option>
                  <option value="PARENT">Parent Visits</option>
                </select>

                {/* Movement Filter */}
                <select
                  value={movementFilter}
                  onChange={(e) => setMovementFilter(e.target.value)}
                  className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 focus:outline-none"
                >
                  <option value="ALL">All Movements</option>
                  <option value="ENTRY">Entry (In)</option>
                  <option value="EXIT">Exit (Out)</option>
                </select>

                {/* Result Filter */}
                <select
                  value={resultFilter}
                  onChange={(e) => setResultFilter(e.target.value)}
                  className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 focus:outline-none"
                >
                  <option value="ALL">All Results</option>
                  <option value="AUTHORIZED">Authorized</option>
                  <option value="DENIED">Denied / Blocked</option>
                </select>

                <button
                  type="submit"
                  className="rounded-xl bg-slate-900 px-4 py-2 text-xs font-bold text-white hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900"
                >
                  Filter
                </button>
              </div>
            </form>
          </Card>

          {/* Access Audit Log Table */}
          <Card className="border-slate-200/90 dark:border-slate-800 p-0 overflow-hidden shadow-card">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/70 text-[11px] font-bold uppercase text-slate-400 dark:border-slate-800 dark:bg-slate-900/50">
                    <th className="py-3.5 px-4">Date & Time</th>
                    <th className="py-3.5 px-4">Person / Identity</th>
                    <th className="py-3.5 px-4">Type</th>
                    <th className="py-3.5 px-4">Method</th>
                    <th className="py-3.5 px-4">Gate</th>
                    <th className="py-3.5 px-4">Movement</th>
                    <th className="py-3.5 px-4">Result</th>
                    <th className="py-3.5 px-4">Pass / ID Ref</th>
                    <th className="py-3.5 px-4 text-right">Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {loading ? (
                    <tr>
                      <td colSpan={9} className="py-12 text-center text-slate-400">
                        <div className="flex flex-col items-center gap-2">
                          <div className="h-6 w-6 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" />
                          <p className="text-xs font-bold">Loading Access Audit Logs...</p>
                        </div>
                      </td>
                    </tr>
                  ) : filteredRecords.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="py-12 text-center text-slate-400">
                        <div className="flex flex-col items-center gap-2">
                          <FiShield className="h-8 w-8 text-slate-300 dark:text-slate-700" />
                          <p className="text-xs font-bold text-slate-600 dark:text-slate-400">
                            No Access Activity Found
                          </p>
                          <p className="text-[11px] text-slate-400">
                            Try adjusting your search criteria or date filters.
                          </p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filteredRecords.map((rec) => {
                      const isParent = rec.type === "PARENT";
                      const isAuthorized = rec.result === "AUTHORIZED";

                      return (
                        <tr
                          key={rec.id}
                          className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors"
                        >
                          <td className="py-3.5 px-4 font-mono text-[11px] text-slate-600 dark:text-slate-300 whitespace-nowrap">
                            <span>{rec.date}</span>
                            <span className="ml-1 text-slate-400">({rec.time})</span>
                          </td>

                          <td className="py-3.5 px-4 font-bold text-slate-900 dark:text-white font-display">
                            <div className="flex items-center gap-2">
                              <div className={classNames(
                                "flex h-6 w-6 shrink-0 items-center justify-center rounded-lg text-[10px] font-bold",
                                isParent ? "bg-indigo-100 text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-300" : "bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-300"
                              )}>
                                {rec.personName.charAt(0)}
                              </div>
                              <div>
                                <span>{rec.personName}</span>
                                {rec.childName && (
                                  <span className="block text-[10px] font-normal text-slate-400">
                                    Child: {rec.childName}
                                  </span>
                                )}
                              </div>
                            </div>
                          </td>

                          <td className="py-3.5 px-4">
                            <span className={classNames(
                              "inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[10px] font-bold uppercase",
                              isParent
                                ? "bg-indigo-50 text-indigo-700 ring-1 ring-indigo-200 dark:bg-indigo-500/10 dark:text-indigo-400 dark:ring-indigo-500/20"
                                : "bg-blue-50 text-blue-700 ring-1 ring-blue-200 dark:bg-blue-500/10 dark:text-blue-400 dark:ring-blue-500/20"
                            )}>
                              {isParent ? <FiUser className="h-3 w-3" /> : <FiCreditCard className="h-3 w-3" />}
                              <span>{rec.type}</span>
                            </span>
                          </td>

                          <td className="py-3.5 px-4 font-bold text-slate-600 dark:text-slate-300">
                            {rec.accessMethod}
                          </td>

                          <td className="py-3.5 px-4 text-slate-600 dark:text-slate-300">
                            {rec.gate}
                          </td>

                          <td className="py-3.5 px-4">
                            <span className={classNames(
                              "inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[10px] font-bold uppercase",
                              rec.movement === "ENTRY"
                                ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:ring-emerald-500/20"
                                : "bg-purple-50 text-purple-700 ring-1 ring-purple-200 dark:bg-purple-500/10 dark:text-purple-400 dark:ring-purple-500/20"
                            )}>
                              {rec.movement === "ENTRY" ? <FiLogIn className="h-3 w-3" /> : <FiLogOut className="h-3 w-3" />}
                              <span>{rec.movement}</span>
                            </span>
                          </td>

                          <td className="py-3.5 px-4">
                            <span className={classNames(
                              "inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[10px] font-bold uppercase",
                              isAuthorized
                                ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-300"
                                : "bg-rose-100 text-rose-800 dark:bg-rose-500/20 dark:text-rose-300"
                            )}>
                              {isAuthorized ? <FiCheckCircle className="h-3 w-3" /> : <FiSlash className="h-3 w-3" />}
                              <span>{rec.result}</span>
                            </span>
                          </td>

                          <td className="py-3.5 px-4 font-mono text-[11px] text-slate-500 dark:text-slate-400">
                            {rec.referenceId}
                          </td>

                          <td className="py-3.5 px-4 text-right">
                            <button
                              type="button"
                              onClick={() => setSelectedEvent(rec)}
                              className="inline-flex items-center gap-1 rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
                            >
                              <FiEye className="h-3 w-3" />
                              <span>View</span>
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </>
      )}

      {/* ── Visitor Details & Visual Lifecycle Timeline Modal ──────────────────────── */}
      <AnimatePresence>
        {selectedEvent && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-xs"
              onClick={() => setSelectedEvent(null)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative z-10 w-full max-w-lg rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900"
            >
              <div className="flex items-center justify-between border-b border-slate-100 pb-3 dark:border-slate-800">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white font-display flex items-center gap-2">
                  <FiShield className="text-indigo-500" />
                  <span>Visitor Verification & Child Safety Details</span>
                </h3>
                <button
                  type="button"
                  onClick={() => setSelectedEvent(null)}
                  className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200"
                >
                  <FiX className="h-4 w-4" />
                </button>
              </div>

              {/* 5-Step Visual Lifecycle Timeline */}
              <div className="my-4 rounded-2xl bg-slate-50 p-4 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-3">
                  Verification Lifecycle Progression
                </p>
                <div className="grid grid-cols-5 gap-1 text-center">
                  <div className="flex flex-col items-center">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500 text-white text-[10px]">
                      <FiCheck />
                    </span>
                    <span className="text-[9px] font-bold text-slate-600 dark:text-slate-300 mt-1">Requested</span>
                  </div>

                  <div className="flex flex-col items-center">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500 text-white text-[10px]">
                      <FiCheck />
                    </span>
                    <span className="text-[9px] font-bold text-slate-600 dark:text-slate-300 mt-1">Approved</span>
                  </div>

                  <div className="flex flex-col items-center">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500 text-white text-[10px]">
                      <FiCheck />
                    </span>
                    <span className="text-[9px] font-bold text-slate-600 dark:text-slate-300 mt-1">QR Issued</span>
                  </div>

                  <div className="flex flex-col items-center">
                    <span className={classNames(
                      "flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-bold",
                      selectedEvent.movement === "ENTRY" || selectedEvent.movement === "EXIT"
                        ? "bg-emerald-500 text-white"
                        : "bg-slate-200 text-slate-500 dark:bg-slate-700"
                    )}>
                      {selectedEvent.movement === "ENTRY" || selectedEvent.movement === "EXIT" ? <FiCheck /> : "4"}
                    </span>
                    <span className="text-[9px] font-bold text-slate-600 dark:text-slate-300 mt-1">Checked In</span>
                  </div>

                  <div className="flex flex-col items-center">
                    <span className={classNames(
                      "flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-bold",
                      selectedEvent.movement === "EXIT"
                        ? "bg-purple-600 text-white"
                        : "bg-slate-200 text-slate-500 dark:bg-slate-700"
                    )}>
                      {selectedEvent.movement === "EXIT" ? <FiCheck /> : "5"}
                    </span>
                    <span className="text-[9px] font-bold text-slate-600 dark:text-slate-300 mt-1">Completed</span>
                  </div>
                </div>
              </div>

              <div className="space-y-2.5 text-xs">
                <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
                  <span className="text-slate-400 font-bold uppercase text-[10px]">Person Name</span>
                  <span className="font-bold text-slate-900 dark:text-white">{selectedEvent.personName}</span>
                </div>

                {selectedEvent.childName && (
                  <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
                    <span className="text-slate-400 font-bold uppercase text-[10px]">Visiting Child</span>
                    <span className="font-bold text-indigo-600 dark:text-indigo-400">{selectedEvent.childName}</span>
                  </div>
                )}

                <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
                  <span className="text-slate-400 font-bold uppercase text-[10px]">Access Type</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">{selectedEvent.type}</span>
                </div>

                <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
                  <span className="text-slate-400 font-bold uppercase text-[10px]">Verification Result</span>
                  <span className={classNames("font-bold", selectedEvent.result === "AUTHORIZED" ? "text-emerald-600" : "text-rose-600")}>
                    {selectedEvent.result}
                  </span>
                </div>

                <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
                  <span className="text-slate-400 font-bold uppercase text-[10px]">Pass Reference ID</span>
                  <span className="font-mono font-bold text-indigo-500">{selectedEvent.referenceId}</span>
                </div>

                <div className="flex justify-between py-1.5">
                  <span className="text-slate-400 font-bold uppercase text-[10px]">Movement Recorded</span>
                  <span className="font-mono text-slate-600 dark:text-slate-300">
                    {selectedEvent.movement} on {selectedEvent.date} at {selectedEvent.time}
                  </span>
                </div>
              </div>

              <div className="mt-6 flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800">
                {selectedEvent.childName && (
                  <button
                    type="button"
                    onClick={() => {
                      const childId = selectedEvent.childId || "demo-child-01";
                      handleViewChildHistory(childId, selectedEvent.childName);
                    }}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-rose-200 bg-rose-50/70 px-3 py-1.5 text-xs font-bold text-rose-700 hover:bg-rose-100 dark:border-rose-500/20 dark:bg-rose-500/10 dark:text-rose-300"
                  >
                    <FiHeart className="h-3.5 w-3.5" />
                    <span>View Child Visit History</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => setSelectedEvent(null)}
                  className="rounded-xl bg-slate-900 px-4 py-2 text-xs font-bold text-white hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── Child / Parent Visit History Modal ────────────────────── */}
      <AnimatePresence>
        {historyModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-xs"
              onClick={() => setHistoryModal(null)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative z-10 w-full max-w-xl rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900"
            >
              <div className="flex items-center justify-between border-b border-slate-100 pb-3 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <span className="flex h-7 w-7 items-center justify-center rounded-xl bg-rose-50 text-rose-600 dark:bg-rose-500/10 dark:text-rose-400">
                    <FiHeart className="h-4 w-4" />
                  </span>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white font-display">
                      {historyModal.type === "CHILD" ? `Child Visit Protection Log: ${historyModal.name}` : `Parent Visit History: ${historyModal.name}`}
                    </h3>
                    <p className="text-[10px] text-slate-400">
                      Historical visit records and authorization audit
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setHistoryModal(null)}
                  className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200"
                >
                  <FiX className="h-4 w-4" />
                </button>
              </div>

              {/* Statistics Summary Bar */}
              {historyModal.data?.statistics && (
                <div className="my-4 grid grid-cols-3 gap-2 rounded-2xl bg-slate-50 p-3 text-center dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 text-xs">
                  <div>
                    <span className="text-[10px] font-bold uppercase text-slate-400">Total Visits</span>
                    <p className="font-bold text-slate-800 dark:text-slate-200 mt-0.5">
                      {historyModal.data.statistics.totalVisits}
                    </p>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold uppercase text-slate-400">Completed</span>
                    <p className="font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">
                      {historyModal.data.statistics.completedVisits}
                    </p>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold uppercase text-slate-400">Cancelled / Denied</span>
                    <p className="font-bold text-rose-600 dark:text-rose-400 mt-0.5">
                      {historyModal.data.statistics.cancelledVisits}
                    </p>
                  </div>
                </div>
              )}

              {/* History Table */}
              <div className="max-h-60 overflow-y-auto rounded-xl border border-slate-100 dark:border-slate-800">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-100 bg-slate-50/70 text-[10px] font-bold uppercase text-slate-400 dark:border-slate-800 dark:bg-slate-900/50">
                      <th className="py-2.5 px-3">Date</th>
                      <th className="py-2.5 px-3">{historyModal.type === "CHILD" ? "Visitor" : "Child"}</th>
                      <th className="py-2.5 px-3">Entry / Exit</th>
                      <th className="py-2.5 px-3">Duration</th>
                      <th className="py-2.5 px-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {historyLoading ? (
                      <tr>
                        <td colSpan={5} className="py-8 text-center text-slate-400">
                          <p className="text-xs">Loading visit logs...</p>
                        </td>
                      </tr>
                    ) : !historyModal.data?.records || historyModal.data.records.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="py-8 text-center text-slate-400">
                          <p className="text-xs">No historical visit records found.</p>
                        </td>
                      </tr>
                    ) : (
                      historyModal.data.records.map((r) => (
                        <tr key={r.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                          <td className="py-2.5 px-3 font-mono text-[11px] text-slate-600 dark:text-slate-300">
                            {r.date}
                          </td>
                          <td className="py-2.5 px-3 font-bold text-slate-800 dark:text-slate-200">
                            {historyModal.type === "CHILD" ? r.parentName : r.childName}
                          </td>
                          <td className="py-2.5 px-3 text-[11px] text-slate-500">
                            {r.checkInTime ? `${r.checkInTime} → ${r.checkOutTime || "Inside"}` : "Not checked in"}
                          </td>
                          <td className="py-2.5 px-3 font-mono text-[11px] text-slate-600 dark:text-slate-300">
                            {r.duration}
                          </td>
                          <td className="py-2.5 px-3">
                            <span className={classNames(
                              "rounded-md px-1.5 py-0.5 text-[9px] font-bold uppercase",
                              r.status === "COMPLETED"
                                ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400"
                                : "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300"
                            )}>
                              {r.status}
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              <div className="mt-6 flex justify-end">
                <button
                  type="button"
                  onClick={() => setHistoryModal(null)}
                  className="rounded-xl bg-slate-900 px-4 py-2 text-xs font-bold text-white hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
