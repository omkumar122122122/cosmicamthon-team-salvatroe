import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  FiPackage, FiClock, FiCheckCircle, FiXCircle, FiCalendar,
  FiMapPin, FiRefreshCw, FiAlertCircle, FiCheck
} from "react-icons/fi";
import { donationRequestsService } from "../services/donationRequestsService";

const STATUS_CONFIG = {
  PENDING:   { label: "Pending",   icon: FiClock,       bg: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/10 dark:text-amber-300 dark:border-amber-500/30" },
  ACCEPTED:  { label: "Accepted",  icon: FiCheckCircle, bg: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-300 dark:border-emerald-500/30" },
  REJECTED:  { label: "Rejected",  icon: FiXCircle,     bg: "bg-red-50 text-red-700 border-red-200 dark:bg-red-500/10 dark:text-red-300 dark:border-red-500/30" },
  COMPLETED: { label: "Completed", icon: FiCheck,        bg: "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-500/10 dark:text-blue-300 dark:border-blue-500/30" },
};

const TYPE_EMOJIS = {
  Food: "🍱", Clothes: "👕", Books: "📚", "School Supplies": "✏️",
  Toys: "🧸", Medicine: "💊", Furniture: "🪑", Other: "📦",
};

export default function DonorRequests() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState(null);

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
      setError(err?.message || "Failed to load donation requests.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header — White Background Style */}
      <div className="relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-blue-50 border border-blue-100 px-3 py-1 text-xs font-semibold text-[#2563EB] dark:bg-blue-500/10 dark:border-blue-500/20 dark:text-blue-300 mb-2">
              <FiPackage className="h-3.5 w-3.5" />
              <span>Donation Scheduler</span>
            </div>
            <h1 className="font-display text-2xl font-extrabold tracking-tight text-[#0F172A] dark:text-white">
              My Donation Requests
            </h1>
            <p className="mt-1 text-xs text-[#64748B] dark:text-slate-300 max-w-xl">
              Track your scheduled physical donation drop-offs and their status
            </p>
          </div>
          <button
            onClick={fetchRequests}
            className="flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700/80 px-4 py-2.5 text-xs font-bold text-slate-700 dark:text-slate-200 shadow-sm transition-all shrink-0"
          >
            <FiRefreshCw className="h-4 w-4" />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Stats Row */}
      {!loading && !error && requests.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {Object.entries(STATUS_CONFIG).map(([key, cfg]) => {
            const Icon = cfg.icon;
            const count = requests.filter((r) => r.status === key).length;
            return (
              <div
                key={key}
                className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 font-display uppercase tracking-wide">
                    {cfg.label}
                  </span>
                  <Icon className={`h-4 w-4 ${key === "PENDING" ? "text-amber-500" : key === "ACCEPTED" ? "text-emerald-500" : key === "REJECTED" ? "text-red-500" : "text-blue-500"}`} />
                </div>
                <span className="font-display text-2xl font-extrabold text-[#0F172A] dark:text-white">
                  {count}
                </span>
              </div>
            );
          })}
        </div>
      )}

      {/* Content */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-28 rounded-2xl bg-slate-100 dark:bg-slate-800 animate-pulse" />
          ))}
        </div>
      ) : error ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-center dark:border-red-500/20 dark:bg-red-500/10">
          <FiAlertCircle className="mx-auto h-7 w-7 text-red-500 mb-2" />
          <p className="text-sm font-semibold text-red-700 dark:text-red-300">{error}</p>
          <button onClick={fetchRequests} className="mt-3 text-xs text-red-600 underline hover:text-red-800">
            Try again
          </button>
        </div>
      ) : requests.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-14 text-center dark:border-slate-800 dark:bg-slate-900">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-[#2563EB] dark:bg-blue-500/10 mb-4">
            <FiPackage className="h-7 w-7" />
          </div>
          <h3 className="font-display text-base font-bold text-[#0F172A] dark:text-white">
            No donation requests yet
          </h3>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
            Go to the Donor Dashboard, click <strong>Donate</strong> on an orphanage card,
            and schedule your first physical goods donation.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {requests.map((req) => {
            const cfg = STATUS_CONFIG[req.status] || STATUS_CONFIG.PENDING;
            const StatusIcon = cfg.icon;
            const emoji = TYPE_EMOJIS[req.donationType] || "📦";
            const date = req.preferredDate
              ? new Date(req.preferredDate).toLocaleDateString("en-IN", {
                  day: "2-digit", month: "short", year: "numeric",
                })
              : "—";

            return (
              <motion.div
                key={req.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm hover:shadow-md transition-all dark:border-slate-800 dark:bg-slate-900"
              >
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                  {/* Left: Type + Details */}
                  <div className="flex items-start gap-4">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-slate-100 text-2xl dark:bg-slate-800">
                      {emoji}
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-display text-sm font-bold text-[#0F172A] dark:text-white">
                          {req.donationType}
                        </h3>
                        <span className="text-[11px] text-slate-500 dark:text-slate-400">
                          × {req.quantity} units
                        </span>
                      </div>
                      <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
                        <span className="flex items-center gap-1">
                          <FiCalendar className="h-3.5 w-3.5 text-[#2563EB]" />
                          {date}
                        </span>
                        <span className="flex items-center gap-1">
                          <FiClock className="h-3.5 w-3.5 text-[#2563EB]" />
                          {req.preferredTime}
                        </span>
                      </div>
                      {req.message && (
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 italic max-w-xs truncate">
                          "{req.message}"
                        </p>
                      )}
                      {req.rejectionReason && (
                        <p className="text-[11px] font-medium text-red-600 dark:text-red-400 max-w-xs">
                          Reason: {req.rejectionReason}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Right: Status Badge + Date Submitted */}
                  <div className="flex flex-col items-start sm:items-end gap-2 shrink-0">
                    <span className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-bold ${cfg.bg}`}>
                      <StatusIcon className="h-3.5 w-3.5" />
                      {cfg.label}
                    </span>
                    <span className="text-[11px] text-slate-400 dark:text-slate-500">
                      Submitted{" "}
                      {new Date(req.createdAt).toLocaleDateString("en-IN", {
                        day: "2-digit", month: "short", year: "numeric",
                      })}
                    </span>
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
