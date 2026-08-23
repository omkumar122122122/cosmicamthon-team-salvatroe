import { useEffect, useState } from "react";
import { useParams, useLocation, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  FiShield,
  FiCheckCircle,
  FiAlertCircle,
  FiUser,
  FiCalendar,
  FiClock,
  FiMapPin,
  FiLogIn,
  FiLogOut,
  FiSlash,
  FiLock,
  FiRefreshCw,
  FiHeart,
  FiActivity,
  FiCheck,
  FiInfo,
} from "react-icons/fi";
import { QRCodeSVG } from "qrcode.react";
import { classNames } from "../utils/formatters";

export default function ParentVisitPortal() {
  const params = useParams();
  const location = useLocation();

  // Extract pass identifier from params (visitId, token, nfcId) or query or last URL segment
  const pathSegments = location.pathname.split("/").filter(Boolean);
  const lastSegment = pathSegments[pathSegments.length - 1];
  const routeIdentifier =
    params.visitId ||
    params.identifier ||
    params.token ||
    params.nfcId ||
    (lastSegment && !["visit", "parent-portal", "nfc"].includes(lastSegment) ? lastSegment : "");

  const [activeIdentifier, setActiveIdentifier] = useState(routeIdentifier || "");
  const [manualInput, setManualInput] = useState("");
  const [visitData, setVisitData] = useState(null);
  const [loading, setLoading] = useState(Boolean(routeIdentifier));
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [errorStatus, setErrorStatus] = useState(null); // 'NOT_FOUND' | 'INVALID' | 'NETWORK_ERROR'
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    if (routeIdentifier) {
      setActiveIdentifier(routeIdentifier);
      fetchVisitDetails(routeIdentifier);
    } else {
      setLoading(false);
    }
  }, [routeIdentifier]);

  // 12-second lightweight background sync / auto-polling
  useEffect(() => {
    if (!activeIdentifier) return;

    const pollInterval = setInterval(() => {
      // Only poll if visit is not concluded in terminal state
      if (!visitData || (!visitData.checkOutTime && visitData.visitStatus !== "CANCELLED" && visitData.visitStatus !== "REJECTED")) {
        fetchVisitDetails(activeIdentifier, true);
      }
    }, 12000);

    return () => clearInterval(pollInterval);
  }, [activeIdentifier, visitData]);

  async function fetchVisitDetails(identifier, silent = false) {
    if (!identifier || !identifier.trim()) {
      setLoading(false);
      return;
    }

    if (!silent) {
      setLoading(true);
    } else {
      setIsRefreshing(true);
    }
    setErrorStatus(null);
    setErrorMessage("");

    try {
      const clean = identifier.trim();
      const res = await fetch(`/api/v1/nfc/visit/${encodeURIComponent(clean)}`);

      if (!res.ok) {
        if (res.status === 404) {
          setErrorStatus("NOT_FOUND");
          setErrorMessage("This visit link is invalid or no longer available.");
        } else {
          setErrorStatus("INVALID");
          setErrorMessage("Unable to verify this visit pass. Please check the code and try again.");
        }
        setVisitData(null);
        return;
      }

      const json = await res.json();
      const payload = json.data || json;

      if (payload && (payload.nfcId || payload.requestId || payload.visitRequestId)) {
        setVisitData(payload);
        setActiveIdentifier(payload.nfcId || clean);
      } else {
        setErrorStatus("NOT_FOUND");
        setErrorMessage("This visit link is invalid or no longer available.");
        setVisitData(null);
      }
    } catch (err) {
      console.error("Parent Portal fetch error:", err);
      if (!silent) {
        setErrorStatus("NETWORK_ERROR");
        setErrorMessage("Network error communicating with the verification server. Please try again.");
        setVisitData(null);
      }
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }

  const handleManualSubmit = (e) => {
    if (e) e.preventDefault();
    if (manualInput.trim()) {
      fetchVisitDetails(manualInput.trim());
    }
  };

  const formatDate = (dateVal) => {
    if (!dateVal) return "--";
    try {
      return new Date(dateVal).toLocaleDateString("en-US", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    } catch {
      return String(dateVal);
    }
  };

  const formatTime = (timeVal) => {
    if (!timeVal) return null;
    try {
      const d = new Date(timeVal);
      if (!isNaN(d.getTime())) {
        return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
      }
      return String(timeVal);
    } catch {
      return String(timeVal);
    }
  };

  // ── Determine Status & Theme ──────────────────────────────────────────
  const isApproved = visitData?.visitStatus === "APPROVED" || visitData?.visitStatus === "RESCHEDULED" || visitData?.visitStatus === "COMPLETED";
  const isCheckedIn = Boolean(visitData?.checkInTime && !visitData?.checkOutTime);
  const isCheckedOut = Boolean(visitData?.checkOutTime || visitData?.visitStatus === "COMPLETED");
  const isPending = visitData?.visitStatus === "PENDING";
  const isRejected = visitData?.visitStatus === "REJECTED";
  const isCancelled = visitData?.visitStatus === "CANCELLED";

  // ── LOADING VIEW ───────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-slate-950 px-4 text-slate-100 selection:bg-indigo-600 selection:text-white">
        <div className="flex flex-col items-center gap-3">
          <div className="h-9 w-9 animate-spin rounded-full border-3 border-indigo-500/20 border-t-indigo-500" />
          <p className="text-xs font-bold tracking-widest text-slate-400 uppercase font-display">
            Verifying Parent Visit Authorization...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-slate-950 text-slate-100 selection:bg-indigo-600 selection:text-white flex flex-col justify-between">
      {/* Background ambient lighting effects */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-24 left-1/2 h-[450px] w-[600px] -translate-x-1/2 rounded-full bg-indigo-600/10 blur-[130px]" />
        <div className="absolute bottom-0 right-1/4 h-[350px] w-[450px] rounded-full bg-blue-600/10 blur-[140px]" />
      </div>

      {/* ── Top Header Navigation Bar ──────────────────────────────────── */}
      <header className="relative z-10 border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-3 sm:px-6">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-600 text-white font-black text-sm shadow-md shadow-indigo-600/30">
              V
            </div>
            <div>
              <span className="text-xs font-black tracking-widest uppercase text-white font-display">
                VELORA
              </span>
              <span className="block text-[10px] font-bold text-indigo-400 uppercase tracking-wider">
                Parent Visit Portal
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-[11px] font-bold text-emerald-400">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
            </span>
            <span>Security Verified</span>
          </div>
        </div>
      </header>

      {/* ── Main Content Body ─────────────────────────────────────────── */}
      <main className="relative z-10 mx-auto w-full max-w-xl flex-1 px-4 py-8 sm:px-6">
        <AnimatePresence mode="wait">
          {/* ── CASE 1: VISIT FOUND & VALID ────────────────────────────── */}
          {visitData && (
            <motion.div
              key={visitData.nfcId || visitData.requestId}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.25 }}
              className="space-y-6"
            >
              {/* Primary Status Banner */}
              <div
                className={classNames(
                  "relative overflow-hidden rounded-3xl border p-6 text-center shadow-2xl backdrop-blur-xl",
                  isCheckedOut
                    ? "border-purple-500/40 bg-gradient-to-b from-purple-950/40 to-slate-900/90 shadow-purple-500/10"
                    : isCheckedIn
                    ? "border-emerald-500/40 bg-gradient-to-b from-emerald-950/40 to-slate-900/90 shadow-emerald-500/10"
                    : isRejected
                    ? "border-rose-500/40 bg-gradient-to-b from-rose-950/40 to-slate-900/90 shadow-rose-500/10"
                    : isCancelled
                    ? "border-amber-500/40 bg-gradient-to-b from-amber-950/40 to-slate-900/90 shadow-amber-500/10"
                    : "border-blue-500/40 bg-gradient-to-b from-blue-950/40 to-slate-900/90 shadow-blue-500/10"
                )}
              >
                {/* Status Icon */}
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border shadow-inner">
                  {isCheckedOut ? (
                    <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-purple-500/40 bg-purple-500/20 text-purple-400">
                      <FiCheckCircle className="h-8 w-8" />
                    </div>
                  ) : isCheckedIn ? (
                    <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-emerald-500/40 bg-emerald-500/20 text-emerald-400">
                      <FiLogIn className="h-8 w-8" />
                    </div>
                  ) : isRejected ? (
                    <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-rose-500/40 bg-rose-500/20 text-rose-400">
                      <FiSlash className="h-8 w-8" />
                    </div>
                  ) : isCancelled ? (
                    <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-amber-500/40 bg-amber-500/20 text-amber-400">
                      <FiAlertCircle className="h-8 w-8" />
                    </div>
                  ) : (
                    <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-blue-500/40 bg-blue-500/20 text-blue-400">
                      <FiShield className="h-8 w-8" />
                    </div>
                  )}
                </div>

                {/* Status Titles */}
                <div className="mt-4">
                  <h1 className="text-xl font-black uppercase tracking-tight text-white font-display sm:text-2xl">
                    {isCheckedOut
                      ? "✓ VISIT COMPLETED"
                      : isCheckedIn
                      ? "✓ VISIT VERIFIED"
                      : isRejected
                      ? "✕ VISIT REJECTED"
                      : isCancelled
                      ? "✕ VISIT CANCELLED"
                      : "✓ VISIT APPROVED"}
                  </h1>
                  <p
                    className={classNames(
                      "mt-1 text-xs font-bold uppercase tracking-wider",
                      isCheckedOut
                        ? "text-purple-400"
                        : isCheckedIn
                        ? "text-emerald-400"
                        : isRejected
                        ? "text-rose-400"
                        : isCancelled
                        ? "text-amber-400"
                        : "text-blue-400"
                    )}
                  >
                    {isCheckedOut
                      ? "CHECKED OUT"
                      : isCheckedIn
                      ? "CHECKED IN • ACTIVE ON PREMISES"
                      : isRejected
                      ? "ACCESS DENIED"
                      : isCancelled
                      ? "NO LONGER AUTHORIZED"
                      : "WAITING FOR ARRIVAL • NOT CHECKED IN"}
                  </p>
                </div>

                {/* Checkpoint Movement Pill */}
                <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
                  <span className="inline-flex items-center gap-1.5 rounded-xl border border-slate-800 bg-slate-900/90 px-3.5 py-1 text-xs font-bold text-slate-300">
                    <FiMapPin className="h-3.5 w-3.5 text-amber-400" />
                    <span>{visitData.gateName || "Main Gate"}</span>
                  </span>

                  <span
                    className={classNames(
                      "inline-flex items-center gap-1 rounded-xl px-3 py-1 text-xs font-black uppercase",
                      isCheckedOut || isCheckedIn
                        ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                        : isRejected || isCancelled
                        ? "bg-rose-500/20 text-rose-300 border border-rose-500/30"
                        : "bg-blue-500/20 text-blue-300 border border-blue-500/30"
                    )}
                  >
                    ACCESS: {isRejected || isCancelled ? "DENIED" : "AUTHORIZED"}
                  </span>
                </div>
              </div>

              {/* ── Verified Visit Information Card ────────────────────── */}
              <div className="overflow-hidden rounded-3xl border border-slate-800 bg-slate-900/80 p-6 shadow-xl backdrop-blur-md space-y-5">
                <div className="border-b border-slate-800 pb-3 flex items-center justify-between">
                  <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 font-display">
                    Verified Visit Details
                  </h2>
                  <span className="font-mono text-xs font-extrabold text-indigo-400">
                    {visitData.requestId || visitData.nfcId}
                  </span>
                </div>

                {/* Information Grid */}
                <div className="grid gap-4 sm:grid-cols-2 text-xs">
                  <div className="rounded-2xl bg-slate-950/60 p-4 border border-slate-800/80 space-y-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                      PARENT
                    </span>
                    <p className="text-sm font-bold text-white">
                      {visitData.parent?.name || "Parent Visitor"}
                    </p>
                  </div>

                  <div className="rounded-2xl bg-slate-950/60 p-4 border border-slate-800/80 space-y-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                      CHILD
                    </span>
                    <p className="text-sm font-bold text-white">
                      {visitData.child?.name || "Assigned Child"}
                      {visitData.child?.code && (
                        <span className="ml-1.5 text-xs text-slate-400 font-mono">
                          (#{visitData.child.code})
                        </span>
                      )}
                    </p>
                  </div>

                  <div className="rounded-2xl bg-slate-950/60 p-4 border border-slate-800/80 space-y-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                      VISIT DATE
                    </span>
                    <p className="text-sm font-bold text-slate-200">
                      {formatDate(visitData.visitDate)}
                    </p>
                  </div>

                  <div className="rounded-2xl bg-slate-950/60 p-4 border border-slate-800/80 space-y-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                      APPROVED TIME SLOT
                    </span>
                    <p className="text-sm font-bold text-slate-200">
                      {visitData.visitTime || "Morning Slot"}
                    </p>
                  </div>

                  {/* Dynamic Entry / Exit Timestamps */}
                  {visitData.checkInTime && (
                    <div className="rounded-2xl bg-emerald-950/30 p-4 border border-emerald-500/30 space-y-1">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1">
                        <FiLogIn className="h-3 w-3" />
                        ENTRY TIME
                      </span>
                      <p className="text-sm font-bold text-emerald-300">
                        {formatTime(visitData.checkInTime)}
                      </p>
                    </div>
                  )}

                  {visitData.checkOutTime && (
                    <div className="rounded-2xl bg-purple-950/30 p-4 border border-purple-500/30 space-y-1">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-purple-400 flex items-center gap-1">
                        <FiLogOut className="h-3 w-3" />
                        EXIT TIME
                      </span>
                      <p className="text-sm font-bold text-purple-300">
                        {formatTime(visitData.checkOutTime)}
                        {visitData.durationMinutes && (
                          <span className="ml-2 text-xs font-normal text-purple-400">
                            ({visitData.durationMinutes} mins)
                          </span>
                        )}
                      </p>
                    </div>
                  )}

                  <div className="rounded-2xl bg-slate-950/60 p-4 border border-slate-800/80 space-y-1 sm:col-span-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                      ORPHANAGE FACILITY
                    </span>
                    <p className="text-sm font-bold text-slate-200">
                      {visitData.orphanage?.name || "Care Facility"}
                      {visitData.orphanage?.city && (
                        <span className="text-xs text-slate-400 font-normal ml-1">
                          • {visitData.orphanage.city}
                        </span>
                      )}
                    </p>
                  </div>
                </div>

                {/* ── VISIT LIFECYCLE TIMELINE ───────────────────────────── */}
                <div className="rounded-2xl bg-slate-950/70 p-4 border border-slate-800 space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 font-display flex items-center gap-1.5">
                      <FiActivity className="h-3.5 w-3.5 text-indigo-400" />
                      Visit Lifecycle Timeline
                    </span>
                    {isRefreshing && (
                      <span className="text-[10px] font-bold text-indigo-400 animate-pulse">
                        ● Syncing live...
                      </span>
                    )}
                  </div>

                  <div className="space-y-3 pt-1">
                    {/* Step 1: Approval */}
                    <div className="flex items-start gap-3 text-xs">
                      <div className={classNames(
                        "mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold",
                        isApproved ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/40" : "bg-slate-800 text-slate-500"
                      )}>
                        ✓
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <p className="font-bold text-slate-200">Visit Request Approved</p>
                          <span className="text-[10px] text-slate-500">{visitData.visitTime || "Scheduled"}</span>
                        </div>
                        <p className="text-[10px] text-slate-400">Orphanage administration confirmed visit window and generated QR pass</p>
                      </div>
                    </div>

                    {/* Step 2: Gate Check-In */}
                    <div className="flex items-start gap-3 text-xs">
                      <div className={classNames(
                        "mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold",
                        visitData.checkInTime ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/40" : "bg-slate-800 text-slate-500"
                      )}>
                        {visitData.checkInTime ? "✓" : "2"}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <p className={classNames("font-bold", visitData.checkInTime ? "text-slate-200" : "text-slate-500")}>
                            Gate Check-In (Entry)
                          </p>
                          {visitData.checkInTime && (
                            <span className="text-[10px] font-mono text-emerald-400">{formatTime(visitData.checkInTime)}</span>
                          )}
                        </div>
                        <p className="text-[10px] text-slate-400">
                          {visitData.checkInTime ? "Parent QR verified at Main Gate Security. Access Authorized." : "Waiting for parent arrival at orphanage gate."}
                        </p>
                      </div>
                    </div>

                    {/* Step 3: Gate Exit & Departure */}
                    <div className="flex items-start gap-3 text-xs">
                      <div className={classNames(
                        "mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold",
                        visitData.checkOutTime ? "bg-purple-500/20 text-purple-400 border border-purple-500/40" : "bg-slate-800 text-slate-500"
                      )}>
                        {visitData.checkOutTime ? "✓" : "3"}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <p className={classNames("font-bold", visitData.checkOutTime ? "text-slate-200" : "text-slate-500")}>
                            Gate Departure (Exit)
                          </p>
                          {visitData.checkOutTime && (
                            <span className="text-[10px] font-mono text-purple-400">{formatTime(visitData.checkOutTime)}</span>
                          )}
                        </div>
                        <p className="text-[10px] text-slate-400">
                          {visitData.checkOutTime ? `Departure logged at Gate. Total visit: ${visitData.durationMinutes || 1} minutes.` : visitData.checkInTime ? "Parent currently on facility premises." : "Pending check-in."}
                        </p>
                      </div>
                    </div>

                    {/* Step 4: Completion */}
                    <div className="flex items-start gap-3 text-xs">
                      <div className={classNames(
                        "mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold",
                        isCheckedOut ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/40" : "bg-slate-800 text-slate-500"
                      )}>
                        {isCheckedOut ? "✓" : "4"}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <p className={classNames("font-bold", isCheckedOut ? "text-emerald-300" : "text-slate-500")}>
                            Visit Concluded & Completed
                          </p>
                          {isCheckedOut && (
                            <span className="text-[10px] font-bold text-emerald-400">COMPLETED</span>
                          )}
                        </div>
                        <p className="text-[10px] text-slate-400">
                          {isCheckedOut ? "All security checkpoints cleared and archived in child welfare log." : "Will complete upon departure scan."}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Embedded QR Pass Container for presentation at gate */}
                {visitData.nfcUrl && !isCheckedOut && !isRejected && !isCancelled && (
                  <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4 flex flex-col sm:flex-row items-center gap-4">
                    <div className="rounded-xl bg-white p-2 shrink-0 shadow-md">
                      <QRCodeSVG
                        value={visitData.nfcUrl}
                        size={92}
                        level="M"
                        includeMargin={false}
                      />
                    </div>
                    <div className="text-center sm:text-left">
                      <p className="text-xs font-extrabold text-white">
                        Digital Gate Pass
                      </p>
                      <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">
                        Present this QR code to the gate scanner upon arrival and departure.
                      </p>
                      <span className="mt-1.5 inline-block font-mono text-[10px] text-indigo-400 font-bold">
                        {visitData.nfcId}
                      </span>
                    </div>
                  </div>
                )}

                <div className="pt-2 flex justify-between items-center text-[10px] text-slate-500">
                  <span>Velora Child Safety AI System</span>
                  <button
                    type="button"
                    onClick={() => fetchVisitDetails(activeIdentifier)}
                    className="inline-flex items-center gap-1 text-slate-400 hover:text-white"
                  >
                    <FiRefreshCw className="h-3 w-3" />
                    <span>Refresh Status</span>
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {/* ── CASE 2: VISIT NOT FOUND OR INVALID ─────────────────────── */}
          {!visitData && (
            <motion.div
              key="not-found"
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              className="overflow-hidden rounded-3xl border border-slate-800 bg-slate-900/90 p-8 text-center shadow-2xl backdrop-blur-xl space-y-5"
            >
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border border-rose-500/30 bg-rose-500/10 text-rose-400">
                <FiSlash className="h-8 w-8" />
              </div>

              <div>
                <h1 className="text-xl font-extrabold uppercase tracking-tight text-white font-display">
                  ✕ VISIT NOT FOUND
                </h1>
                <p className="mt-2 text-xs leading-relaxed text-slate-400 max-w-sm mx-auto">
                  {errorMessage || "This visit link is invalid or no longer available."}
                </p>
              </div>

              {/* Manual Lookup Form */}
              <form onSubmit={handleManualSubmit} className="mt-6 space-y-3 max-w-sm mx-auto">
                <label
                  htmlFor="portal-code-input"
                  className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 text-left"
                >
                  Enter Pass ID or Visit Token
                </label>
                <div className="flex gap-2">
                  <input
                    id="portal-code-input"
                    type="text"
                    value={manualInput}
                    onChange={(e) => setManualInput(e.target.value)}
                    placeholder="e.g. NFC-VST-D3642D"
                    className="w-full rounded-xl border border-slate-800 bg-slate-950 px-4 py-2.5 font-mono text-xs font-bold text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
                  />
                  <button
                    type="submit"
                    disabled={!manualInput.trim()}
                    className="rounded-xl bg-indigo-600 px-4 py-2.5 text-xs font-bold text-white hover:bg-indigo-500 disabled:opacity-50 transition shrink-0"
                  >
                    Verify
                  </button>
                </div>
              </form>

              <div className="border-t border-slate-800/80 pt-4 text-[11px] text-slate-500">
                Security verification notice: Pass records are cryptographically verified. If you need assistance, please contact the orphanage administration.
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* ── Footer ──────────────────────────────────────────────────── */}
      <footer className="relative z-10 border-t border-slate-900 bg-slate-950/80 py-4 text-center text-[10px] text-slate-600">
        <p>© 2026 Velora AI • Orphanage Child Safety Management System • Public Access Gateway</p>
      </footer>
    </div>
  );
}
