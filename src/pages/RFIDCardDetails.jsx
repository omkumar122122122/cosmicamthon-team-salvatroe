import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  FiShield,
  FiCheckCircle,
  FiAlertCircle,
  FiUser,
  FiCreditCard,
  FiLogIn,
  FiLogOut,
  FiCalendar,
  FiClock,
  FiMapPin,
  FiCopy,
  FiCheck,
  FiArrowLeft,
} from "react-icons/fi";
import { rfidService } from "../services/rfidService.js";
import { classNames } from "../utils/formatters.js";

export default function RFIDCardDetails() {
  const { rfidId } = useParams();
  const navigate = useNavigate();

  const [record, setRecord] = useState(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    async function loadRecord() {
      setLoading(true);
      try {
        const found = await rfidService.getRecordByTag(rfidId);
        setRecord(found);
      } catch (err) {
        console.error("Error loading RFID record:", err);
        setRecord(null);
      } finally {
        setLoading(false);
      }
    }

    if (rfidId) {
      loadRecord();
    }
  }, [rfidId]);

  const handleCopyLink = async () => {
    try {
      const url = `${window.location.origin}/rfid/${record?.rfidTag || rfidId}`;
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(url);
      } else {
        // Fallback for non-secure contexts
        const textarea = document.createElement("textarea");
        textarea.value = url;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand("copy");
        document.body.removeChild(textarea);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch (err) {
      console.error("Failed to copy link:", err);
    }
  };

  // ─── LOADING STATE ──────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 px-4 text-slate-100">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-blue-500/30 border-t-blue-500" />
          <p className="text-xs font-semibold tracking-widest text-slate-400 uppercase">
            Loading RFID Record...
          </p>
        </div>
      </div>
    );
  }

  // ─── NOT FOUND STATE ────────────────────────────────────────────────────────
  if (!record) {
    return (
      <div className="relative flex min-h-screen flex-col items-center justify-center bg-slate-950 px-4 py-12 text-slate-100 sm:px-6 lg:px-8">
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute top-1/3 left-1/2 h-[400px] w-[500px] -translate-x-1/2 rounded-full bg-rose-600/10 blur-[120px]" />
        </div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative w-full max-w-md overflow-hidden rounded-3xl border border-rose-500/30 bg-slate-900/90 p-6 text-center shadow-2xl backdrop-blur-xl sm:p-8"
        >
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-rose-500/30 bg-rose-500/10 text-rose-400">
            <FiAlertCircle className="h-7 w-7" />
          </div>

          <h1 className="mt-4 text-xl font-bold tracking-tight text-white font-display">
            RFID RECORD NOT FOUND
          </h1>
          <p className="mt-2 text-xs leading-relaxed text-slate-400">
            The requested RFID record <span className="font-mono text-slate-300">"{rfidId}"</span> could not be found in the system registry.
          </p>

          <div className="mt-6 pt-4 border-t border-slate-800">
            <button
              onClick={() => navigate("/rfid")}
              className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-800 px-4 py-3 text-xs font-bold tracking-wider text-slate-200 uppercase transition hover:bg-slate-700 hover:text-white"
            >
              <FiArrowLeft className="h-4 w-4" />
              <span>Back to RFID Verification</span>
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  const isEntry = record.accessType?.toLowerCase() === "entry";

  // ─── VALID ACCESS RECORD DETAILS ───────────────────────────────────────────
  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center bg-slate-950 px-4 py-10 text-slate-100 sm:px-6 lg:px-8 selection:bg-civic-500 selection:text-white">
      {/* Background Glow */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/2 h-[500px] w-[600px] -translate-x-1/2 rounded-full bg-blue-600/10 blur-[130px]" />
        <div className="absolute bottom-1/4 left-1/2 h-[400px] w-[500px] -translate-x-1/2 rounded-full bg-emerald-600/10 blur-[120px]" />
      </div>

      <div className="relative w-full max-w-lg space-y-6">
        {/* Top Header Branding */}
        <div className="flex items-center justify-between">
          <div className="inline-flex items-center gap-2 rounded-full border border-blue-500/20 bg-blue-500/10 px-3.5 py-1 text-xs font-semibold tracking-widest text-blue-400">
            <FiShield className="h-3.5 w-3.5" />
            <span>VELORA</span>
          </div>

          <Link
            to="/rfid"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-400 transition hover:text-blue-400"
          >
            <FiArrowLeft className="h-3.5 w-3.5" />
            <span>Terminal</span>
          </Link>
        </div>

        {/* Main Access Record Card */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25 }}
          className="overflow-hidden rounded-3xl border border-slate-800 bg-slate-900/90 p-6 shadow-2xl backdrop-blur-xl sm:p-8"
        >
          {/* Header & Verification Status Badge */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800/80 pb-5">
            <div>
              <p className="text-[11px] font-bold tracking-widest text-slate-400 uppercase">
                Access Control Audit
              </p>
              <h1 className="mt-1 text-xl font-bold tracking-tight text-white font-display sm:text-2xl">
                RFID Access Record
              </h1>
            </div>

            <div className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-bold text-emerald-400">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
              </span>
              <span>✓ ACCESS VERIFIED</span>
            </div>
          </div>

          {/* Staff Information Section */}
          <div className="mt-6">
            <div className="flex items-center gap-4 rounded-2xl border border-slate-800/80 bg-slate-950/60 p-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-blue-600/20 text-blue-400 font-bold text-base border border-blue-500/30 font-display">
                {record.name?.charAt(0) || "S"}
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <h2 className="truncate text-base font-bold text-white font-display">
                    {record.name}
                  </h2>
                  <span className="rounded-md border border-slate-700 bg-slate-800 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-slate-300">
                    {record.role || "Staff"}
                  </span>
                </div>
                <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-slate-400">
                  <span>
                    Staff ID: <strong className="font-mono text-slate-200">{record.staffId}</strong>
                  </span>
                  {record.department && (
                    <>
                      <span>•</span>
                      <span className="truncate">{record.department}</span>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Grid Information Details */}
          <div className="mt-5 grid grid-cols-2 gap-3 text-xs">
            {/* RFID Card */}
            <div className="rounded-2xl border border-slate-800/70 bg-slate-950/40 p-3.5">
              <span className="flex items-center gap-1.5 text-[11px] font-medium text-slate-400">
                <FiCreditCard className="h-3.5 w-3.5 text-blue-400" />
                RFID Card
              </span>
              <p className="mt-1 font-mono text-sm font-bold text-white">
                {record.rfidTag}
              </p>
              <span className="mt-1 inline-block text-[10px] font-semibold text-emerald-400">
                ● Status: {record.rfidStatus}
              </span>
            </div>

            {/* Access Type (Entry / Exit) */}
            <div className="rounded-2xl border border-slate-800/70 bg-slate-950/40 p-3.5">
              <span className="flex items-center gap-1.5 text-[11px] font-medium text-slate-400">
                {isEntry ? (
                  <FiLogIn className="h-3.5 w-3.5 text-emerald-400" />
                ) : (
                  <FiLogOut className="h-3.5 w-3.5 text-purple-400" />
                )}
                Access Type
              </span>
              <p
                className={classNames(
                  "mt-1 text-sm font-black tracking-wider uppercase font-display",
                  isEntry ? "text-emerald-400" : "text-purple-400"
                )}
              >
                {record.accessType}
              </p>
              <span className="mt-1 inline-block text-[10px] font-medium text-slate-400">
                Direction of movement
              </span>
            </div>

            {/* Gate */}
            <div className="rounded-2xl border border-slate-800/70 bg-slate-950/40 p-3.5">
              <span className="flex items-center gap-1.5 text-[11px] font-medium text-slate-400">
                <FiMapPin className="h-3.5 w-3.5 text-amber-400" />
                Gate
              </span>
              <p className="mt-1 text-sm font-bold text-white">
                {record.gate}
              </p>
              <span className="mt-1 inline-block text-[10px] font-medium text-slate-400">
                Checkpoint location
              </span>
            </div>

            {/* Authorization Status */}
            <div className="rounded-2xl border border-slate-800/70 bg-slate-950/40 p-3.5">
              <span className="flex items-center gap-1.5 text-[11px] font-medium text-slate-400">
                <FiCheckCircle className="h-3.5 w-3.5 text-emerald-400" />
                Status
              </span>
              <p className="mt-1 text-sm font-bold text-emerald-400 uppercase tracking-wider">
                {record.accessStatus}
              </p>
              <span className="mt-1 inline-block text-[10px] font-medium text-slate-400">
                Clearance granted
              </span>
            </div>
          </div>

          {/* Timestamp Row */}
          <div className="mt-3 flex items-center justify-between rounded-2xl border border-slate-800/70 bg-slate-950/40 px-4 py-3 text-xs text-slate-300">
            <span className="flex items-center gap-2">
              <FiCalendar className="h-3.5 w-3.5 text-slate-400" />
              <span>{record.date}</span>
            </span>
            <span className="flex items-center gap-2">
              <FiClock className="h-3.5 w-3.5 text-slate-400" />
              <span className="font-semibold text-white">{record.time}</span>
            </span>
          </div>

          {/* Action Buttons: Copy Link & Back */}
          <div className="mt-6 flex flex-col gap-3 pt-4 border-t border-slate-800 sm:flex-row">
            {/* Copy RFID Link Button */}
            <button
              onClick={handleCopyLink}
              className={classNames(
                "inline-flex flex-1 items-center justify-center gap-2 rounded-2xl border px-4 py-3 text-xs font-bold tracking-wider uppercase transition-all duration-150 active:scale-[0.99] focus:outline-none",
                copied
                  ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-400"
                  : "border-slate-700 bg-slate-800 text-slate-200 hover:bg-slate-700 hover:text-white"
              )}
            >
              {copied ? (
                <>
                  <FiCheck className="h-4 w-4 text-emerald-400" />
                  <span>RFID link copied</span>
                </>
              ) : (
                <>
                  <FiCopy className="h-4 w-4" />
                  <span>Copy RFID Link</span>
                </>
              )}
            </button>

            {/* Back to Verification Button */}
            <button
              onClick={() => navigate("/rfid")}
              className="inline-flex flex-1 items-center justify-center gap-2 rounded-2xl bg-blue-600 px-4 py-3 text-xs font-bold tracking-wider text-white uppercase shadow-lg shadow-blue-600/20 transition hover:bg-blue-500 active:scale-[0.99] focus:outline-none"
            >
              <FiArrowLeft className="h-4 w-4" />
              <span>Back to RFID Verification</span>
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
