import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  FiShield,
  FiCreditCard,
  FiAlertCircle,
  FiCheckCircle,
  FiLogIn,
  FiLogOut,
  FiClock,
  FiMapPin,
  FiCopy,
  FiCheck,
  FiExternalLink,
  FiUser,
  FiActivity,
  FiCornerDownLeft,
} from "react-icons/fi";
import Breadcrumb from "../components/Breadcrumb";
import Card from "../components/Card";
import { QRCodeSVG } from "qrcode.react";
import { gateService } from "../services/gateService";
import { classNames } from "../utils/formatters";

export default function Gate() {
  const [rfidInput, setRfidInput] = useState("");
  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState(null);
  const [copied, setCopied] = useState(false);
  const [recentActivities, setRecentActivities] = useState([]);
  const inputRef = useRef(null);
  const navigate = useNavigate();

  const demoTags = [
    { tag: "RFID-STF-001", staffId: "STF-001", name: "Rahul Sharma", role: "Security" },
    { tag: "RFID-STF-002", staffId: "STF-002", name: "Amit Kumar", role: "Staff" },
    { tag: "RFID-STF-003", staffId: "STF-003", name: "Priya Singh", role: "Staff" },
    { tag: "RFID-STF-004", staffId: "STF-004", name: "Arjun Verma", role: "Care" },
    { tag: "RFID-STF-005", staffId: "STF-005", name: "Neha Kapoor", role: "Admin" },
  ];

  useEffect(() => {
    loadActivities();
  }, []);

  async function loadActivities() {
    try {
      const data = await gateService.getRecentActivity();
      setRecentActivities(data);
    } catch (err) {
      console.error("Failed to load gate activity:", err);
    }
  }

  const handleScan = async (e) => {
    if (e) e.preventDefault();

    const trimmed = rfidInput.trim();
    if (!trimmed) {
      setScanResult({
        success: false,
        type: "warning",
        message: "Please enter an RFID ID.",
      });
      if (inputRef.current) inputRef.current.focus();
      return;
    }

    setIsScanning(true);
    setScanResult(null);

    try {
      const response = await gateService.scanRFID(trimmed);

      if (response.success) {
        // Resolve the Public Staff Portal Base URL (from environment or separate local portal port)
        const configuredBase = import.meta.env.VITE_STAFF_PORTAL_URL?.trim();
        const portalBase = configuredBase || (window.location.port ? `${window.location.protocol}//${window.location.hostname}:5174` : `${window.location.origin}`);
        const liveStaffUrl = `${portalBase.replace(/\/+$/, "")}/staff/${response.staff.staffId}`;

        setScanResult({
          success: true,
          type: "success",
          staff: response.staff,
          movement: response.movement,
          liveUrl: liveStaffUrl,
        });
        loadActivities();
      } else {
        setScanResult({
          success: false,
          type: response.duplicate ? "warning" : "error",
          message: response.message || "RFID NOT RECOGNIZED - ACCESS DENIED",
        });
      }
    } catch (err) {
      setScanResult({
        success: false,
        type: "error",
        message: "Error processing RFID scan. Please try again.",
      });
    } finally {
      setIsScanning(false);
    }
  };

  const handleQuickFill = (tag) => {
    setRfidInput(tag);
    setScanResult(null);
    if (inputRef.current) inputRef.current.focus();
  };

  const handleCopyLink = async (url) => {
    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(url);
      } else {
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

  return (
    <div className="space-y-6">
      {/* ── Top Header & Breadcrumb ────────────────────────────── */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Breadcrumb items={[{ label: "Orphanage", path: "/orphanage" }, { label: "Gate" }]} />
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 dark:text-white font-display sm:text-3xl">
            Gate
          </h1>
          <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
            Staff RFID Entry & Exit Verification
          </p>
        </div>

        {/* Live Reader Status Tag */}
        <div className="flex items-center gap-2 self-start rounded-full border border-emerald-200 bg-emerald-50/80 px-3.5 py-1.5 text-xs font-semibold text-emerald-700 shadow-2xs dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-400">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
          </span>
          <span>● RFID Reader Ready</span>
        </div>
      </div>

      {/* ── Main RFID Scanner Simulator Card ───────────────────── */}
      <Card className="border-slate-200/90 dark:border-slate-800 shadow-card">
        <div className="max-w-2xl">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-[#2563EB] dark:bg-blue-500/10 dark:text-blue-400">
              <FiCreditCard className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white font-display">
                Simulate RFID Card Reader
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Scan or enter an RFID Card ID to log staff entry or exit
              </p>
            </div>
          </div>

          <form onSubmit={handleScan} className="mt-5 space-y-4">
            <div>
              <label
                htmlFor="rfid-input"
                className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1.5"
              >
                RFID CARD ID OR STAFF ID
              </label>
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  <input
                    ref={inputRef}
                    id="rfid-input"
                    name="rfid-input"
                    type="text"
                    autoComplete="off"
                    spellCheck="false"
                    value={rfidInput}
                    onChange={(e) => setRfidInput(e.target.value)}
                    placeholder="e.g. RFID-STF-001 or STF-001"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/80 px-4 py-2.5 text-sm font-medium text-slate-900 placeholder-slate-400 transition-colors focus:border-[#2563EB] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 dark:border-slate-800 dark:bg-slate-950/60 dark:text-white dark:placeholder-slate-500 dark:focus:bg-slate-900"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isScanning}
                  className={classNames(
                    "inline-flex items-center justify-center gap-2 rounded-xl bg-[#2563EB] hover:bg-[#1D4ED8] text-white px-6 py-2.5 text-xs font-bold font-display shadow-md shadow-blue-600/20 active:scale-[0.98] transition-all",
                    isScanning && "cursor-not-allowed opacity-75"
                  )}
                >
                  {isScanning ? (
                    <>
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                      <span>SCANNING...</span>
                    </>
                  ) : (
                    <>
                      <span>VERIFY / SCAN</span>
                      <FiCornerDownLeft className="h-4 w-4 opacity-75" />
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Quick Demo Test Chips */}
            <div className="pt-2">
              <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-1.5">
                Quick Test Cards (Click to Fill):
              </p>
              <div className="flex flex-wrap gap-2">
                {demoTags.map(({ tag, staffId, name }) => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => handleQuickFill(tag)}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-700 shadow-2xs transition hover:border-[#2563EB] hover:text-[#2563EB] dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:border-blue-500 dark:hover:text-blue-400"
                  >
                    <span className="font-mono font-bold text-[#2563EB] dark:text-blue-400">{tag}</span>
                    <span className="text-[10px] text-slate-400">/ {staffId} ({name})</span>
                  </button>
                ))}
              </div>
            </div>
          </form>

          {/* ── Scan Result Feedback ─────────────────────────────── */}
          <AnimatePresence mode="wait">
            {scanResult && (
              <motion.div
                key={scanResult.type + (scanResult.message || scanResult.staff?.staffId)}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.2 }}
                className="mt-6 pt-5 border-t border-slate-100 dark:border-slate-800"
              >
                {/* SUCCESS RESULT CARD */}
                {scanResult.success && scanResult.staff && (
                  <div className="rounded-2xl border border-emerald-200/90 bg-emerald-50/40 p-5 dark:border-emerald-500/20 dark:bg-emerald-500/5">
                    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-emerald-200/60 pb-3 dark:border-emerald-500/20">
                      <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400">
                        <FiCheckCircle className="h-5 w-5" />
                        <span className="text-sm font-bold tracking-wide uppercase font-display">
                          ✓ RFID VERIFIED
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <span
                          className={classNames(
                            "inline-flex items-center gap-1 rounded-md px-2.5 py-0.5 text-xs font-bold uppercase",
                            scanResult.movement.movementType === "ENTRY"
                              ? "bg-emerald-600 text-white"
                              : "bg-purple-600 text-white"
                          )}
                        >
                          {scanResult.movement.movementType === "ENTRY" ? (
                            <FiLogIn className="h-3.5 w-3.5" />
                          ) : (
                            <FiLogOut className="h-3.5 w-3.5" />
                          )}
                          <span>{scanResult.movement.movementType}</span>
                        </span>

                        <span className="inline-flex items-center rounded-md bg-blue-100 px-2 py-0.5 text-[11px] font-bold text-blue-700 dark:bg-blue-500/20 dark:text-blue-300 uppercase">
                          STATUS: {scanResult.staff.currentStatus}
                        </span>
                      </div>
                    </div>

                    {/* Staff info row */}
                    <div className="mt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-white font-bold text-sm font-display shadow-xs">
                          {scanResult.staff.name.charAt(0)}
                        </div>
                        <div>
                          <h3 className="text-base font-bold text-slate-900 dark:text-white font-display">
                            {scanResult.staff.name}
                          </h3>
                          <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                            <span>
                              ID: <strong className="font-mono text-slate-700 dark:text-slate-300">{scanResult.staff.staffId}</strong>
                            </span>
                            <span>•</span>
                            <span>{scanResult.staff.role}</span>
                            <span>•</span>
                            <span className="font-mono">{scanResult.staff.rfidTag}</span>
                          </div>
                        </div>
                      </div>

                      <div className="text-right text-xs text-slate-600 dark:text-slate-400">
                        <div className="flex items-center sm:justify-end gap-1.5 font-medium">
                          <FiMapPin className="h-3.5 w-3.5 text-amber-500" />
                          <span>{scanResult.movement.gate}</span>
                        </div>
                        <div className="flex items-center sm:justify-end gap-1.5 mt-0.5 text-slate-500">
                          <FiClock className="h-3.5 w-3.5" />
                          <span>{scanResult.movement.time}</span>
                        </div>
                      </div>
                    </div>

                    {/* Live URL & QR Code Container */}
                    <div className="mt-5 rounded-xl border border-slate-200/90 bg-white p-4 shadow-2xs dark:border-slate-800 dark:bg-slate-900">
                      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="inline-block h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                            <p className="text-[10px] font-bold tracking-wider uppercase text-slate-400">
                              LIVE STAFF ACCESS LINK
                            </p>
                          </div>
                          <p className="mt-1 font-mono text-xs text-[#2563EB] dark:text-blue-400 break-all select-all font-semibold">
                            {scanResult.liveUrl}
                          </p>

                          <div className="mt-3 flex flex-wrap items-center gap-2.5">
                            <button
                              type="button"
                              onClick={() => handleCopyLink(scanResult.liveUrl)}
                              className={classNames(
                                "inline-flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-xs font-bold uppercase transition active:scale-[0.98]",
                                copied
                                  ? "bg-emerald-600 text-white"
                                  : "bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
                              )}
                            >
                              {copied ? (
                                <>
                                  <FiCheck className="h-3.5 w-3.5" />
                                  <span>Link copied successfully</span>
                                </>
                              ) : (
                                <>
                                  <FiCopy className="h-3.5 w-3.5" />
                                  <span>Copy Link</span>
                                </>
                              )}
                            </button>

                            <button
                              type="button"
                              onClick={() => window.open(scanResult.liveUrl, "_blank", "noopener,noreferrer")}
                              className="inline-flex items-center gap-1.5 rounded-lg bg-[#2563EB] hover:bg-[#1D4ED8] text-white px-3.5 py-1.5 text-xs font-bold uppercase shadow-2xs transition active:scale-[0.98]"
                            >
                              <FiExternalLink className="h-3.5 w-3.5" />
                              <span>Open Staff Portal</span>
                            </button>
                          </div>
                        </div>

                        {/* Scannable Mobile QR Code Card */}
                        <div className="flex flex-col items-center shrink-0 self-center sm:self-auto rounded-xl border border-slate-200/90 bg-slate-50 p-2.5 dark:border-slate-700 dark:bg-slate-800/90 shadow-2xs">
                          <div className="rounded-lg bg-white p-2 shadow-xs">
                            <QRCodeSVG
                              value={scanResult.liveUrl}
                              size={88}
                              level="M"
                              includeMargin={false}
                            />
                          </div>
                          <span className="mt-1.5 text-[9px] font-bold text-slate-500 dark:text-slate-400 tracking-tight text-center">
                            📱 Scan with Phone
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* ERROR / WARNING STATE */}
                {!scanResult.success && (
                  <div
                    className={classNames(
                      "rounded-2xl border p-4",
                      scanResult.type === "warning"
                        ? "border-amber-200 bg-amber-50/70 text-amber-800 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-300"
                        : "border-rose-200 bg-rose-50/70 text-rose-800 dark:border-rose-500/20 dark:bg-rose-500/10 dark:text-rose-300"
                    )}
                  >
                    <div className="flex items-center gap-2">
                      <FiAlertCircle className="h-5 w-5 shrink-0" />
                      <span className="text-xs font-bold uppercase tracking-wider font-display">
                        {scanResult.message}
                      </span>
                    </div>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </Card>

      {/* ── Recent Gate Activity Section ───────────────────────── */}
      <Card className="border-slate-200/90 dark:border-slate-800 shadow-card">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white font-display">
              Recent Gate Activity
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Live audit stream of staff entry & exit scans
            </p>
          </div>
          <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-600 dark:bg-slate-800 dark:text-slate-300 font-mono">
            {recentActivities.length} logs
          </span>
        </div>

        <div className="overflow-x-auto mt-2">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-100 text-[11px] font-bold uppercase text-slate-400 dark:border-slate-800">
                <th className="py-3 px-3">Staff Member</th>
                <th className="py-3 px-3">RFID Card</th>
                <th className="py-3 px-3">Movement</th>
                <th className="py-3 px-3">Gate</th>
                <th className="py-3 px-3">Time</th>
                <th className="py-3 px-3">Status</th>
                <th className="py-3 px-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {recentActivities.map((act) => (
                <tr
                  key={act.id}
                  className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors"
                >
                  <td className="py-3 px-3">
                    <div className="flex items-center gap-2.5">
                      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-[#2563EB] font-bold text-xs dark:bg-blue-500/15 dark:text-blue-400">
                        {act.name.charAt(0)}
                      </div>
                      <div>
                        <p className="font-bold text-slate-900 dark:text-white font-display">
                          {act.name}
                        </p>
                        <p className="text-[10px] text-slate-400 font-mono">
                          {act.staffId}
                        </p>
                      </div>
                    </div>
                  </td>

                  <td className="py-3 px-3 font-mono font-medium text-slate-600 dark:text-slate-300">
                    {act.rfidTag}
                  </td>

                  <td className="py-3 px-3">
                    <span
                      className={classNames(
                        "inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[10px] font-bold uppercase",
                        act.movementType === "ENTRY"
                          ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:ring-emerald-500/20"
                          : "bg-purple-50 text-purple-700 ring-1 ring-purple-200 dark:bg-purple-500/10 dark:text-purple-400 dark:ring-purple-500/20"
                      )}
                    >
                      {act.movementType === "ENTRY" ? (
                        <FiLogIn className="h-3 w-3" />
                      ) : (
                        <FiLogOut className="h-3 w-3" />
                      )}
                      <span>{act.movementType}</span>
                    </span>
                  </td>

                  <td className="py-3 px-3 text-slate-600 dark:text-slate-400">
                    {act.gate}
                  </td>

                  <td className="py-3 px-3 text-slate-600 dark:text-slate-400">
                    <div className="font-semibold text-slate-800 dark:text-slate-200">{act.time}</div>
                    <div className="text-[10px] text-slate-400">{act.date}</div>
                  </td>

                  <td className="py-3 px-3">
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                      <FiCheckCircle className="h-3 w-3" />
                      <span>{act.status}</span>
                    </span>
                  </td>

                  <td className="py-3 px-3 text-right">
                    <button
                      onClick={() => {
                        const configuredBase = import.meta.env.VITE_STAFF_PORTAL_URL?.trim();
                        const portalBase = configuredBase || (window.location.port ? `${window.location.protocol}//${window.location.hostname}:5174` : `${window.location.origin}`);
                        const url = `${portalBase.replace(/\/+$/, "")}/staff/${act.staffId}`;
                        window.open(url, "_blank", "noopener,noreferrer");
                      }}
                      className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-semibold text-slate-700 shadow-2xs hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
                    >
                      <span>Portal</span>
                      <FiExternalLink className="h-3 w-3 text-slate-400" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
