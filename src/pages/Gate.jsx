import { useState, useRef, useEffect, useCallback, useMemo } from "react";
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
  FiCamera,
  FiRefreshCw,
  FiSlash,
  FiUsers,
  FiSearch,
  FiChevronRight,
  FiInfo,
  FiRadio,
  FiZap,
} from "react-icons/fi";
import Breadcrumb from "../components/Breadcrumb";
import Card from "../components/Card";
import { QRCodeSVG } from "qrcode.react";
import { gateService } from "../services/gateService";
import { classNames } from "../utils/formatters";

export default function Gate() {
  const navigate = useNavigate();
  const [accessMode, setAccessMode] = useState("STAFF"); // "STAFF" | "PARENT"
  const [rfidInput, setRfidInput] = useState("");
  const [parentQrInput, setParentQrInput] = useState("");
  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState(null);
  const [parentScanResult, setParentScanResult] = useState(null);
  const [copied, setCopied] = useState(false);
  const [recentActivities, setRecentActivities] = useState([]);
  const [gateSummary, setGateSummary] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Activity Filter & Search
  const [activityFilter, setActivityFilter] = useState("ALL"); // "ALL" | "STAFF" | "PARENT"
  const [activitySearch, setActivitySearch] = useState("");

  // Camera Scanner States
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState(null);
  const [isCameraScanning, setIsCameraScanning] = useState(false);

  const rfidInputRef = useRef(null);
  const parentInputRef = useRef(null);
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const scanIntervalRef = useRef(null);
  const lastScannedQrRef = useRef(null);
  const lastScannedTimeRef = useRef(0);

  const demoTags = [
    { tag: "RFID-STF-001", staffId: "STF-001", name: "Rahul Sharma", role: "Security Lead", dept: "Operations" },
    { tag: "RFID-STF-002", staffId: "STF-002", name: "Amit Kumar", role: "Caregiver", dept: "Child Care" },
    { tag: "RFID-STF-003", staffId: "STF-003", name: "Priya Singh", role: "Social Worker", dept: "Welfare" },
    { tag: "RFID-STF-004", staffId: "STF-004", name: "Arjun Verma", role: "Medical Staff", dept: "Healthcare" },
    { tag: "RFID-STF-005", staffId: "STF-005", name: "Neha Kapoor", role: "Administrator", dept: "Admin" },
  ];

  const demoParentPasses = [
    { id: "NFC-VST-D3642D", label: "Approved Pass (Today Entry)", type: "VALID", status: "Approved" },
    { id: "NFC-VST-FUTURE", label: "Future Date Slot (Early Visit)", type: "WRONG_DATE", status: "Invalid Date" },
    { id: "NFC-VST-PENDING", label: "Pending Approval Pass", type: "PENDING", status: "Unverified" },
    { id: "NFC-VST-UNKNOWN", label: "Unregistered Token Test", type: "INVALID", status: "Not Found" },
  ];

  useEffect(() => {
    loadActivities();
    return () => {
      stopCamera();
    };
  }, []);

  async function loadActivities() {
    try {
      setIsRefreshing(true);
      const [activities, summary] = await Promise.all([
        gateService.getRecentActivity(),
        gateService.getGateSummary(),
      ]);
      setRecentActivities(activities || []);
      setGateSummary(summary);
    } catch (err) {
      console.error("Failed to load gate activity:", err);
    } finally {
      setIsRefreshing(false);
    }
  }

  // ── Camera Scanner Controls ────────────────────────────────────
  const stopCamera = useCallback(() => {
    if (scanIntervalRef.current) {
      clearInterval(scanIntervalRef.current);
      scanIntervalRef.current = null;
    }
    if (streamRef.current) {
      try {
        streamRef.current.getTracks().forEach((track) => track.stop());
      } catch (e) {
        console.warn("Camera track stop notice:", e);
      }
      streamRef.current = null;
    }
    setCameraActive(false);
  }, []);

  const startCamera = useCallback(async () => {
    stopCamera();
    setCameraError(null);
    setCameraActive(true);

    try {
      const constraints = {
        video: {
          facingMode: { ideal: "environment" },
          width: { ideal: 640 },
          height: { ideal: 480 },
        },
        audio: false,
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }

      // Check for native BarcodeDetector API support
      if ("BarcodeDetector" in window) {
        const barcodeDetector = new window.BarcodeDetector({ formats: ["qr_code"] });

        scanIntervalRef.current = setInterval(async () => {
          if (!videoRef.current || videoRef.current.readyState < 2 || isCameraScanning) return;

          try {
            const barcodes = await barcodeDetector.detect(videoRef.current);
            if (barcodes && barcodes.length > 0) {
              const rawValue = barcodes[0].rawValue;
              const now = Date.now();

              // Debounce repeat scans of same code within 3 seconds
              if (lastScannedQrRef.current === rawValue && now - lastScannedTimeRef.current < 3000) {
                return;
              }

              lastScannedQrRef.current = rawValue;
              lastScannedTimeRef.current = now;
              handleProcessParentQR(rawValue);
            }
          } catch (detErr) {
            // Frame skip
          }
        }, 350);
      }
    } catch (err) {
      console.warn("Camera stream access failed:", err);
      setCameraError(
        err.name === "NotAllowedError" || err.name === "PermissionDeniedError"
          ? "Camera permission was denied. Please enable camera access in your browser or use manual pass input."
          : "No compatible camera found or camera is in use by another application."
      );
      stopCamera();
    }
  }, [stopCamera, isCameraScanning]);

  const handleModeChange = (mode) => {
    setAccessMode(mode);
    setScanResult(null);
    setParentScanResult(null);

    if (mode === "PARENT") {
      startCamera();
    } else {
      stopCamera();
      if (rfidInputRef.current) rfidInputRef.current.focus();
    }
  };

  // ── Staff RFID Verification Flow ───────────────────────────────
  const handleScan = async (e) => {
    if (e) e.preventDefault();

    const trimmed = rfidInput.trim();
    if (!trimmed) {
      setScanResult({
        success: false,
        type: "warning",
        message: "Please enter a valid RFID Card ID or Staff ID.",
      });
      if (rfidInputRef.current) rfidInputRef.current.focus();
      return;
    }

    setIsScanning(true);
    setScanResult(null);

    try {
      const response = await gateService.scanRFID(trimmed);

      if (response.success) {
        const configuredBase = import.meta.env.VITE_STAFF_PORTAL_URL?.trim();
        const portalBase =
          configuredBase ||
          (window.location.port
            ? `${window.location.protocol}//${window.location.hostname}:5174`
            : `${window.location.origin}`);
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
        message: "Error processing RFID scan. Please verify server connection.",
      });
    } finally {
      setIsScanning(false);
    }
  };

  // ── Parent Visit QR Verification Flow ──────────────────────────
  const handleProcessParentQR = async (credential) => {
    if (!credential || !credential.trim()) return;

    const cleanInput = credential.trim();
    setIsCameraScanning(true);
    setIsScanning(true);
    setParentScanResult(null);

    try {
      const response = await gateService.scanParentQR(cleanInput);

      const configuredParentPortalBase = import.meta.env.VITE_PARENT_PORTAL_URL?.trim();
      const parentPortalBase =
        configuredParentPortalBase ||
        (window.location.port
          ? `${window.location.protocol}//${window.location.hostname}:5175`
          : `${window.location.origin}`);
      const passIdentifier = response.passId || response.visit?.requestId || cleanInput;
      const liveParentUrl = `${parentPortalBase.replace(/\/+$/, "")}/visit/${passIdentifier}`;

      setParentScanResult({
        ...response,
        liveUrl: liveParentUrl,
      });
      loadActivities();
    } catch (err) {
      setParentScanResult({
        success: false,
        access: "DENIED",
        message: "Error communicating with child safety server. Please retry.",
      });
    } finally {
      setIsCameraScanning(false);
      setIsScanning(false);
    }
  };

  const handleManualParentSubmit = (e) => {
    if (e) e.preventDefault();
    if (parentQrInput.trim()) {
      handleProcessParentQR(parentQrInput.trim());
    }
  };

  const handleQuickFill = (tag) => {
    setRfidInput(tag);
    setScanResult(null);
    if (rfidInputRef.current) rfidInputRef.current.focus();
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

  // Filtered Activity List
  const filteredActivities = useMemo(() => {
    return recentActivities.filter((act) => {
      const isParent = act.userType === "PARENT" || act.role?.toLowerCase().includes("parent");
      if (activityFilter === "STAFF" && isParent) return false;
      if (activityFilter === "PARENT" && !isParent) return false;

      if (activitySearch.trim()) {
        const q = activitySearch.toLowerCase();
        const matchesName = act.name?.toLowerCase().includes(q);
        const matchesId = (act.staffId || act.rfidTag || "").toLowerCase().includes(q);
        const matchesGate = act.gate?.toLowerCase().includes(q);
        return matchesName || matchesId || matchesGate;
      }
      return true;
    });
  }, [recentActivities, activityFilter, activitySearch]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* ── Top Header & Context Bar ────────────────────────────── */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-slate-200/80 pb-5 dark:border-slate-800">
        <div>
          <Breadcrumb items={[{ label: "Orphanage", path: "/orphanage" }, { label: "Gate Control Center" }]} />
          <div className="mt-1 flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white font-display sm:text-3xl">
              Gate Control Center
            </h1>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700 ring-1 ring-emerald-600/20 dark:bg-emerald-500/10 dark:text-emerald-400 dark:ring-emerald-500/20">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              GATE-01 ONLINE
            </span>
          </div>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Real-time biometric & credential access management for staff RFID badges and parent visit QR passes.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={loadActivities}
            disabled={isRefreshing}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 shadow-2xs hover:bg-slate-50 active:scale-98 transition dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            <FiRefreshCw className={classNames("h-3.5 w-3.5", isRefreshing && "animate-spin text-blue-600")} />
            <span>{isRefreshing ? "Syncing..." : "Sync Gate"}</span>
          </button>

          <button
            type="button"
            onClick={() => navigate("/orphanage/access-audit")}
            className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2 text-xs font-semibold text-white shadow-2xs hover:bg-slate-800 active:scale-98 transition dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-white"
          >
            <FiShield className="h-3.5 w-3.5 text-blue-400 dark:text-blue-600" />
            <span>Access Audit Log</span>
          </button>
        </div>
      </div>

      {/* ── Key Metrics Overview Cards ──────────────────────────── */}
      {gateSummary?.todaySummary && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {/* Card 1: Staff Movements */}
          <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Staff Movements
              </span>
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400">
                <FiCreditCard className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-slate-900 dark:text-white font-display">
                {gateSummary.todaySummary.staffEntries}
              </span>
              <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400">
                ↑ Entries Today
              </span>
            </div>
            <div className="mt-2 flex items-center justify-between text-xs text-slate-500 border-t border-slate-100 pt-2 dark:border-slate-800">
              <span>Exits Logged:</span>
              <span className="font-semibold text-slate-700 dark:text-slate-300">
                {gateSummary.todaySummary.staffExits} exits
              </span>
            </div>
          </div>

          {/* Card 2: Parent Visits */}
          <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Parent Visits
              </span>
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400">
                <FiUser className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-indigo-600 dark:text-indigo-400 font-display">
                {gateSummary.todaySummary.parentEntries}
              </span>
              <span className="text-xs font-medium text-indigo-500 dark:text-indigo-400">
                Checked In
              </span>
            </div>
            <div className="mt-2 flex items-center justify-between text-xs text-slate-500 border-t border-slate-100 pt-2 dark:border-slate-800">
              <span>Completed Visits:</span>
              <span className="font-semibold text-slate-700 dark:text-slate-300">
                {gateSummary.todaySummary.parentExits} completed
              </span>
            </div>
          </div>

          {/* Card 3: Currently Inside */}
          <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Active On-Premises
              </span>
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400">
                <FiActivity className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-emerald-600 dark:text-emerald-400 font-display">
                {gateSummary.todaySummary.activeInside}
              </span>
              <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                Total People
              </span>
            </div>
            <div className="mt-2 flex items-center justify-between text-xs text-slate-500 border-t border-slate-100 pt-2 dark:border-slate-800">
              <span>Breakdown:</span>
              <span className="font-semibold text-slate-700 dark:text-slate-300">
                {gateSummary.todaySummary.staffInside || 3} Staff • {gateSummary.todaySummary.parentsInside || 0} Parents
              </span>
            </div>
          </div>

          {/* Card 4: Expected Visitors */}
          <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Expected Visits
              </span>
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400">
                <FiClock className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-amber-600 dark:text-amber-400 font-display">
                {gateSummary.todaySummary.expectedVisitors}
              </span>
              <span className="text-xs font-medium text-amber-600 dark:text-amber-400">
                Remaining Slots
              </span>
            </div>
            <div className="mt-2 flex items-center justify-between text-xs text-slate-500 border-t border-slate-100 pt-2 dark:border-slate-800">
              <span>Pass Status:</span>
              <span className="font-semibold text-slate-700 dark:text-slate-300">
                Approved & Awaiting
              </span>
            </div>
          </div>
        </div>
      )}

      {/* ── Main Access Terminal Card ───────────────────────────── */}
      <div className="rounded-3xl border border-slate-200/80 bg-white shadow-sm overflow-hidden dark:border-slate-800 dark:bg-slate-900">
        {/* Terminal Header & Mode Selector */}
        <div className="border-b border-slate-200/80 bg-slate-50/50 p-5 dark:border-slate-800 dark:bg-slate-950/40">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <FiRadio className="h-4 w-4 text-blue-600 dark:text-blue-400 animate-pulse" />
                <h2 className="text-base font-bold text-slate-900 dark:text-white font-display">
                  Access Verification Terminal
                </h2>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Select checkpoint mode to scan RFID credentials or verify parent QR access passes.
              </p>
            </div>

            {/* Segmented Mode Switcher */}
            <div className="inline-flex rounded-xl bg-slate-200/70 p-1 dark:bg-slate-800">
              <button
                type="button"
                onClick={() => handleModeChange("STAFF")}
                className={classNames(
                  "flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-bold transition-all",
                  accessMode === "STAFF"
                    ? "bg-white text-blue-600 shadow-sm dark:bg-slate-900 dark:text-blue-400"
                    : "text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
                )}
              >
                <FiCreditCard className="h-3.5 w-3.5" />
                <span>Staff RFID</span>
              </button>

              <button
                type="button"
                onClick={() => handleModeChange("PARENT")}
                className={classNames(
                  "flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-bold transition-all",
                  accessMode === "PARENT"
                    ? "bg-white text-indigo-600 shadow-sm dark:bg-slate-900 dark:text-indigo-400"
                    : "text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
                )}
              >
                <FiCamera className="h-3.5 w-3.5" />
                <span>Parent QR Scanner</span>
              </button>
            </div>
          </div>
        </div>

        {/* Terminal Body */}
        <div className="p-6">
          {/* ── MODE 1: STAFF RFID ────────────────────────────────── */}
          {accessMode === "STAFF" && (
            <div className="space-y-6 max-w-4xl">
              <div className="grid gap-6 lg:grid-cols-12 items-start">
                {/* Left Column: Input and Quick Actions */}
                <div className="lg:col-span-7 space-y-5">
                  <form onSubmit={handleScan} className="space-y-3">
                    <label
                      htmlFor="rfid-input"
                      className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400"
                    >
                      Scan Card ID / Enter Staff ID
                    </label>
                    <div className="flex gap-2.5">
                      <div className="relative flex-1">
                        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
                          <FiCreditCard className="h-4 w-4" />
                        </div>
                        <input
                          ref={rfidInputRef}
                          id="rfid-input"
                          name="rfid-input"
                          type="text"
                          autoComplete="off"
                          spellCheck="false"
                          value={rfidInput}
                          onChange={(e) => setRfidInput(e.target.value)}
                          placeholder="e.g. RFID-STF-001 or STF-001"
                          className="w-full rounded-xl border border-slate-200 bg-slate-50/50 pl-10 pr-4 py-2.5 text-sm font-medium text-slate-900 placeholder-slate-400 transition-colors focus:border-blue-600 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600/20 dark:border-slate-800 dark:bg-slate-950/60 dark:text-white dark:placeholder-slate-500"
                        />
                      </div>

                      <button
                        type="submit"
                        disabled={isScanning}
                        className={classNames(
                          "inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 text-xs font-bold shadow-sm shadow-blue-600/20 active:scale-98 transition",
                          isScanning && "cursor-not-allowed opacity-75"
                        )}
                      >
                        {isScanning ? (
                          <>
                            <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                            <span>Verifying...</span>
                          </>
                        ) : (
                          <>
                            <span>Verify Card</span>
                            <FiCornerDownLeft className="h-3.5 w-3.5 opacity-80" />
                          </>
                        )}
                      </button>
                    </div>
                  </form>

                  {/* Quick Simulation Cards */}
                  <div className="rounded-2xl border border-slate-200/80 bg-slate-50/60 p-4 dark:border-slate-800 dark:bg-slate-950/40">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700 dark:text-slate-300">
                        <FiZap className="h-3.5 w-3.5 text-amber-500" />
                        <span>Quick Test RFID Badges:</span>
                      </div>
                      <span className="text-[10px] text-slate-400">Click to autofill & test</span>
                    </div>

                    <div className="grid gap-2 sm:grid-cols-2">
                      {demoTags.map(({ tag, staffId, name, role }) => (
                        <button
                          key={tag}
                          type="button"
                          onClick={() => handleQuickFill(tag)}
                          className="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-2.5 text-left text-xs shadow-2xs hover:border-blue-500 hover:shadow-xs transition dark:border-slate-800 dark:bg-slate-900"
                        >
                          <div className="min-w-0 flex-1">
                            <p className="font-semibold text-slate-800 dark:text-slate-200 truncate">{name}</p>
                            <p className="text-[10px] font-mono text-slate-400 mt-0.5">{tag} • {role}</p>
                          </div>
                          <FiChevronRight className="h-3.5 w-3.5 text-slate-400 shrink-0 ml-2" />
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Right Column: Information & Help */}
                <div className="lg:col-span-5 rounded-2xl border border-blue-100 bg-blue-50/40 p-4 text-xs text-blue-900 dark:border-blue-900/30 dark:bg-blue-950/20 dark:text-blue-200 space-y-3">
                  <div className="flex items-center gap-2 font-bold text-blue-700 dark:text-blue-300">
                    <FiInfo className="h-4 w-4 shrink-0" />
                    <span>RFID Clearance Protocol</span>
                  </div>
                  <p className="leading-relaxed text-slate-600 dark:text-slate-300 text-[11px]">
                    Every staff tap automatically toggles between <strong>ENTRY</strong> and <strong>EXIT</strong>. The system records real-time timestamp, gate location, and updates on-premises occupancy statistics.
                  </p>
                  <div className="space-y-1.5 border-t border-blue-200/60 pt-2.5 dark:border-blue-900/50 text-[11px] text-slate-600 dark:text-slate-300">
                    <div className="flex items-center justify-between">
                      <span>Live Staff Portal Port:</span>
                      <span className="font-mono font-semibold text-blue-600 dark:text-blue-400">:5174</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Auto-Sync Interval:</span>
                      <span className="font-semibold">Live WebSockets / 30s Poll</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Staff Scan Result Feedback Card */}
              <AnimatePresence mode="wait">
                {scanResult && (
                  <motion.div
                    key={scanResult.type + (scanResult.message || scanResult.staff?.staffId)}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.2 }}
                    className="pt-2"
                  >
                    {scanResult.success && scanResult.staff ? (
                      <div className="rounded-2xl border border-emerald-200 bg-emerald-50/30 p-5 dark:border-emerald-500/20 dark:bg-emerald-950/20 shadow-xs">
                        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-emerald-200/70 pb-3.5 dark:border-emerald-500/20">
                          <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400">
                            <FiCheckCircle className="h-5 w-5" />
                            <span className="text-sm font-bold tracking-wide uppercase font-display">
                              ✓ ACCESS GRANTED • RFID VERIFIED
                            </span>
                          </div>

                          <div className="flex items-center gap-2">
                            <span
                              className={classNames(
                                "inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-bold uppercase text-white shadow-2xs",
                                scanResult.movement.movementType === "ENTRY"
                                  ? "bg-emerald-600"
                                  : "bg-purple-600"
                              )}
                            >
                              {scanResult.movement.movementType === "ENTRY" ? (
                                <FiLogIn className="h-3.5 w-3.5" />
                              ) : (
                                <FiLogOut className="h-3.5 w-3.5" />
                              )}
                              <span>{scanResult.movement.movementType}</span>
                            </span>

                            <span className="inline-flex items-center rounded-lg bg-blue-100 px-2.5 py-1 text-xs font-bold text-blue-700 dark:bg-blue-500/20 dark:text-blue-300 uppercase">
                              STATUS: {scanResult.staff.currentStatus}
                            </span>
                          </div>
                        </div>

                        {/* Staff Profile Row */}
                        <div className="mt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                          <div className="flex items-center gap-3.5">
                            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-blue-600 text-white font-bold text-base font-display shadow-xs">
                              {scanResult.staff.name.charAt(0)}
                            </div>
                            <div>
                              <h3 className="text-base font-bold text-slate-900 dark:text-white font-display">
                                {scanResult.staff.name}
                              </h3>
                              <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                                <span>ID: <strong className="font-mono text-slate-700 dark:text-slate-300">{scanResult.staff.staffId}</strong></span>
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
                            <div className="flex items-center sm:justify-end gap-1.5 mt-1 text-slate-500">
                              <FiClock className="h-3.5 w-3.5" />
                              <span>{scanResult.movement.time}</span>
                            </div>
                          </div>
                        </div>

                        {/* Live URL & QR Container */}
                        <div className="mt-4 rounded-xl border border-slate-200/90 bg-white p-4 shadow-2xs dark:border-slate-800 dark:bg-slate-900">
                          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2">
                                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                                <p className="text-[10px] font-bold tracking-wider uppercase text-slate-400">
                                  LIVE STAFF ACCESS PORTAL LINK
                                </p>
                              </div>
                              <p className="mt-1 font-mono text-xs text-blue-600 dark:text-blue-400 break-all select-all font-semibold">
                                {scanResult.liveUrl}
                              </p>

                              <div className="mt-3 flex flex-wrap items-center gap-2.5">
                                <button
                                  type="button"
                                  onClick={() => handleCopyLink(scanResult.liveUrl)}
                                  className={classNames(
                                    "inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition active:scale-98",
                                    copied
                                      ? "bg-emerald-600 text-white"
                                      : "bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
                                  )}
                                >
                                  {copied ? (
                                    <>
                                      <FiCheck className="h-3.5 w-3.5" />
                                      <span>Link Copied</span>
                                    </>
                                  ) : (
                                    <>
                                      <FiCopy className="h-3.5 w-3.5" />
                                      <span>Copy Portal Link</span>
                                    </>
                                  )}
                                </button>

                                <button
                                  type="button"
                                  onClick={() => window.open(scanResult.liveUrl, "_blank", "noopener,noreferrer")}
                                  className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 text-xs font-semibold shadow-2xs transition active:scale-98"
                                >
                                  <FiExternalLink className="h-3.5 w-3.5" />
                                  <span>Open Staff Portal</span>
                                </button>
                              </div>
                            </div>

                            <div className="flex flex-col items-center shrink-0 self-center sm:self-auto rounded-xl border border-slate-200 bg-slate-50 p-2.5 dark:border-slate-800 dark:bg-slate-950">
                              <div className="rounded-lg bg-white p-2 shadow-xs">
                                <QRCodeSVG value={scanResult.liveUrl} size={84} level="M" />
                              </div>
                              <span className="mt-1.5 text-[9px] font-semibold text-slate-500 dark:text-slate-400">
                                Staff Pass QR
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div
                        className={classNames(
                          "rounded-2xl border p-4 text-xs font-semibold",
                          scanResult.type === "warning"
                            ? "border-amber-200 bg-amber-50/80 text-amber-900 dark:border-amber-500/20 dark:bg-amber-950/20 dark:text-amber-300"
                            : "border-rose-200 bg-rose-50/80 text-rose-900 dark:border-rose-500/20 dark:bg-rose-950/20 dark:text-rose-300"
                        )}
                      >
                        <div className="flex items-center gap-2.5">
                          <FiAlertCircle className="h-5 w-5 shrink-0" />
                          <span>{scanResult.message}</span>
                        </div>
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}

          {/* ── MODE 2: PARENT VISIT QR SCANNER ──────────────────── */}
          {accessMode === "PARENT" && (
            <div className="space-y-6">
              <div className="grid gap-6 lg:grid-cols-12 items-start">
                {/* Camera Viewport Area */}
                <div className="lg:col-span-6 flex flex-col items-center">
                  <div className="relative w-full max-w-md aspect-4/3 overflow-hidden rounded-3xl border-2 border-dashed border-indigo-300/80 bg-slate-950 shadow-inner flex items-center justify-center dark:border-indigo-500/30">
                    {cameraActive ? (
                      <video
                        ref={videoRef}
                        playsInline
                        muted
                        autoPlay
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="p-6 text-center text-slate-400 space-y-3">
                        <FiCamera className="mx-auto h-12 w-12 text-slate-600" />
                        <p className="text-xs font-medium">Camera preview currently inactive</p>
                        <button
                          type="button"
                          onClick={startCamera}
                          className="rounded-xl bg-indigo-600 px-4 py-2 text-xs font-bold text-white hover:bg-indigo-500 shadow-sm"
                        >
                          Activate Camera
                        </button>
                      </div>
                    )}

                    {/* Camera HUD Targeting Reticle */}
                    {cameraActive && !cameraError && (
                      <div className="pointer-events-none absolute inset-0 flex items-center justify-center p-6">
                        <div className="relative h-44 w-44 rounded-2xl border-2 border-emerald-400/80 shadow-[0_0_25px_rgba(52,211,153,0.35)]">
                          <div className="absolute top-0 left-0 h-4 w-4 border-t-4 border-l-4 border-emerald-400 -mt-1 -ml-1 rounded-tl" />
                          <div className="absolute top-0 right-0 h-4 w-4 border-t-4 border-r-4 border-emerald-400 -mt-1 -mr-1 rounded-tr" />
                          <div className="absolute bottom-0 left-0 h-4 w-4 border-b-4 border-l-4 border-emerald-400 -mb-1 -ml-1 rounded-bl" />
                          <div className="absolute bottom-0 right-0 h-4 w-4 border-b-4 border-r-4 border-emerald-400 -mb-1 -mr-1 rounded-br" />
                          <div className="h-0.5 w-full bg-emerald-400 shadow-sm animate-pulse mt-20" />
                        </div>
                      </div>
                    )}

                    {cameraError && (
                      <div className="absolute inset-0 bg-slate-950/90 p-6 flex flex-col items-center justify-center text-center text-white space-y-3">
                        <FiAlertCircle className="h-10 w-10 text-amber-400" />
                        <h4 className="text-xs font-bold uppercase tracking-wider text-amber-300">
                          Camera Access Notice
                        </h4>
                        <p className="text-[11px] text-slate-300 leading-relaxed max-w-xs">
                          {cameraError}
                        </p>
                        <button
                          type="button"
                          onClick={startCamera}
                          className="rounded-xl bg-amber-500 px-4 py-1.5 text-xs font-bold text-slate-950 hover:bg-amber-400 transition"
                        >
                          Retry Access
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="mt-3 flex items-center justify-between w-full max-w-md px-1 text-xs text-slate-500">
                    <span>Align digital QR pass within HUD frame</span>
                    {cameraActive && (
                      <button
                        type="button"
                        onClick={startCamera}
                        className="font-semibold text-indigo-600 hover:text-indigo-700 dark:text-indigo-400"
                      >
                        Restart Feed
                      </button>
                    )}
                  </div>
                </div>

                {/* Manual Pass ID Input & Quick Demo Passes */}
                <div className="lg:col-span-6 space-y-5">
                  <form onSubmit={handleManualParentSubmit} className="space-y-3">
                    <label
                      htmlFor="parent-qr-input"
                      className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400"
                    >
                      Or Enter Pass ID / Scanned QR Token
                    </label>
                    <div className="flex gap-2.5">
                      <input
                        ref={parentInputRef}
                        id="parent-qr-input"
                        name="parent-qr-input"
                        type="text"
                        autoComplete="off"
                        value={parentQrInput}
                        onChange={(e) => setParentQrInput(e.target.value)}
                        placeholder="e.g. NFC-VST-D3642D or scan token"
                        className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-2.5 text-xs font-mono font-bold text-slate-900 placeholder-slate-400 focus:border-indigo-600 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-600/20 dark:border-slate-800 dark:bg-slate-950/60 dark:text-white"
                      />
                      <button
                        type="submit"
                        disabled={isScanning || !parentQrInput.trim()}
                        className="rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white px-5 py-2.5 text-xs font-bold shrink-0 shadow-sm shadow-indigo-600/20 active:scale-98 transition"
                      >
                        Verify Pass
                      </button>
                    </div>
                  </form>

                  {/* Quick Parent Demo Pass Chips */}
                  <div className="rounded-2xl border border-slate-200/80 bg-slate-50/60 p-4 dark:border-slate-800 dark:bg-slate-950/40 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                        Demo Parent Visit Passes:
                      </span>
                      <span className="text-[10px] text-slate-400">One-click test</span>
                    </div>

                    <div className="grid gap-2 sm:grid-cols-2">
                      {demoParentPasses.map(({ id, label, status }) => (
                        <button
                          key={id}
                          type="button"
                          onClick={() => {
                            setParentQrInput(id);
                            handleProcessParentQR(id);
                          }}
                          className="flex flex-col text-left rounded-xl border border-slate-200 bg-white p-3 shadow-2xs hover:border-indigo-500 hover:shadow-xs transition dark:border-slate-800 dark:bg-slate-900"
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-mono text-xs font-extrabold text-indigo-600 dark:text-indigo-400">
                              {id}
                            </span>
                            <span className="text-[9px] font-semibold uppercase px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                              {status}
                            </span>
                          </div>
                          <span className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 font-medium">
                            {label}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Parent QR Result Modal / Container */}
              <AnimatePresence mode="wait">
                {parentScanResult && (
                  <motion.div
                    key={parentScanResult.access + (parentScanResult.message || "")}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    className="pt-2"
                  >
                    {parentScanResult.success && parentScanResult.access === "GRANTED" ? (
                      <div className="rounded-3xl border border-emerald-200 bg-gradient-to-br from-emerald-50/60 via-white to-emerald-50/20 p-6 dark:border-emerald-500/20 dark:from-emerald-950/20 dark:via-slate-900 dark:to-slate-950 shadow-sm">
                        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-emerald-200/60 pb-4 dark:border-emerald-500/20">
                          <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400">
                            <FiCheckCircle className="h-6 w-6" />
                            <div>
                              <h3 className="text-base font-extrabold uppercase tracking-wide font-display">
                                ✓ PARENT VISIT CLEARANCE GRANTED
                              </h3>
                              <p className="text-xs text-emerald-600 dark:text-emerald-300">
                                {parentScanResult.movement === "ENTRY"
                                  ? "Parent Visit Check-In Successfully Recorded"
                                  : "Parent Visit Check-Out Completed"}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <span
                              className={classNames(
                                "inline-flex items-center gap-1 rounded-xl px-3 py-1 text-xs font-bold uppercase text-white shadow-2xs",
                                parentScanResult.movement === "ENTRY"
                                  ? "bg-emerald-600"
                                  : "bg-purple-600"
                              )}
                            >
                              {parentScanResult.movement === "ENTRY" ? (
                                <FiLogIn className="h-3.5 w-3.5" />
                              ) : (
                                <FiLogOut className="h-3.5 w-3.5" />
                              )}
                              <span>{parentScanResult.movement}</span>
                            </span>

                            <span className="inline-flex items-center rounded-xl bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-300 uppercase">
                              AUTHORIZED
                            </span>
                          </div>
                        </div>

                        {/* Verified Details Grid */}
                        <div className="mt-5 grid gap-3 sm:grid-cols-2 md:grid-cols-4 text-xs">
                          <div className="rounded-2xl bg-white p-3.5 border border-slate-200/70 shadow-2xs dark:bg-slate-800/60 dark:border-slate-800">
                            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                              Verified Parent
                            </p>
                            <p className="mt-1 font-bold text-slate-900 dark:text-white text-sm">
                              {parentScanResult.parent?.name || "Parent Visitor"}
                            </p>
                          </div>

                          <div className="rounded-2xl bg-white p-3.5 border border-slate-200/70 shadow-2xs dark:bg-slate-800/60 dark:border-slate-800">
                            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                              Child Interaction
                            </p>
                            <p className="mt-1 font-bold text-slate-900 dark:text-white text-sm">
                              {parentScanResult.child?.name || "Assigned Child"}
                            </p>
                            {parentScanResult.child?.code && (
                              <p className="text-[10px] text-slate-400 font-mono mt-0.5">
                                #{parentScanResult.child.code}
                              </p>
                            )}
                          </div>

                          <div className="rounded-2xl bg-white p-3.5 border border-slate-200/70 shadow-2xs dark:bg-slate-800/60 dark:border-slate-800">
                            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                              Visit Window
                            </p>
                            <p className="mt-1 font-bold text-slate-800 dark:text-slate-200">
                              {parentScanResult.visit?.visitTime || "Morning Slot"}
                            </p>
                            <p className="text-[10px] text-slate-500 mt-0.5">
                              {new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                            </p>
                          </div>

                          <div className="rounded-2xl bg-white p-3.5 border border-slate-200/70 shadow-2xs dark:bg-slate-800/60 dark:border-slate-800">
                            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                              Security Gate
                            </p>
                            <p className="mt-1 font-bold text-slate-800 dark:text-slate-200">
                              Main Gate Checkpoint
                            </p>
                            <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold mt-0.5">
                              ✓ Guard Logged
                            </p>
                          </div>
                        </div>

                        {/* Live Parent Portal Link */}
                        {parentScanResult.liveUrl && (
                          <div className="mt-5 rounded-2xl border border-indigo-200 bg-white p-4 shadow-2xs dark:border-indigo-900/50 dark:bg-slate-900">
                            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-2">
                                  <span className="h-2 w-2 rounded-full bg-indigo-500 animate-pulse" />
                                  <p className="text-[10px] font-bold tracking-wider uppercase text-slate-400">
                                    LIVE PARENT VISIT PORTAL
                                  </p>
                                </div>
                                <p className="mt-1 font-mono text-xs text-indigo-600 dark:text-indigo-400 break-all select-all font-semibold">
                                  {parentScanResult.liveUrl}
                                </p>

                                <div className="mt-3 flex flex-wrap items-center gap-2.5">
                                  <button
                                    type="button"
                                    onClick={() => handleCopyLink(parentScanResult.liveUrl)}
                                    className={classNames(
                                      "inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition active:scale-98",
                                      copied
                                        ? "bg-emerald-600 text-white"
                                        : "bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
                                    )}
                                  >
                                    {copied ? (
                                      <>
                                        <FiCheck className="h-3.5 w-3.5" />
                                        <span>Copied</span>
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
                                    onClick={() => window.open(parentScanResult.liveUrl, "_blank", "noopener,noreferrer")}
                                    className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white px-3.5 py-1.5 text-xs font-semibold shadow-2xs transition active:scale-98"
                                  >
                                    <FiExternalLink className="h-3.5 w-3.5" />
                                    <span>Open Visit Portal</span>
                                  </button>
                                </div>
                              </div>

                              <div className="flex flex-col items-center shrink-0 self-center sm:self-auto rounded-xl border border-slate-200 bg-slate-50 p-2.5 dark:border-slate-800 dark:bg-slate-950">
                                <div className="rounded-lg bg-white p-2 shadow-xs">
                                  <QRCodeSVG value={parentScanResult.liveUrl} size={84} level="M" />
                                </div>
                                <span className="mt-1.5 text-[9px] font-semibold text-slate-500 dark:text-slate-400">
                                  Parent Pass QR
                                </span>
                              </div>
                            </div>
                          </div>
                        )}

                        <div className="mt-4 flex items-center justify-between flex-wrap gap-3 pt-3 border-t border-slate-200/60 dark:border-slate-800">
                          <p className="text-xs text-slate-600 dark:text-slate-400 font-medium">
                            {parentScanResult.message}
                          </p>

                          <button
                            type="button"
                            onClick={() => {
                              setParentScanResult(null);
                              setParentQrInput("");
                              startCamera();
                            }}
                            className="rounded-xl bg-slate-900 px-4 py-1.5 text-xs font-bold text-white hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900 shadow-sm"
                          >
                            Scan Another Visit
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="rounded-2xl border border-rose-200 bg-rose-50/80 p-5 text-rose-900 dark:border-rose-900/40 dark:bg-rose-950/40 dark:text-rose-200 shadow-xs">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex items-start gap-3">
                            <FiSlash className="h-6 w-6 shrink-0 text-rose-600 mt-0.5" />
                            <div>
                              <h3 className="text-sm font-bold uppercase tracking-wide font-display">
                                ACCESS DENIED • UNVERIFIED PASS
                              </h3>
                              <p className="mt-1 text-xs leading-relaxed font-medium">
                                {parentScanResult.message}
                              </p>
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={() => {
                              setParentScanResult(null);
                              startCamera();
                            }}
                            className="rounded-xl border border-rose-300 bg-white px-3 py-1.5 text-xs font-bold text-rose-800 hover:bg-rose-50 dark:border-rose-800 dark:bg-slate-900 dark:text-rose-300 shrink-0"
                          >
                            Retry Scanner
                          </button>
                        </div>
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}
        </div>
      </div>

      {/* ── Recent Gate Activity Log Table ──────────────────────── */}
      <div className="rounded-3xl border border-slate-200/80 bg-white shadow-sm overflow-hidden dark:border-slate-800 dark:bg-slate-900">
        <div className="p-5 border-b border-slate-200/80 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white font-display">
              Live Gate Activity Feed
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Audited event log of all personnel, security staff, and parent visits through Gate 01.
            </p>
          </div>

          {/* Search & Filter Controls */}
          <div className="flex flex-wrap items-center gap-2.5">
            <div className="relative">
              <FiSearch className="pointer-events-none absolute inset-y-0 left-0 pl-3 my-auto h-4 w-4 text-slate-400" />
              <input
                type="text"
                value={activitySearch}
                onChange={(e) => setActivitySearch(e.target.value)}
                placeholder="Search visitor or RFID..."
                className="rounded-xl border border-slate-200 bg-slate-50/50 pl-9 pr-3 py-1.5 text-xs text-slate-900 placeholder-slate-400 focus:border-blue-600 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-600 dark:border-slate-800 dark:bg-slate-950/60 dark:text-white"
              />
            </div>

            <div className="inline-flex rounded-xl bg-slate-100 p-0.5 dark:bg-slate-800 text-xs font-semibold">
              <button
                type="button"
                onClick={() => setActivityFilter("ALL")}
                className={classNames(
                  "rounded-lg px-2.5 py-1 transition",
                  activityFilter === "ALL"
                    ? "bg-white text-slate-900 shadow-2xs dark:bg-slate-900 dark:text-white"
                    : "text-slate-500 hover:text-slate-800 dark:text-slate-400"
                )}
              >
                All ({recentActivities.length})
              </button>
              <button
                type="button"
                onClick={() => setActivityFilter("STAFF")}
                className={classNames(
                  "rounded-lg px-2.5 py-1 transition",
                  activityFilter === "STAFF"
                    ? "bg-white text-blue-600 shadow-2xs dark:bg-slate-900 dark:text-blue-400"
                    : "text-slate-500 hover:text-slate-800 dark:text-slate-400"
                )}
              >
                Staff
              </button>
              <button
                type="button"
                onClick={() => setActivityFilter("PARENT")}
                className={classNames(
                  "rounded-lg px-2.5 py-1 transition",
                  activityFilter === "PARENT"
                    ? "bg-white text-indigo-600 shadow-2xs dark:bg-slate-900 dark:text-indigo-400"
                    : "text-slate-500 hover:text-slate-800 dark:text-slate-400"
                )}
              >
                Parents
              </button>
            </div>
          </div>
        </div>

        {/* Activity Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/50 text-[11px] font-bold uppercase text-slate-400 dark:border-slate-800 dark:bg-slate-950/40">
                <th className="py-3 px-4">Visitor / Personnel</th>
                <th className="py-3 px-4">Type</th>
                <th className="py-3 px-4">Credential ID</th>
                <th className="py-3 px-4">Movement</th>
                <th className="py-3 px-4">Checkpoint</th>
                <th className="py-3 px-4">Timestamp</th>
                <th className="py-3 px-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredActivities.length > 0 ? (
                filteredActivities.map((act) => {
                  const isParent = act.userType === "PARENT" || act.role?.toLowerCase().includes("parent");

                  return (
                    <tr
                      key={act.id}
                      className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors"
                    >
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div
                            className={classNames(
                              "flex h-8 w-8 shrink-0 items-center justify-center rounded-xl font-bold text-xs shadow-2xs",
                              isParent
                                ? "bg-indigo-100 text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-300"
                                : "bg-blue-50 text-blue-600 dark:bg-blue-500/15 dark:text-blue-400"
                            )}
                          >
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

                      <td className="py-3.5 px-4">
                        <span
                          className={classNames(
                            "inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[10px] font-bold uppercase",
                            isParent
                              ? "bg-indigo-50 text-indigo-700 ring-1 ring-indigo-200 dark:bg-indigo-500/10 dark:text-indigo-400 dark:ring-indigo-500/20"
                              : "bg-blue-50 text-blue-700 ring-1 ring-blue-200 dark:bg-blue-500/10 dark:text-blue-400 dark:ring-blue-500/20"
                          )}
                        >
                          {isParent ? <FiUser className="h-3 w-3" /> : <FiCreditCard className="h-3 w-3" />}
                          <span>{isParent ? "PARENT" : "STAFF"}</span>
                        </span>
                      </td>

                      <td className="py-3.5 px-4 font-mono font-medium text-slate-600 dark:text-slate-300">
                        {act.rfidTag}
                      </td>

                      <td className="py-3.5 px-4">
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

                      <td className="py-3.5 px-4 text-slate-600 dark:text-slate-400 font-medium">
                        {act.gate}
                      </td>

                      <td className="py-3.5 px-4 text-slate-600 dark:text-slate-400">
                        <div className="font-semibold text-slate-800 dark:text-slate-200">{act.time}</div>
                        <div className="text-[10px] text-slate-400">{act.date}</div>
                      </td>

                      <td className="py-3.5 px-4">
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                          <FiCheckCircle className="h-3 w-3" />
                          <span>{act.status}</span>
                        </span>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={7} className="text-center py-10 text-slate-400">
                    <p className="text-xs">No movements found matching your filter criteria.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
