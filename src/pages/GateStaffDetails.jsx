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
import Breadcrumb from "../components/Breadcrumb";
import Card from "../components/Card";
import { gateService } from "../services/gateService";
import { classNames } from "../utils/formatters";

export default function GateStaffDetails() {
  const { staffId } = useParams();
  const navigate = useNavigate();

  const [staff, setStaff] = useState(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    async function loadStaff() {
      setLoading(true);
      try {
        const found = await gateService.getStaffById(staffId);
        setStaff(found);
      } catch (err) {
        console.error("Error loading staff:", err);
        setStaff(null);
      } finally {
        setLoading(false);
      }
    }

    if (staffId) {
      loadStaff();
    }
  }, [staffId]);

  const liveUrl = `${window.location.origin}/orphanage/gate/staff/${staff?.staffId || staffId}`;

  const handleCopyLink = async () => {
    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(liveUrl);
      } else {
        const textarea = document.createElement("textarea");
        textarea.value = liveUrl;
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

  // Loading state
  if (loading) {
    return (
      <div className="space-y-6">
        <Breadcrumb
          items={[
            { label: "Orphanage", path: "/orphanage" },
            { label: "Gate", path: "/orphanage/gate" },
            { label: "Staff Details" },
          ]}
        />
        <div className="flex h-64 items-center justify-center">
          <div className="flex flex-col items-center gap-2.5">
            <div className="h-7 w-7 animate-spin rounded-full border-2 border-[#2563EB]/30 border-t-[#2563EB]" />
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Loading Staff Access Record...
            </span>
          </div>
        </div>
      </div>
    );
  }

  // Not Found State
  if (!staff) {
    return (
      <div className="space-y-6 max-w-xl mx-auto py-6">
        <Breadcrumb
          items={[
            { label: "Orphanage", path: "/orphanage" },
            { label: "Gate", path: "/orphanage/gate" },
            { label: "Not Found" },
          ]}
        />
        <Card className="border-rose-200/80 dark:border-rose-500/20 text-center p-8">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-50 text-rose-600 dark:bg-rose-500/10 dark:text-rose-400">
            <FiAlertCircle className="h-6 w-6" />
          </div>
          <h2 className="mt-4 text-lg font-bold text-slate-900 dark:text-white font-display">
            STAFF RECORD NOT FOUND
          </h2>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            The requested staff member ID <strong className="font-mono text-slate-700 dark:text-slate-300">"{staffId}"</strong> could not be found in the system.
          </p>
          <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800">
            <button
              onClick={() => navigate("/orphanage/gate")}
              className="inline-flex items-center gap-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white px-5 py-2.5 text-xs font-bold uppercase dark:bg-slate-800 dark:hover:bg-slate-700 transition"
            >
              <FiArrowLeft className="h-4 w-4" />
              <span>Back to Gate</span>
            </button>
          </div>
        </Card>
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

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* ── Breadcrumb & Top Bar ───────────────────────────────── */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Breadcrumb
            items={[
              { label: "Orphanage", path: "/orphanage" },
              { label: "Gate", path: "/orphanage/gate" },
              { label: staff.name },
            ]}
          />
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 dark:text-white font-display sm:text-3xl">
            Staff RFID Access
          </h1>
          <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
            Verified staff access record and clearance details
          </p>
        </div>

        <Link
          to="/orphanage/gate"
          className="inline-flex items-center gap-1.5 self-start rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 shadow-2xs hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 transition"
        >
          <FiArrowLeft className="h-3.5 w-3.5" />
          <span>Back to Gate</span>
        </Link>
      </div>

      {/* ── Main Details Card ──────────────────────────────────── */}
      <Card className="border-slate-200/90 dark:border-slate-800 shadow-card">
        {/* Verification Status Header Banner */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-5 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-[#2563EB] dark:bg-blue-500/10 dark:text-blue-400">
              <FiShield className="h-5 w-5" />
            </div>
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Velora Access Control
              </p>
              <h2 className="text-base font-bold text-slate-900 dark:text-white font-display">
                STAFF RFID ACCESS
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-3.5 py-1 text-xs font-bold text-emerald-700 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-400">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
            </span>
            <span>✓ ACCESS VERIFIED</span>
          </div>
        </div>

        {/* Staff Profile Header Row */}
        <div className="mt-6 flex flex-col sm:flex-row sm:items-center gap-4 rounded-2xl border border-slate-100 bg-slate-50/60 p-4 dark:border-slate-800 dark:bg-slate-950/40">
          {staff.avatar ? (
            <img
              src={staff.avatar}
              alt={staff.name}
              className="h-16 w-16 rounded-2xl object-cover border border-slate-200 dark:border-slate-700 shadow-xs"
            />
          ) : (
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-600 text-white font-bold text-xl font-display shadow-md shadow-blue-600/20">
              {staff.name.charAt(0)}
            </div>
          )}

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white font-display">
                {staff.name}
              </h3>
              <span className="rounded-md border border-slate-200 bg-white px-2 py-0.5 text-[10px] font-bold uppercase text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
                {staff.role}
              </span>
            </div>

            <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
              <span>
                Staff ID: <strong className="font-mono text-slate-800 dark:text-slate-200">{staff.staffId}</strong>
              </span>
              {staff.department && (
                <>
                  <span>•</span>
                  <span>{staff.department}</span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Access Details Grid */}
        <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
          {/* RFID Card */}
          <div className="rounded-xl border border-slate-100 bg-white p-3.5 shadow-2xs dark:border-slate-800 dark:bg-slate-900">
            <span className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-400">
              <FiCreditCard className="h-3.5 w-3.5 text-[#2563EB]" />
              RFID Card
            </span>
            <p className="mt-1 font-mono text-sm font-bold text-slate-900 dark:text-white">
              {staff.rfidTag}
            </p>
            <span className="mt-1 inline-block text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
              ● Status: {staff.rfidStatus?.toUpperCase() || "ACTIVE"}
            </span>
          </div>

          {/* Current Status */}
          <div className="rounded-xl border border-slate-100 bg-white p-3.5 shadow-2xs dark:border-slate-800 dark:bg-slate-900">
            <span className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-400">
              <FiUser className="h-3.5 w-3.5 text-blue-500" />
              CURRENT STATUS
            </span>
            <p className="mt-1 text-sm font-bold uppercase font-display text-blue-600 dark:text-blue-400">
              {staff.currentStatus?.toUpperCase() || "OUTSIDE"}
            </p>
            <span className="mt-1 inline-block text-[10px] text-slate-400">
              Current location
            </span>
          </div>

          {/* Latest Movement */}
          <div className="rounded-xl border border-slate-100 bg-white p-3.5 shadow-2xs dark:border-slate-800 dark:bg-slate-900">
            <span className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-400">
              {isEntry ? (
                <FiLogIn className="h-3.5 w-3.5 text-emerald-500" />
              ) : (
                <FiLogOut className="h-3.5 w-3.5 text-purple-500" />
              )}
              LATEST MOVEMENT
            </span>
            <p
              className={classNames(
                "mt-1 text-sm font-bold uppercase font-display",
                isEntry ? "text-emerald-600 dark:text-emerald-400" : "text-purple-600 dark:text-purple-400"
              )}
            >
              {movement.movementType}
            </p>
            <span className="mt-1 inline-block text-[10px] text-slate-400">
              Direction
            </span>
          </div>

          {/* Gate */}
          <div className="rounded-xl border border-slate-100 bg-white p-3.5 shadow-2xs dark:border-slate-800 dark:bg-slate-900">
            <span className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-400">
              <FiMapPin className="h-3.5 w-3.5 text-amber-500" />
              GATE
            </span>
            <p className="mt-1 text-sm font-bold text-slate-900 dark:text-white">
              {movement.gate}
            </p>
            <span className="mt-1 inline-block text-[10px] text-slate-400">
              Checkpoint
            </span>
          </div>
        </div>

        {/* Date, Time, and Authorization Row */}
        <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          <div className="flex items-center gap-2.5 rounded-xl border border-slate-100 bg-white p-3 shadow-2xs dark:border-slate-800 dark:bg-slate-900">
            <FiCalendar className="h-4 w-4 text-slate-400" />
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase">DATE</p>
              <p className="font-semibold text-slate-800 dark:text-slate-200">{movement.date}</p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 rounded-xl border border-slate-100 bg-white p-3 shadow-2xs dark:border-slate-800 dark:bg-slate-900">
            <FiClock className="h-4 w-4 text-slate-400" />
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase">TIME</p>
              <p className="font-semibold text-slate-800 dark:text-slate-200">{movement.time}</p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 rounded-xl border border-slate-100 bg-white p-3 shadow-2xs dark:border-slate-800 dark:bg-slate-900">
            <FiCheckCircle className="h-4 w-4 text-emerald-500" />
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase">ACCESS CLEARANCE</p>
              <p className="font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wide">
                {movement.status || "AUTHORIZED"}
              </p>
            </div>
          </div>
        </div>

        {/* ── Live Shareable Link Section ──────────────────────── */}
        <div className="mt-6 rounded-2xl border border-slate-200/90 bg-slate-50/70 p-4.5 dark:border-slate-800 dark:bg-slate-950/60">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="min-w-0 flex-1">
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                LIVE / SHAREABLE STAFF LINK
              </p>
              <p className="mt-1 font-mono text-xs text-[#2563EB] dark:text-blue-400 break-all select-all font-medium">
                {liveUrl}
              </p>
            </div>

            <button
              onClick={handleCopyLink}
              className={classNames(
                "inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold uppercase transition active:scale-[0.98]",
                copied
                  ? "bg-emerald-600 text-white"
                  : "bg-[#2563EB] hover:bg-[#1D4ED8] text-white shadow-md shadow-blue-600/20"
              )}
            >
              {copied ? (
                <>
                  <FiCheck className="h-4 w-4" />
                  <span>Link copied successfully</span>
                </>
              ) : (
                <>
                  <FiCopy className="h-4 w-4" />
                  <span>Copy Live Link</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Back Button */}
        <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-end">
          <button
            onClick={() => navigate("/orphanage/gate")}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 px-5 py-2.5 text-xs font-bold uppercase transition font-display"
          >
            <FiArrowLeft className="h-4 w-4" />
            <span>Back to Gate</span>
          </button>
        </div>
      </Card>
    </div>
  );
}
