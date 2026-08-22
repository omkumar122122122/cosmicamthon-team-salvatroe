import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FiPackage, FiClock, FiCheckCircle, FiXCircle, FiCalendar,
  FiPhone, FiMail, FiCheck, FiRefreshCw, FiAlertCircle, FiX,
  FiUser, FiMessageSquare
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

function RejectModal({ onConfirm, onClose }) {
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleConfirm = async () => {
    if (!reason.trim()) return;
    setSubmitting(true);
    await onConfirm(reason.trim());
    setSubmitting(false);
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm"
        onClick={onClose}
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="relative z-10 w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900"
      >
        <h3 className="font-display text-base font-bold text-[#0F172A] dark:text-white mb-3">
          Reason for Rejection
        </h3>
        <textarea
          rows={3}
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="Please provide a reason for rejecting this donation..."
          className="w-full rounded-xl border border-slate-200 bg-white p-3 text-xs text-[#0F172A] outline-none focus:border-red-400 focus:ring-2 focus:ring-red-400/15 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
          autoFocus
        />
        <div className="mt-4 flex gap-2">
          <button
            onClick={onClose}
            className="flex-1 rounded-xl border border-slate-200 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={!reason.trim() || submitting}
            className="flex-1 rounded-xl bg-red-500 py-2 text-xs font-semibold text-white hover:bg-red-600 disabled:opacity-50 transition-colors"
          >
            {submitting ? "Rejecting..." : "Confirm Reject"}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

export default function OrphanageDonationRequests() {
  const [requests, setRequests]         = useState([]);
  const [loading, setLoading]           = useState(true);
  const [error, setError]               = useState(null);
  const [filterStatus, setFilterStatus] = useState("ALL");
  const [actionLoading, setActionLoading] = useState({});
  const [rejectTarget, setRejectTarget]   = useState(null);
  const [toast, setToast]                 = useState(null);

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await donationRequestsService.getIncoming();
      setRequests(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err?.message || "Failed to load donation requests.");
    } finally {
      setLoading(false);
    }
  };

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const handleAction = async (id, status, rejectionReason = "") => {
    setActionLoading((prev) => ({ ...prev, [id]: status }));
    try {
      await donationRequestsService.updateStatus(id, status, rejectionReason);
      setRequests((prev) =>
        prev.map((r) =>
          r.id === id ? { ...r, status, rejectionReason: rejectionReason || null } : r
        )
      );
      showToast(
        status === "ACCEPTED" ? "Donation request accepted!" :
        status === "REJECTED" ? "Donation request rejected." :
        "Donation marked as completed!"
      );
    } catch (err) {
      const msg = err?.data?.message || err?.message || "Action failed.";
      showToast(Array.isArray(msg) ? msg.join(", ") : msg, "error");
    } finally {
      setActionLoading((prev) => ({ ...prev, [id]: null }));
      setRejectTarget(null);
    }
  };

  const filtered =
    filterStatus === "ALL"
      ? requests
      : requests.filter((r) => r.status === filterStatus);

  return (
    <div className="space-y-6">
      {/* Toast */}
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
            {toast.type === "error" ? (
              <FiAlertCircle className="h-4 w-4" />
            ) : (
              <FiCheckCircle className="h-4 w-4" />
            )}
            {toast.msg}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Reject Reason Modal */}
      <AnimatePresence>
        {rejectTarget && (
          <RejectModal
            onConfirm={(reason) => handleAction(rejectTarget, "REJECTED", reason)}
            onClose={() => setRejectTarget(null)}
          />
        )}
      </AnimatePresence>

      {/* Page Header — White Background Style */}
      <div className="relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-purple-50 border border-purple-100 px-3 py-1 text-xs font-semibold text-purple-700 dark:bg-purple-500/10 dark:border-purple-500/20 dark:text-purple-300 mb-2">
              <FiPackage className="h-3.5 w-3.5" />
              <span>Incoming Donation Requests</span>
            </div>
            <h1 className="font-display text-2xl font-extrabold tracking-tight text-[#0F172A] dark:text-white">
              Donations Management
            </h1>
            <p className="mt-1 text-xs text-[#64748B] dark:text-slate-300 max-w-xl">
              Manage and respond to physical goods donation schedules from donors
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
              <button
                key={key}
                onClick={() => setFilterStatus(filterStatus === key ? "ALL" : key)}
                className={`rounded-2xl border bg-white p-4 shadow-sm text-left transition-all dark:bg-slate-900 ${
                  filterStatus === key
                    ? "border-[#2563EB] ring-2 ring-[#2563EB]/20"
                    : "border-slate-200/80 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700"
                }`}
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
              </button>
            );
          })}
        </div>
      )}

      {/* Filter Tabs */}
      {!loading && !error && requests.length > 0 && (
        <div className="flex items-center gap-2 flex-wrap">
          {["ALL", "PENDING", "ACCEPTED", "REJECTED", "COMPLETED"].map((s) => (
            <button
              key={s}
              onClick={() => setFilterStatus(s)}
              className={`rounded-xl px-3 py-1.5 text-xs font-semibold transition-all ${
                filterStatus === s
                  ? "bg-[#2563EB] text-white shadow-sm"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
              }`}
            >
              {s === "ALL" ? `All (${requests.length})` : `${STATUS_CONFIG[s]?.label} (${requests.filter((r) => r.status === s).length})`}
            </button>
          ))}
        </div>
      )}

      {/* Content */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-36 rounded-2xl bg-slate-100 dark:bg-slate-800 animate-pulse" />
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
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-14 text-center dark:border-slate-800 dark:bg-slate-900">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-purple-50 text-purple-600 dark:bg-purple-500/10 mb-4">
            <FiPackage className="h-7 w-7" />
          </div>
          <h3 className="font-display text-base font-bold text-[#0F172A] dark:text-white">
            {filterStatus === "ALL" ? "No donation requests received yet" : `No ${STATUS_CONFIG[filterStatus]?.label} requests`}
          </h3>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
            {filterStatus === "ALL"
              ? "Donation requests from donors will appear here when they schedule a physical goods delivery."
              : "Switch filter to view other requests."}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((req) => {
            const cfg = STATUS_CONFIG[req.status] || STATUS_CONFIG.PENDING;
            const StatusIcon = cfg.icon;
            const emoji = TYPE_EMOJIS[req.donationType] || "📦";
            const isActioning = !!actionLoading[req.id];
            const date = req.preferredDate
              ? new Date(req.preferredDate).toLocaleDateString("en-IN", {
                  weekday: "short", day: "2-digit", month: "short", year: "numeric",
                })
              : "—";

            return (
              <motion.div
                key={req.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900"
              >
                <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                  {/* Left: Donation Info */}
                  <div className="flex items-start gap-4">
                    <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-slate-50 text-3xl dark:bg-slate-800 border border-slate-100 dark:border-slate-700">
                      {emoji}
                    </div>
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-display text-sm font-bold text-[#0F172A] dark:text-white">
                          {req.donationType}
                        </h3>
                        <span className="rounded-lg bg-slate-100 px-2 py-0.5 text-[11px] font-bold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                          × {req.quantity} units
                        </span>
                      </div>

                      {/* Donor Info */}
                      {req.donor && (
                        <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
                          <span className="flex items-center gap-1 font-medium text-[#0F172A] dark:text-slate-200">
                            <FiUser className="h-3.5 w-3.5 text-[#2563EB]" />
                            {req.donor.fullName}
                          </span>
                          <span className="flex items-center gap-1">
                            <FiPhone className="h-3.5 w-3.5 text-[#2563EB]" />
                            {req.donor.mobileNumber}
                          </span>
                          <span className="flex items-center gap-1">
                            <FiMail className="h-3.5 w-3.5 text-[#2563EB]" />
                            {req.donor.email}
                          </span>
                        </div>
                      )}

                      {/* Schedule */}
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
                        <div className="flex items-start gap-1 text-[11px] text-slate-500 dark:text-slate-400 italic">
                          <FiMessageSquare className="h-3.5 w-3.5 mt-0.5 text-slate-400 shrink-0" />
                          <span className="max-w-sm">"{req.message}"</span>
                        </div>
                      )}
                      {req.rejectionReason && (
                        <p className="text-[11px] font-medium text-red-600 dark:text-red-400">
                          Rejection Reason: {req.rejectionReason}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Right: Status + Actions */}
                  <div className="flex flex-col items-start lg:items-end gap-2.5 shrink-0">
                    <span className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-bold ${cfg.bg}`}>
                      <StatusIcon className="h-3.5 w-3.5" />
                      {cfg.label}
                    </span>

                    <span className="text-[11px] text-slate-400 dark:text-slate-500">
                      Received {new Date(req.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
                    </span>

                    {/* Action Buttons */}
                    {req.status === "PENDING" && (
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleAction(req.id, "ACCEPTED")}
                          disabled={isActioning}
                          className="flex items-center gap-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 px-3 py-2 text-xs font-bold text-white transition-all disabled:opacity-50 shadow-sm shadow-emerald-500/20"
                        >
                          {actionLoading[req.id] === "ACCEPTED" ? (
                            <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                          ) : (
                            <FiCheckCircle className="h-3.5 w-3.5" />
                          )}
                          Accept
                        </button>
                        <button
                          onClick={() => setRejectTarget(req.id)}
                          disabled={isActioning}
                          className="flex items-center gap-1.5 rounded-xl border border-red-200 bg-red-50 hover:bg-red-100 px-3 py-2 text-xs font-bold text-red-700 transition-all disabled:opacity-50 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-300 dark:hover:bg-red-500/20"
                        >
                          <FiXCircle className="h-3.5 w-3.5" />
                          Reject
                        </button>
                      </div>
                    )}

                    {req.status === "ACCEPTED" && (
                      <button
                        onClick={() => handleAction(req.id, "COMPLETED")}
                        disabled={isActioning}
                        className="flex items-center gap-1.5 rounded-xl bg-[#2563EB] hover:bg-blue-700 px-3 py-2 text-xs font-bold text-white transition-all disabled:opacity-50 shadow-sm shadow-blue-600/20"
                      >
                        {actionLoading[req.id] === "COMPLETED" ? (
                          <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                        ) : (
                          <FiCheck className="h-3.5 w-3.5" />
                        )}
                        Mark as Completed
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
