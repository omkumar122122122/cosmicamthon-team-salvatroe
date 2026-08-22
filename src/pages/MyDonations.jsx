import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FiPackage, FiClock, FiCheckCircle, FiXCircle, FiCalendar,
  FiMapPin, FiRefreshCw, FiAlertCircle, FiCheck, FiAward,
  FiSlash, FiPhone, FiMail, FiMessageSquare, FiFilter
} from "react-icons/fi";
import { donationRequestsService } from "../services/donationRequestsService";

const STATUS_CONFIG = {
  PENDING:   { label: "Pending",   icon: FiClock,       bg: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/10 dark:text-amber-300 dark:border-amber-500/30" },
  ACCEPTED:  { label: "Accepted",  icon: FiCheckCircle, bg: "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-500/10 dark:text-blue-300 dark:border-blue-500/30" },
  REJECTED:  { label: "Rejected",  icon: FiXCircle,     bg: "bg-red-50 text-red-700 border-red-200 dark:bg-red-500/10 dark:text-red-300 dark:border-red-500/30" },
  COMPLETED: { label: "Completed", icon: FiAward,       bg: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-300 dark:border-emerald-500/30" },
  CANCELLED: { label: "Cancelled", icon: FiSlash,       bg: "bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700" },
};

const TYPE_EMOJIS = {
  Food: "🍱", Clothes: "👕", Books: "📚", "School Supplies": "✏️",
  Toys: "🧸", Medicine: "💊", Furniture: "🪑", Other: "📦",
};

export default function MyDonations() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState(null);
  const [activeTab, setActiveTab] = useState("ALL"); // ALL, UPCOMING, COMPLETED, REJECTED, CANCELLED
  const [cancellingId, setCancellingId] = useState(null);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await donationRequestsService.getMyRequests();
      setRequests(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err?.message || "Failed to load your donation records.");
    } finally {
      setLoading(false);
    }
  };

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const handleCancel = async (id) => {
    if (!window.confirm("Are you sure you want to cancel this scheduled donation?")) return;
    setCancellingId(id);
    try {
      await donationRequestsService.cancel(id);
      setRequests((prev) =>
        prev.map((r) => (r.id === id ? { ...r, status: "CANCELLED" } : r))
      );
      showToast("Donation schedule cancelled.");
    } catch (err) {
      showToast(err?.message || "Failed to cancel donation.", "error");
    } finally {
      setCancellingId(null);
    }
  };

  // Filter requests based on tab
  const filteredRequests = useMemo(() => {
    if (activeTab === "ALL") return requests;
    if (activeTab === "UPCOMING") {
      return requests.filter((r) => r.status === "PENDING" || r.status === "ACCEPTED");
    }
    if (activeTab === "COMPLETED") {
      return requests.filter((r) => r.status === "COMPLETED");
    }
    if (activeTab === "REJECTED") {
      return requests.filter((r) => r.status === "REJECTED");
    }
    if (activeTab === "CANCELLED") {
      return requests.filter((r) => r.status === "CANCELLED");
    }
    return requests;
  }, [requests, activeTab]);

  // Counts for tabs
  const upcomingCount = useMemo(() => requests.filter((r) => r.status === "PENDING" || r.status === "ACCEPTED").length, [requests]);
  const completedCount = useMemo(() => requests.filter((r) => r.status === "COMPLETED").length, [requests]);
  const rejectedCount = useMemo(() => requests.filter((r) => r.status === "REJECTED").length, [requests]);
  const cancelledCount = useMemo(() => requests.filter((r) => r.status === "CANCELLED").length, [requests]);

  return (
    <div className="space-y-6">
      {/* Toast alert */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className={`fixed top-4 right-4 z-50 flex items-center gap-2 rounded-xl border px-4 py-3 text-xs font-semibold shadow-lg ${
              toast.type === "error"
                ? "border-red-200 bg-red-50 text-red-700 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-300"
                : "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-300"
            }`}
          >
            {toast.type === "error" ? <FiAlertCircle className="h-4 w-4" /> : <FiCheckCircle className="h-4 w-4" />}
            {toast.msg}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Top Banner Header — White Background Style */}
      <div className="relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-6 sm:p-7 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-blue-50 border border-blue-100 px-3 py-1 text-xs font-semibold text-[#2563EB] dark:bg-blue-500/10 dark:border-blue-500/20 dark:text-blue-300 mb-2">
              <FiPackage className="h-3.5 w-3.5" />
              <span>Philanthropic Schedule Ledger</span>
            </div>
            <h1 className="font-display text-2xl sm:text-3xl font-extrabold tracking-tight text-[#0F172A] dark:text-white">
              My Donations
            </h1>
            <p className="mt-1 text-xs sm:text-sm text-[#64748B] dark:text-slate-300 max-w-xl">
              Track your upcoming, completed, rejected, and cancelled physical goods donations
            </p>
          </div>

          <button
            onClick={fetchRequests}
            className="flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700/80 px-4 py-2.5 text-xs font-bold text-slate-700 dark:text-slate-200 shadow-sm transition-all shrink-0"
          >
            <FiRefreshCw className="h-4 w-4" />
            <span>Refresh Ledger</span>
          </button>
        </div>
      </div>

      {/* Filter Navigation Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        <button
          onClick={() => setActiveTab("ALL")}
          className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-semibold transition-all shrink-0 ${
            activeTab === "ALL"
              ? "bg-[#2563EB] text-white shadow-md shadow-blue-600/20"
              : "bg-white text-slate-600 hover:bg-slate-100 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 border border-slate-200/80 dark:border-slate-700"
          }`}
        >
          <span>All Donations</span>
          <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${activeTab === "ALL" ? "bg-white/20 text-white" : "bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300"}`}>
            {requests.length}
          </span>
        </button>

        {/* Upcoming Donations Tab */}
        <button
          onClick={() => setActiveTab("UPCOMING")}
          className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-semibold transition-all shrink-0 ${
            activeTab === "UPCOMING"
              ? "bg-blue-600 text-white shadow-md shadow-blue-600/20"
              : "bg-white text-slate-600 hover:bg-slate-100 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 border border-slate-200/80 dark:border-slate-700"
          }`}
        >
          <FiClock className="h-3.5 w-3.5" />
          <span>Upcoming Donations</span>
          <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${activeTab === "UPCOMING" ? "bg-white/20 text-white" : "bg-blue-50 text-blue-700 dark:bg-blue-500/15 dark:text-blue-300"}`}>
            {upcomingCount}
          </span>
        </button>

        {/* Completed Donations Tab */}
        <button
          onClick={() => setActiveTab("COMPLETED")}
          className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-semibold transition-all shrink-0 ${
            activeTab === "COMPLETED"
              ? "bg-emerald-600 text-white shadow-md shadow-emerald-600/20"
              : "bg-white text-slate-600 hover:bg-slate-100 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 border border-slate-200/80 dark:border-slate-700"
          }`}
        >
          <FiAward className="h-3.5 w-3.5" />
          <span>Completed Donations</span>
          <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${activeTab === "COMPLETED" ? "bg-white/20 text-white" : "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300"}`}>
            {completedCount}
          </span>
        </button>

        {/* Rejected Donations Tab */}
        <button
          onClick={() => setActiveTab("REJECTED")}
          className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-semibold transition-all shrink-0 ${
            activeTab === "REJECTED"
              ? "bg-red-600 text-white shadow-md shadow-red-600/20"
              : "bg-white text-slate-600 hover:bg-slate-100 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 border border-slate-200/80 dark:border-slate-700"
          }`}
        >
          <FiXCircle className="h-3.5 w-3.5" />
          <span>Rejected Donations</span>
          <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${activeTab === "REJECTED" ? "bg-white/20 text-white" : "bg-red-50 text-red-700 dark:bg-red-500/15 dark:text-red-300"}`}>
            {rejectedCount}
          </span>
        </button>

        {/* Cancelled Donations Tab */}
        <button
          onClick={() => setActiveTab("CANCELLED")}
          className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-semibold transition-all shrink-0 ${
            activeTab === "CANCELLED"
              ? "bg-slate-700 text-white shadow-md"
              : "bg-white text-slate-600 hover:bg-slate-100 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 border border-slate-200/80 dark:border-slate-700"
          }`}
        >
          <FiSlash className="h-3.5 w-3.5" />
          <span>Cancelled Donations</span>
          <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${activeTab === "CANCELLED" ? "bg-white/20 text-white" : "bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300"}`}>
            {cancelledCount}
          </span>
        </button>
      </div>

      {/* Main Content Area */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-32 rounded-2xl bg-slate-100 dark:bg-slate-800 animate-pulse" />
          ))}
        </div>
      ) : error ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-center dark:border-red-500/20 dark:bg-red-500/10">
          <FiAlertCircle className="mx-auto h-7 w-7 text-red-500 mb-2" />
          <p className="text-sm font-semibold text-red-700 dark:text-red-300">{error}</p>
          <button onClick={fetchRequests} className="mt-3 text-xs text-red-600 underline font-semibold">
            Try again
          </button>
        </div>
      ) : filteredRequests.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-14 text-center dark:border-slate-800 dark:bg-slate-900">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-[#2563EB] dark:bg-blue-500/10 mb-4">
            <FiPackage className="h-7 w-7" />
          </div>
          <h3 className="font-display text-base font-bold text-[#0F172A] dark:text-white">
            No {activeTab.toLowerCase()} donations found
          </h3>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
            {activeTab === "ALL"
              ? "You haven't scheduled any physical goods donations yet."
              : `There are no donations categorized under ${activeTab.toLowerCase()}.`}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredRequests.map((req) => {
            const cfg = STATUS_CONFIG[req.status] || STATUS_CONFIG.PENDING;
            const StatusIcon = cfg.icon;
            const emoji = TYPE_EMOJIS[req.donationType] || "📦";
            const dateStr = req.preferredDate
              ? new Date(req.preferredDate).toLocaleDateString("en-IN", {
                  weekday: "short",
                  day: "2-digit",
                  month: "short",
                  year: "numeric",
                })
              : "—";

            const orphanageName = req.orphanage?.name || "Care Home Facility";
            const orphanageCity = req.orphanage?.city || "Delhi";

            return (
              <motion.div
                key={req.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm hover:shadow-md transition-all dark:border-slate-800 dark:bg-slate-900"
              >
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  {/* Left Column: Emoji + Details */}
                  <div className="flex items-start gap-4">
                    <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-slate-50 text-3xl dark:bg-slate-800 border border-slate-100 dark:border-slate-700">
                      {emoji}
                    </div>

                    <div className="space-y-1">
                      {/* Orphanage Name */}
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-display text-base font-bold text-[#0F172A] dark:text-white">
                          {orphanageName}
                        </h3>
                        <span className="inline-flex items-center gap-1 text-xs text-slate-500 font-medium">
                          <FiMapPin className="h-3 w-3 text-blue-500" />
                          {orphanageCity}
                        </span>
                      </div>

                      {/* Donation Type + Quantity */}
                      <div className="flex items-center gap-2 text-xs">
                        <span className="font-bold text-[#2563EB] dark:text-blue-400">
                          {req.donationType}
                        </span>
                        <span className="text-slate-400">•</span>
                        <span className="font-semibold text-slate-700 dark:text-slate-300">
                          Quantity: {req.quantity} units
                        </span>
                      </div>

                      {/* Date & Time */}
                      <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 dark:text-slate-400 pt-0.5">
                        <span className="flex items-center gap-1 font-medium">
                          <FiCalendar className="h-3.5 w-3.5 text-blue-500" />
                          {dateStr}
                        </span>
                        <span className="flex items-center gap-1 font-medium">
                          <FiClock className="h-3.5 w-3.5 text-blue-500" />
                          {req.preferredTime}
                        </span>
                      </div>

                      {/* Optional message or rejection reason */}
                      {req.message && (
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 italic pt-1">
                          "{req.message}"
                        </p>
                      )}
                      {req.rejectionReason && (
                        <p className="text-[11px] font-semibold text-red-600 dark:text-red-400 pt-1">
                          Rejection Reason: {req.rejectionReason}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Right Column: Status Badge + Action */}
                  <div className="flex flex-col items-start md:items-end gap-3 shrink-0">
                    {/* Status Badge */}
                    {req.status === "COMPLETED" ? (
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500 text-white px-3.5 py-1 text-xs font-extrabold shadow-sm shadow-emerald-500/25">
                        <FiCheckCircle className="h-4 w-4" />
                        Completed
                      </span>
                    ) : (
                      <span className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-bold ${cfg.bg}`}>
                        <StatusIcon className="h-3.5 w-3.5" />
                        {cfg.label}
                      </span>
                    )}

                    <span className="text-[11px] text-slate-400">
                      ID: <code className="font-mono text-[10px]">{req.id.substring(0, 8)}</code>
                    </span>

                    {/* Cancel action if pending or accepted */}
                    {(req.status === "PENDING" || req.status === "ACCEPTED") && (
                      <button
                        onClick={() => handleCancel(req.id)}
                        disabled={cancellingId === req.id}
                        className="text-xs font-semibold text-red-600 hover:text-red-700 hover:underline disabled:opacity-50 flex items-center gap-1"
                      >
                        <FiSlash className="h-3 w-3" />
                        <span>{cancellingId === req.id ? "Cancelling..." : "Cancel Schedule"}</span>
                      </button>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
