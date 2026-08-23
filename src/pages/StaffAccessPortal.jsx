import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
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
  FiLock,
} from "react-icons/fi";
import { gateService } from "../services/gateService";
import { QRCodeSVG } from "qrcode.react";
import { classNames } from "../utils/formatters";

export default function StaffAccessPortal() {
  const { staffId } = useParams();
  const [staff, setStaff] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadStaff() {
      setLoading(true);
      try {
        const idToLookup = staffId || "STF-001";
        const found = await gateService.getStaffById(idToLookup);
        setStaff(found);
      } catch (err) {
        console.error("Error loading staff access data:", err);
        setStaff(null);
      } finally {
        setLoading(false);
      }
    }

    loadStaff();
  }, [staffId]);

  // ─── LOADING STATE ──────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-slate-950 px-4 text-slate-100 selection:bg-blue-600 selection:text-white">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-blue-500/30 border-t-blue-500" />
          <p className="text-xs font-semibold tracking-widest text-slate-400 uppercase font-display">
            Verifying Staff Access Clearance...
          </p>
        </div>
      </div>
    );
  }

  // ─── NOT FOUND STATE ────────────────────────────────────────────────────────
  if (!staff) {
    return (
      <div className="relative flex min-h-screen flex-col items-center justify-center bg-slate-950 px-4 py-12 text-slate-100 sm:px-6 lg:px-8 selection:bg-rose-600 selection:text-white">
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute top-1/3 left-1/2 h-[400px] w-[500px] -translate-x-1/2 rounded-full bg-rose-600/10 blur-[120px]" />
        </div>

        <div className="relative w-full max-w-md space-y-6">
          {/* Top Brand Header */}
          <div className="text-center">
            <div className="inline-flex items-center gap-2 rounded-full border border-slate-800 bg-slate-900/80 px-3.5 py-1 text-xs font-bold tracking-widest text-slate-400 uppercase">
              <FiShield className="h-3.5 w-3.5 text-rose-500" />
              <span>Velora Secure Access</span>
            </div>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            className="overflow-hidden rounded-3xl border border-rose-500/30 bg-slate-900/90 p-6 text-center shadow-2xl backdrop-blur-xl sm:p-8"
          >
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-rose-500/30 bg-rose-500/10 text-rose-400">
              <FiAlertCircle className="h-7 w-7" />
            </div>

            <h1 className="mt-4 text-xl font-bold tracking-tight text-white font-display">
              STAFF RECORD NOT FOUND
            </h1>
            <p className="mt-2 text-xs leading-relaxed text-slate-400">
              No active staff access record matches identifier{" "}
              <strong className="font-mono text-slate-200">"{staffId || "N/A"}"</strong>.
            </p>

            <div className="mt-6 border-t border-slate-800/80 pt-4 text-[11px] text-slate-500">
              Public verification query concluded. If this is an error, please contact security operations.
            </div>
          </motion.div>
        </div>
      </div>
    );
  }

  const isEntry = (staff.lastMovement?.movementType || "ENTRY").toUpperCase() === "ENTRY";
  const movement = staff.lastMovement || {
    movementType: "ENTRY",
    date: new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" }),
    time: "Current",
    gate: staff.gate || "Main Gate",
    status: "AUTHORIZED",
  };

  // ─── VERIFIED PUBLIC STAFF ACCESS VIEW ──────────────────────────────────────
  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center bg-slate-950 px-4 py-10 text-slate-100 sm:px-6 lg:px-8 selection:bg-blue-600 selection:text-white">
      {/* Background Ambience Elements */}
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

          <div className="inline-flex items-center gap-1.5 rounded-full border border-slate-800 bg-slate-900/80 px-3 py-0.5 text-[11px] font-medium text-slate-400">
            <FiLock className="h-3 w-3 text-emerald-400" />
            <span>Public Access Verification</span>
          </div>
        </div>

        {/* Main Access Card */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25 }}
          className="overflow-hidden rounded-3xl border border-slate-800 bg-slate-900/90 p-6 shadow-2xl backdrop-blur-xl sm:p-8"
        >
          {/* Card Header & Access Status */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800/80 pb-5">
            <div>
              <p className="text-[11px] font-bold tracking-widest text-slate-400 uppercase">
                Staff Access Verification
              </p>
              <h1 className="mt-1 text-xl font-bold tracking-tight text-white font-display sm:text-2xl">
                STAFF ACCESS VERIFICATION
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

          {/* Staff Info Banner */}
          <div className="mt-6 flex items-center gap-4 rounded-2xl border border-slate-800/80 bg-slate-950/60 p-4">
            {staff.avatar ? (
              <img
                src={staff.avatar}
                alt={staff.name}
                className="h-14 w-14 shrink-0 rounded-xl object-cover border border-slate-800 shadow-sm"
              />
            ) : (
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-blue-600/20 text-blue-400 font-bold text-lg border border-blue-500/30 font-display">
                {staff.name.charAt(0)}
              </div>
            )}

            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <h2 className="truncate text-base font-bold text-white font-display">
                  {staff.name}
                </h2>
                <span className="rounded-md border border-slate-700 bg-slate-800 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-slate-300">
                  {staff.role}
                </span>
              </div>
              <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-slate-400">
                <span>
                  Staff ID: <strong className="font-mono text-slate-200">{staff.staffId}</strong>
                </span>
                {staff.department && (
                  <>
                    <span>•</span>
                    <span className="truncate">{staff.department}</span>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Details Grid */}
          <div className="mt-5 grid grid-cols-2 gap-3 text-xs">
            {/* RFID Card */}
            <div className="rounded-2xl border border-slate-800/70 bg-slate-950/40 p-3.5">
              <span className="flex items-center gap-1.5 text-[11px] font-medium text-slate-400">
                <FiCreditCard className="h-3.5 w-3.5 text-blue-400" />
                RFID CARD
              </span>
              <p className="mt-1 font-mono text-sm font-bold text-white">
                {staff.rfidTag}
              </p>
              <span className="mt-1 inline-block text-[10px] font-semibold text-emerald-400">
                ● Status: {staff.rfidStatus?.toUpperCase() || "ACTIVE"}
              </span>
            </div>

            {/* Current Status */}
            <div className="rounded-2xl border border-slate-800/70 bg-slate-950/40 p-3.5">
              <span className="flex items-center gap-1.5 text-[11px] font-medium text-slate-400">
                <FiUser className="h-3.5 w-3.5 text-blue-400" />
                CURRENT STATUS
              </span>
              <p className="mt-1 text-sm font-bold uppercase font-display text-blue-400">
                {staff.currentStatus?.toUpperCase() || "OUTSIDE"}
              </p>
              <span className="mt-1 inline-block text-[10px] font-medium text-slate-400">
                Location status
              </span>
            </div>

            {/* Current Movement */}
            <div className="rounded-2xl border border-slate-800/70 bg-slate-950/40 p-3.5">
              <span className="flex items-center gap-1.5 text-[11px] font-medium text-slate-400">
                {isEntry ? (
                  <FiLogIn className="h-3.5 w-3.5 text-emerald-400" />
                ) : (
                  <FiLogOut className="h-3.5 w-3.5 text-purple-400" />
                )}
                CURRENT MOVEMENT
              </span>
              <p
                className={classNames(
                  "mt-1 text-sm font-black tracking-wider uppercase font-display",
                  isEntry ? "text-emerald-400" : "text-purple-400"
                )}
              >
                {movement.movementType}
              </p>
              <span className="mt-1 inline-block text-[10px] font-medium text-slate-400">
                Direction of movement
              </span>
            </div>

            {/* Gate */}
            <div className="rounded-2xl border border-slate-800/70 bg-slate-950/40 p-3.5">
              <span className="flex items-center gap-1.5 text-[11px] font-medium text-slate-400">
                <FiMapPin className="h-3.5 w-3.5 text-amber-400" />
                GATE
              </span>
              <p className="mt-1 text-sm font-bold text-white">
                {movement.gate}
              </p>
              <span className="mt-1 inline-block text-[10px] font-medium text-slate-400">
                Checkpoint location
              </span>
            </div>
          </div>

          {/* Date, Time & Access Clearance Row */}
          <div className="mt-3 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-800/70 bg-slate-950/40 px-4 py-3 text-xs text-slate-300">
            <span className="flex items-center gap-2">
              <FiCalendar className="h-3.5 w-3.5 text-slate-400" />
              <span>{movement.date}</span>
            </span>

            <span className="flex items-center gap-2">
              <FiClock className="h-3.5 w-3.5 text-slate-400" />
              <span className="font-semibold text-white">{movement.time}</span>
            </span>

            <span className="flex items-center gap-1.5 text-emerald-400 font-bold tracking-wider">
              <FiCheckCircle className="h-3.5 w-3.5" />
              <span>{movement.status || "AUTHORIZED"}</span>
            </span>
          </div>

          {/* Verification QR Badge */}
          <div className="mt-4 flex items-center justify-between gap-3 rounded-2xl border border-slate-800/80 bg-slate-950/60 p-3.5">
            <div className="min-w-0 flex-1">
              <p className="text-[11px] font-bold text-white font-display">
                Digital Pass QR
              </p>
              <p className="text-[10px] text-slate-400">
                Scan with any smartphone camera to verify this live credential directly.
              </p>
            </div>
            <div className="rounded-lg bg-white p-1.5 shrink-0 shadow-xs">
              <QRCodeSVG
                value={typeof window !== "undefined" ? window.location.href : ""}
                size={54}
                level="M"
                includeMargin={false}
              />
            </div>
          </div>

          {/* Secure Footer */}
          <div className="mt-6 border-t border-slate-800/80 pt-4 text-center text-[11px] text-slate-500">
            Velora Public Access Verification System • Authenticated Record
          </div>
        </motion.div>
      </div>
    </div>
  );
}
