import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FiShield,
  FiCheckCircle,
  FiAlertCircle,
  FiCreditCard,
  FiCornerDownLeft,
  FiArrowRight,
  FiUser,
  FiClock,
  FiMapPin,
} from "react-icons/fi";
import { rfidService } from "../services/rfidService";
import { classNames } from "../utils/formatters";

export default function RFIDVerification() {
  const [rfidInput, setRfidInput] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationResult, setVerificationResult] = useState(null);
  const inputRef = useRef(null);

  const demoSuggestions = ["RFID-STF-001", "RFID-STF-002", "RFID-STF-003"];

  const handleVerify = async (e) => {
    if (e) e.preventDefault();

    const trimmed = rfidInput.trim();
    if (!trimmed) {
      setVerificationResult({
        type: "warning",
        message: "Please enter an RFID ID.",
      });
      if (inputRef.current) inputRef.current.focus();
      return;
    }

    setIsVerifying(true);
    setVerificationResult(null);

    try {
      const response = await rfidService.verifyRFID(trimmed);

      if (response.success) {
        setVerificationResult({
          type: "success",
          message: "RFID VERIFIED",
          data: response.data,
        });
      } else {
        setVerificationResult({
          type: "error",
          message: response.message || "RFID ID NOT RECOGNIZED",
        });
      }
    } catch (err) {
      setVerificationResult({
        type: "error",
        message: "Error communicating with RFID service. Please try again.",
      });
    } finally {
      setIsVerifying(false);
    }
  };

  const handleQuickFill = (tag) => {
    setRfidInput(tag);
    setVerificationResult(null);
    if (inputRef.current) inputRef.current.focus();
  };

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center bg-slate-950 px-4 py-12 text-slate-100 selection:bg-civic-500 selection:text-white sm:px-6 lg:px-8">
      {/* Background Ambience Elements */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-[20%] left-1/2 h-[500px] w-[600px] -translate-x-1/2 rounded-full bg-blue-600/10 blur-[120px]" />
        <div className="absolute -bottom-[20%] left-1/2 h-[400px] w-[500px] -translate-x-1/2 rounded-full bg-indigo-600/10 blur-[100px]" />
      </div>

      <div className="relative w-full max-w-md space-y-8">
        {/* Terminal Header */}
        <div className="text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-blue-500/20 bg-blue-500/10 px-3.5 py-1 text-xs font-semibold tracking-widest text-blue-400">
            <FiShield className="h-3.5 w-3.5" />
            <span>VELORA</span>
          </div>

          <h1 className="mt-4 text-2xl font-bold tracking-tight text-white sm:text-3xl font-display">
            STAFF RFID VERIFICATION
          </h1>
          <p className="mt-2 text-sm text-slate-400">
            Verify staff access using an RFID card.
          </p>
        </div>

        {/* Access Control Reader Terminal Card */}
        <div className="overflow-hidden rounded-3xl border border-slate-800 bg-slate-900/90 p-6 shadow-2xl backdrop-blur-xl sm:p-8">
          <form onSubmit={handleVerify} className="space-y-6">
            <div>
              <label
                htmlFor="rfid-input"
                className="block text-xs font-bold uppercase tracking-wider text-slate-400"
              >
                RFID Card ID
              </label>

              <div className="relative mt-2">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-500">
                  <FiCreditCard className="h-5 w-5" />
                </div>
                <input
                  ref={inputRef}
                  id="rfid-input"
                  name="rfid-input"
                  type="text"
                  autoComplete="off"
                  spellCheck="false"
                  value={rfidInput}
                  onChange={(e) => setRfidInput(e.target.value)}
                  placeholder="e.g. RFID-STF-001"
                  className="block w-full rounded-2xl border border-slate-700 bg-slate-950/80 py-3.5 pl-11 pr-4 text-sm font-medium tracking-wide text-white placeholder-slate-500 transition-all duration-150 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </div>
            </div>

            {/* Quick Demo Test Chips */}
            <div>
              <p className="text-[11px] font-medium text-slate-500">
                Quick Test Cards:
              </p>
              <div className="mt-1.5 flex flex-wrap gap-2">
                {demoSuggestions.map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => handleQuickFill(tag)}
                    className="rounded-lg border border-slate-800 bg-slate-950 px-2.5 py-1 text-xs font-mono text-slate-400 transition hover:border-slate-700 hover:text-white"
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>

            {/* Verification Button */}
            <button
              type="submit"
              disabled={isVerifying}
              className={classNames(
                "relative flex w-full items-center justify-center gap-2 rounded-2xl bg-blue-600 px-5 py-3.5 text-sm font-bold tracking-wide text-white shadow-lg shadow-blue-600/25 transition-all duration-150",
                isVerifying
                  ? "cursor-not-allowed opacity-75"
                  : "hover:bg-blue-500 active:scale-[0.99] focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 focus:ring-offset-slate-900"
              )}
            >
              {isVerifying ? (
                <>
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                  <span>VERIFYING...</span>
                </>
              ) : (
                <>
                  <span>VERIFY RFID</span>
                  <FiCornerDownLeft className="h-4 w-4 opacity-70" />
                </>
              )}
            </button>
          </form>

          {/* Reader Status Indicator */}
          <div className="mt-6 flex items-center justify-center gap-2 border-t border-slate-800/80 pt-4 text-xs font-medium text-slate-400">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
            </span>
            <span className="tracking-wider uppercase text-slate-400">
              RFID READER READY
            </span>
          </div>
        </div>

        {/* Verification Result Feedback */}
        <AnimatePresence mode="wait">
          {verificationResult && (
            <motion.div
              key={verificationResult.type + (verificationResult.data?.rfidTag || verificationResult.message)}
              initial={{ opacity: 0, y: 12, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.98 }}
              transition={{ duration: 0.2 }}
            >
              {/* SUCCESS STATE */}
              {verificationResult.type === "success" && (
                <div className="rounded-2xl border border-emerald-500/30 bg-emerald-950/40 p-5 backdrop-blur-md">
                  <div className="flex items-center gap-3 text-emerald-400">
                    <FiCheckCircle className="h-5 w-5 shrink-0" />
                    <span className="text-sm font-bold tracking-wider uppercase">
                      ✓ {verificationResult.message}
                    </span>
                  </div>

                  <div className="mt-4 grid grid-cols-2 gap-3 border-t border-emerald-500/20 pt-3 text-xs">
                    <div>
                      <span className="text-slate-400">Staff:</span>
                      <p className="mt-0.5 font-semibold text-white">
                        {verificationResult.data?.name}
                      </p>
                    </div>
                    <div>
                      <span className="text-slate-400">RFID:</span>
                      <p className="mt-0.5 font-mono font-semibold text-white">
                        {verificationResult.data?.rfidTag}
                      </p>
                    </div>
                    <div>
                      <span className="text-slate-400">Access Type:</span>
                      <p className="mt-0.5 font-semibold text-emerald-300">
                        {verificationResult.data?.accessType}
                      </p>
                    </div>
                    <div>
                      <span className="text-slate-400">Gate:</span>
                      <p className="mt-0.5 font-semibold text-white">
                        {verificationResult.data?.gate}
                      </p>
                    </div>
                  </div>

                  <div className="mt-3 flex items-center justify-between border-t border-emerald-500/10 pt-2 text-[11px] text-slate-400">
                    <span className="flex items-center gap-1">
                      <FiClock className="h-3 w-3 text-slate-500" />
                      {verificationResult.data?.date} • {verificationResult.data?.time}
                    </span>
                    <span className="font-semibold text-emerald-400">
                      {verificationResult.data?.accessStatus}
                    </span>
                  </div>
                </div>
              )}

              {/* INVALID RFID STATE */}
              {verificationResult.type === "error" && (
                <div className="rounded-2xl border border-rose-500/30 bg-rose-950/40 p-4 backdrop-blur-md">
                  <div className="flex items-center gap-2.5 text-rose-400">
                    <FiAlertCircle className="h-5 w-5 shrink-0" />
                    <span className="text-sm font-bold tracking-wider uppercase">
                      ✕ {verificationResult.message}
                    </span>
                  </div>
                  <p className="mt-2 text-xs text-rose-300/80">
                    Card ID not registered in the system. Please check the ID or try one of the test cards above.
                  </p>
                </div>
              )}

              {/* EMPTY INPUT WARNING */}
              {verificationResult.type === "warning" && (
                <div className="rounded-2xl border border-amber-500/30 bg-amber-950/40 p-4 backdrop-blur-md">
                  <div className="flex items-center gap-2.5 text-amber-400">
                    <FiAlertCircle className="h-5 w-5 shrink-0" />
                    <span className="text-sm font-semibold">
                      {verificationResult.message}
                    </span>
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
