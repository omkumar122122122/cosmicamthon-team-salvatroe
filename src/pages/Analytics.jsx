import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FiTrendingUp,
  FiUsers,
  FiUserCheck,
  FiClock,
  FiCheckCircle,
  FiActivity,
  FiCalendar,
  FiDownload,
  FiPrinter,
  FiRefreshCw,
  FiShield,
  FiAlertTriangle,
  FiPieChart,
  FiBarChart2,
  FiHeart,
  FiLayers,
  FiFilter,
  FiInfo,
} from "react-icons/fi";
import Card from "../components/Card.jsx";
import { analyticsService } from "../services/analyticsService.js";
import { classNames } from "../utils/formatters.js";

const PERIOD_OPTIONS = [
  { id: "today", label: "Today" },
  { id: "7d", label: "Last 7 Days" },
  { id: "30d", label: "Last 30 Days" },
  { id: "90d", label: "Last 3 Months" },
  { id: "year", label: "This Year" },
];

export default function Analytics() {
  const [period, setPeriod] = useState("30d");
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [exporting, setExporting] = useState(null);

  useEffect(() => {
    loadAnalytics();
  }, [period]);

  async function loadAnalytics(silent = false) {
    if (!silent) setLoading(true);
    else setRefreshing(true);

    try {
      const res = await analyticsService.getManagementAnalytics(period);
      setData(res);
    } catch (err) {
      console.error("Failed to load analytics:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  const handleExportCsv = async (type) => {
    setExporting(type);
    await analyticsService.exportCsv(type);
    setExporting(null);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6 pb-16 print:p-0 print:space-y-4">
      {/* ── Page Header & Action Bar ──────────────────────────── */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between print:hidden">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400">
              <FiTrendingUp className="h-4 w-4" />
            </span>
            <h1 className="text-xl font-bold text-slate-900 dark:text-white font-display">
              Management Intelligence & Advanced Analytics
            </h1>
          </div>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            Authoritative operational statistics, visit duration trends, gate movements, and compliance intelligence
          </p>
        </div>

        {/* Global Period Selector & Export Actions */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Period Tabs */}
          <div className="flex rounded-xl bg-slate-100 p-1 dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800">
            {PERIOD_OPTIONS.map((opt) => (
              <button
                key={opt.id}
                type="button"
                onClick={() => setPeriod(opt.id)}
                className={classNames(
                  "rounded-lg px-2.5 py-1.5 text-xs font-bold font-display transition-all",
                  period === opt.id
                    ? "bg-white text-indigo-600 shadow-2xs dark:bg-slate-800 dark:text-indigo-400"
                    : "text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
                )}
              >
                {opt.label}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={() => handleExportCsv("visits")}
            disabled={exporting !== null}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 shadow-2xs hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200"
          >
            <FiDownload className="h-3.5 w-3.5" />
            <span>{exporting === "visits" ? "Exporting..." : "Visits CSV"}</span>
          </button>

          <button
            type="button"
            onClick={() => handleExportCsv("gate")}
            disabled={exporting !== null}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 shadow-2xs hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200"
          >
            <FiDownload className="h-3.5 w-3.5" />
            <span>{exporting === "gate" ? "Exporting..." : "Gate CSV"}</span>
          </button>

          <button
            type="button"
            onClick={handlePrint}
            className="inline-flex items-center gap-1.5 rounded-xl bg-slate-900 px-3.5 py-1.5 text-xs font-bold text-white shadow-2xs hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900"
          >
            <FiPrinter className="h-3.5 w-3.5" />
            <span>Print Report</span>
          </button>
        </div>
      </div>

      {/* ── Print Header (Visible Only in Print Mode) ─────────── */}
      <div className="hidden print:block border-b border-slate-200 pb-4">
        <h2 className="text-xl font-bold text-slate-900 font-display">
          VELORA — Child Safety & Orphanage Operations Executive Report
        </h2>
        <div className="mt-1 flex justify-between text-xs text-slate-500">
          <span>Reporting Period: {period.toUpperCase()}</span>
          <span>Generated On: {new Date().toLocaleString()}</span>
        </div>
      </div>

      {/* ── Top Overview KPI Cards ─────────────────────────────── */}
      {data?.overview && (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Card className="border-slate-200/90 dark:border-slate-800 p-4">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total Children</span>
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-rose-50 text-rose-600 dark:bg-rose-500/10 dark:text-rose-400">
                <FiHeart className="h-4 w-4" />
              </div>
            </div>
            <p className="mt-1 text-2xl font-black text-slate-900 dark:text-white font-display">
              {data.overview.totalChildren}
            </p>
            <span className="text-[10px] text-slate-400 mt-1 block">Active welfare profiles registered</span>
          </Card>

          <Card className="border-slate-200/90 dark:border-slate-800 p-4">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total Staff</span>
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400">
                <FiUsers className="h-4 w-4" />
              </div>
            </div>
            <p className="mt-1 text-2xl font-black text-slate-900 dark:text-white font-display">
              {data.overview.totalStaff}
            </p>
            <span className="text-[10px] text-slate-400 mt-1 block">Caregivers, security & medical</span>
          </Card>

          <Card className="border-slate-200/90 dark:border-slate-800 p-4">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total Parents</span>
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400">
                <FiUserCheck className="h-4 w-4" />
              </div>
            </div>
            <p className="mt-1 text-2xl font-black text-indigo-600 dark:text-indigo-400 font-display">
              {data.overview.totalParents}
            </p>
            <span className="text-[10px] text-slate-400 mt-1 block">KYC-verified prospective adopters</span>
          </Card>

          <Card className="border-slate-200/90 dark:border-slate-800 p-4">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total Adoptions</span>
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400">
                <FiCheckCircle className="h-4 w-4" />
              </div>
            </div>
            <p className="mt-1 text-2xl font-black text-emerald-600 dark:text-emerald-400 font-display">
              {data.overview.totalAdoptions}
            </p>
            <span className="text-[10px] text-slate-400 mt-1 block">Transparent verified placements</span>
          </Card>
        </div>
      )}

      {/* ── Key Factual Management Insights ────────────────────── */}
      {data?.insights && (
        <Card className="border-indigo-100 bg-indigo-50/40 p-4 dark:border-indigo-900/30 dark:bg-indigo-950/20">
          <div className="flex items-center gap-2 mb-2">
            <FiInfo className="text-indigo-600 dark:text-indigo-400 h-4 w-4" />
            <h3 className="font-display text-xs font-bold uppercase tracking-wider text-indigo-900 dark:text-indigo-300">
              Key Operational Insights ({period.toUpperCase()})
            </h3>
          </div>
          <div className="grid gap-2 sm:grid-cols-2 text-xs text-slate-700 dark:text-slate-300">
            {data.insights.map((ins, idx) => (
              <div key={idx} className="flex items-start gap-2">
                <span className="text-indigo-500 font-bold">•</span>
                <span>{ins}</span>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* ── Charts Grid: Trends & Movements ─────────────────────── */}
      {data?.trends && (
        <div className="grid gap-4 lg:grid-cols-2">
          {/* Chart 1: Visits Trend Over Time */}
          <Card className="border-slate-200/90 dark:border-slate-800 p-4 shadow-card">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div>
                <h3 className="font-display text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <FiBarChart2 className="text-indigo-500" />
                  <span>Visits Over Time Trend</span>
                </h3>
                <p className="text-[11px] text-slate-400">Scheduled vs Completed Visits Progression</p>
              </div>
              <span className="rounded-lg bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                {data.trends.labels.length} Data Points
              </span>
            </div>

            {/* Visual Bar Chart */}
            <div className="mt-6 flex items-end justify-between gap-2 h-44 pt-4 px-2">
              {data.trends.labels.map((label, idx) => {
                const count = data.trends.visits[idx] || 0;
                const heightPct = Math.max(12, Math.min(100, count * 18));
                return (
                  <div key={idx} className="flex-1 flex flex-col items-center gap-1 group relative">
                    <div className="absolute -top-7 rounded bg-slate-900 px-1.5 py-0.5 text-[9px] font-bold text-white opacity-0 group-hover:opacity-100 transition-opacity">
                      {count} Visits
                    </div>
                    <div
                      style={{ height: `${heightPct}%` }}
                      className="w-full max-w-[28px] rounded-t-lg bg-indigo-500 group-hover:bg-indigo-600 transition-all"
                    />
                    <span className="text-[9px] text-slate-400 truncate w-full text-center mt-1">
                      {label.split(" ")[1] || label}
                    </span>
                  </div>
                );
              })}
            </div>
          </Card>

          {/* Chart 2: Gate Movements Entries vs Exits */}
          <Card className="border-slate-200/90 dark:border-slate-800 p-4 shadow-card">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div>
                <h3 className="font-display text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <FiActivity className="text-emerald-500" />
                  <span>Gate Movements: Entries vs Exits</span>
                </h3>
                <p className="text-[11px] text-slate-400">Checkpoint movement volume comparison</p>
              </div>
              <div className="flex items-center gap-3 text-[10px] font-bold">
                <span className="flex items-center gap-1 text-emerald-600"><span className="h-2 w-2 rounded-full bg-emerald-500" /> Entries</span>
                <span className="flex items-center gap-1 text-purple-600"><span className="h-2 w-2 rounded-full bg-purple-500" /> Exits</span>
              </div>
            </div>

            {/* Visual Movement Pairs Chart */}
            <div className="mt-6 flex items-end justify-between gap-2 h-44 pt-4 px-2">
              {data.trends.labels.map((label, idx) => {
                const entries = data.trends.entries[idx] || 0;
                const exits = data.trends.exits[idx] || 0;
                const entryHeight = Math.max(10, Math.min(100, entries * 10));
                const exitHeight = Math.max(10, Math.min(100, exits * 10));

                return (
                  <div key={idx} className="flex-1 flex flex-col items-center gap-1 group relative">
                    <div className="absolute -top-7 rounded bg-slate-900 px-1.5 py-0.5 text-[9px] font-bold text-white opacity-0 group-hover:opacity-100 transition-opacity">
                      ↑{entries} / ↓{exits}
                    </div>
                    <div className="flex items-end gap-0.5 w-full justify-center">
                      <div style={{ height: `${entryHeight}%` }} className="w-1/2 max-w-[12px] rounded-t bg-emerald-500" />
                      <div style={{ height: `${exitHeight}%` }} className="w-1/2 max-w-[12px] rounded-t bg-purple-500" />
                    </div>
                    <span className="text-[9px] text-slate-400 truncate w-full text-center mt-1">
                      {label.split(" ")[1] || label}
                    </span>
                  </div>
                );
              })}
            </div>
          </Card>
        </div>
      )}

      {/* ── Sub-Sections: Visit Durations, Overstay, Demographics ─── */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {/* Sub-Card 1: Visit Duration & Compliance */}
        {data?.visitAnalytics && (
          <Card className="border-slate-200/90 dark:border-slate-800 p-4 shadow-card">
            <h3 className="font-display text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-1.5">
              <FiClock className="text-indigo-500" />
              <span>Visit Duration Intelligence</span>
            </h3>
            <div className="space-y-3 text-xs">
              <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-500">Average Duration</span>
                <span className="font-bold text-indigo-600 dark:text-indigo-400 font-mono">
                  {data.visitAnalytics.avgDurationMinutes} min
                </span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-500">Shortest Verified Visit</span>
                <span className="font-mono text-slate-700 dark:text-slate-300">
                  {data.visitAnalytics.shortestDurationMinutes} min
                </span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-500">Longest Verified Visit</span>
                <span className="font-mono text-slate-700 dark:text-slate-300">
                  {data.visitAnalytics.longestDurationMinutes} min
                </span>
              </div>
              <div className="flex justify-between py-1.5">
                <span className="text-slate-500">Completion Compliance</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400">
                  {data.visitAnalytics.completionRate}%
                </span>
              </div>
            </div>
          </Card>
        )}

        {/* Sub-Card 2: Overstay & Late Arrival Metrics */}
        {data?.visitAnalytics?.overstays && (
          <Card className="border-slate-200/90 dark:border-slate-800 p-4 shadow-card">
            <h3 className="font-display text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-1.5">
              <FiAlertTriangle className="text-amber-500" />
              <span>Overstay & Arrival Anomalies</span>
            </h3>
            <div className="space-y-3 text-xs">
              <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-500">Total Overstay Incidents</span>
                <span className="font-bold text-amber-600 dark:text-amber-400">
                  {data.visitAnalytics.overstays.total}
                </span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-500">Average Overstay Duration</span>
                <span className="font-mono text-slate-700 dark:text-slate-300">
                  +{data.visitAnalytics.overstays.avgMinutes} min
                </span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-500">Total Late Arrivals</span>
                <span className="font-mono text-slate-700 dark:text-slate-300">
                  {data.visitAnalytics.lateArrivals.total}
                </span>
              </div>
              <div className="flex justify-between py-1.5">
                <span className="text-slate-500">Average Late Arrival Delay</span>
                <span className="font-mono text-slate-700 dark:text-slate-300">
                  +{data.visitAnalytics.lateArrivals.avgMinutes} min
                </span>
              </div>
            </div>
          </Card>
        )}

        {/* Sub-Card 3: Population Demographics & Age */}
        {data?.demographics?.ageDistribution && (
          <Card className="border-slate-200/90 dark:border-slate-800 p-4 shadow-card">
            <h3 className="font-display text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-1.5">
              <FiPieChart className="text-purple-500" />
              <span>Child Population Demographics</span>
            </h3>
            <div className="space-y-2 text-xs">
              {Object.entries(data.demographics.ageDistribution).map(([ageGroup, count]) => (
                <div key={ageGroup} className="space-y-1">
                  <div className="flex justify-between text-[11px]">
                    <span className="text-slate-600 dark:text-slate-400">{ageGroup}</span>
                    <span className="font-bold text-slate-900 dark:text-white">{count} children</span>
                  </div>
                  <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div
                      style={{ width: `${Math.max(8, (count / (data.overview.totalChildren || 1)) * 100)}%` }}
                      className="h-full bg-purple-500 rounded-full"
                    />
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}
      </div>

      {/* ── Status Distribution & Gate Denial Reasons ──────────── */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* Visit Status Distribution Breakdown */}
        {data?.visitAnalytics && (
          <Card className="border-slate-200/90 dark:border-slate-800 p-4 shadow-card">
            <h3 className="font-display text-sm font-bold text-slate-900 dark:text-white mb-4">
              Visit Status Lifecycle Distribution
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center text-xs">
              <div className="rounded-xl bg-emerald-50 p-3 dark:bg-emerald-500/10 border border-emerald-100 dark:border-emerald-500/20">
                <span className="text-[10px] font-bold uppercase text-emerald-700 dark:text-emerald-400">Completed</span>
                <p className="text-xl font-black text-emerald-800 dark:text-emerald-300 font-display mt-1">
                  {data.visitAnalytics.completed}
                </p>
              </div>
              <div className="rounded-xl bg-indigo-50 p-3 dark:bg-indigo-500/10 border border-indigo-100 dark:border-indigo-500/20">
                <span className="text-[10px] font-bold uppercase text-indigo-700 dark:text-indigo-400">Approved</span>
                <p className="text-xl font-black text-indigo-800 dark:text-indigo-300 font-display mt-1">
                  {data.visitAnalytics.approved}
                </p>
              </div>
              <div className="rounded-xl bg-slate-100 p-3 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                <span className="text-[10px] font-bold uppercase text-slate-600 dark:text-slate-400">Pending</span>
                <p className="text-xl font-black text-slate-800 dark:text-slate-200 font-display mt-1">
                  {data.visitAnalytics.pending}
                </p>
              </div>
              <div className="rounded-xl bg-rose-50 p-3 dark:bg-rose-500/10 border border-rose-100 dark:border-rose-500/20">
                <span className="text-[10px] font-bold uppercase text-rose-700 dark:text-rose-400">Cancelled/Denied</span>
                <p className="text-xl font-black text-rose-800 dark:text-rose-300 font-display mt-1">
                  {data.visitAnalytics.cancelled + data.visitAnalytics.rejected}
                </p>
              </div>
            </div>
          </Card>
        )}

        {/* Gate Denial Security Analysis */}
        {data?.gateAnalytics?.denialReasons && (
          <Card className="border-slate-200/90 dark:border-slate-800 p-4 shadow-card">
            <h3 className="font-display text-sm font-bold text-slate-900 dark:text-white mb-4">
              Checkpoint Access Denial Reasons
            </h3>
            <div className="space-y-2.5 text-xs">
              <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-600 dark:text-slate-400">Invalid / Unregistered Pass</span>
                <span className="font-bold text-rose-600 dark:text-rose-400">{data.gateAnalytics.denialReasons.INVALID_QR}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-600 dark:text-slate-400">Expired Visit Window</span>
                <span className="font-bold text-rose-600 dark:text-rose-400">{data.gateAnalytics.denialReasons.EXPIRED_PASS}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-600 dark:text-slate-400">Wrong Date / Out-of-Schedule</span>
                <span className="font-bold text-rose-600 dark:text-rose-400">{data.gateAnalytics.denialReasons.WRONG_DATE}</span>
              </div>
              <div className="flex justify-between py-1.5">
                <span className="text-slate-600 dark:text-slate-400">Unauthorized Staff RFID</span>
                <span className="font-bold text-rose-600 dark:text-rose-400">{data.gateAnalytics.denialReasons.UNAUTHORIZED_RFID}</span>
              </div>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
