import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FiZap,
  FiX,
  FiCheckCircle,
  FiAlertCircle,
  FiClock,
  FiUser,
  FiHome,
  FiShield,
  FiLoader,
  FiRefreshCw,
  FiSmartphone,
  FiList,
} from 'react-icons/fi';
import { nfcService } from '../../services/nfcService';
import { isWebNfcSupported, startWebNfcScan } from '../../utils/nfcHelper';

export default function NfcGateVerifierModal({ isOpen, onClose, onVerificationSuccess }) {
  const [tokenInput, setTokenInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [errorText, setErrorText] = useState(null);
  const [isScanningNfc, setIsScanningNfc] = useState(false);
  const [scanStatusMsg, setScanStatusMsg] = useState('');
  const abortControllerRef = useRef(null);

  useEffect(() => {
    if (!isOpen) {
      stopNfcListening();
      setResult(null);
      setErrorText(null);
      setTokenInput('');
    }
  }, [isOpen]);

  const handleVerify = async (tokenOrId) => {
    const clean = (tokenOrId || tokenInput).trim();
    if (!clean) return;

    try {
      setLoading(true);
      setErrorText(null);

      const isNfcId = clean.toUpperCase().startsWith('NFC-VST-');
      const payload = isNfcId ? { nfcId: clean.toUpperCase() } : { token: clean };

      const res = await nfcService.verifyNfcTap(payload);

      if (res.status === 'SUCCESS') {
        setResult(res);
        if (onVerificationSuccess) {
          onVerificationSuccess(res.passDetails);
        }
      } else {
        setErrorText(res.message || 'Verification rejected.');
      }
    } catch (err) {
      setErrorText(err.message || 'Verification failed. Token not found or invalid.');
    } finally {
      setLoading(false);
    }
  };

  const startNfcListening = async () => {
    if (!isWebNfcSupported()) {
      setErrorText('Web NFC API is not supported in this browser. Please enter NFC ID manually or use Android Chrome.');
      return;
    }

    try {
      setErrorText(null);
      setIsScanningNfc(true);
      abortControllerRef.current = new AbortController();

      await startWebNfcScan({
        signal: abortControllerRef.current.signal,
        onStatusChange: (code, msg) => setScanStatusMsg(msg),
        onReading: ({ extractedData }) => {
          stopNfcListening();
          if (extractedData?.value) {
            setTokenInput(extractedData.value);
            handleVerify(extractedData.value);
          }
        },
        onError: (err) => {
          setErrorText(err.message || 'Sensor read error.');
          stopNfcListening();
        },
      });
    } catch (err) {
      setErrorText(err.message || 'Failed to start NFC listener.');
      stopNfcListening();
    }
  };

  const stopNfcListening = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setIsScanningNfc(false);
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="relative w-full max-w-xl overflow-hidden rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900"
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-100 pb-4 dark:border-slate-800">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white shadow-md shadow-emerald-500/30">
                <FiShield className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                  Orphanage NFC Gate Verifier
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Instant contactless tap verification & visitor check-in
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="rounded-xl p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-white transition"
            >
              <FiX className="h-5 w-5" />
            </button>
          </div>

          {/* Verification Form & Sensor Trigger */}
          <div className="my-5 space-y-4">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleVerify();
              }}
              className="flex gap-2"
            >
              <div className="relative flex-1">
                <input
                  type="text"
                  value={tokenInput}
                  onChange={(e) => setTokenInput(e.target.value)}
                  placeholder="Scan tag or enter NFC ID (e.g. NFC-VST-43C0AB)..."
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-xs font-semibold text-slate-800 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="rounded-xl bg-emerald-600 px-5 py-2.5 text-xs font-extrabold text-white shadow-md shadow-emerald-600/30 transition hover:bg-emerald-500 disabled:opacity-50"
              >
                {loading ? <FiLoader className="h-4 w-4 animate-spin" /> : 'Verify Tap'}
              </button>
            </form>

            {/* Web NFC Sensor Button */}
            {isWebNfcSupported() && (
              <div className="flex items-center justify-between rounded-xl bg-slate-50 p-3 border border-slate-100 dark:border-slate-800 dark:bg-slate-800/40">
                <div className="flex items-center gap-2">
                  <FiSmartphone className="h-4 w-4 text-emerald-600" />
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    {isScanningNfc ? scanStatusMsg || 'Listening for NFC tag...' : 'Hardware NFC Sensor Available'}
                  </span>
                </div>
                {!isScanningNfc ? (
                  <button
                    onClick={startNfcListening}
                    className="rounded-lg bg-emerald-100 text-emerald-700 px-3 py-1 text-[11px] font-extrabold hover:bg-emerald-200 dark:bg-emerald-500/20 dark:text-emerald-300 transition"
                  >
                    Listen for Tap
                  </button>
                ) : (
                  <button
                    onClick={stopNfcListening}
                    className="rounded-lg bg-slate-200 text-slate-700 px-3 py-1 text-[11px] font-bold dark:bg-slate-700 dark:text-slate-300"
                  >
                    Stop
                  </button>
                )}
              </div>
            )}
          </div>

          {errorText && (
            <div className="mb-4 flex items-center gap-2 rounded-xl bg-rose-50 p-3 text-xs font-bold text-rose-600 dark:bg-rose-950/40 dark:text-rose-400">
              <FiAlertCircle className="h-4 w-4 shrink-0" />
              <span>{errorText}</span>
            </div>
          )}

          {/* Verification Result Display */}
          {result?.passDetails && (
            <div className="space-y-4 rounded-2xl border border-emerald-200 bg-emerald-50/50 p-4 dark:border-emerald-500/30 dark:bg-emerald-950/20">
              <div className="flex items-center justify-between border-b border-emerald-200/60 pb-3 dark:border-emerald-800/50">
                <div className="flex items-center gap-2">
                  <FiCheckCircle className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                  <div>
                    <h4 className="text-sm font-extrabold text-emerald-950 dark:text-emerald-200">
                      Visit Verified & Checked In!
                    </h4>
                    <p className="text-[11px] text-emerald-700/80 dark:text-emerald-300/80">
                      Total Scans: {result.passDetails.scanCount} · Tracking #{result.passDetails.requestId}
                    </p>
                  </div>
                </div>
                <span className="font-mono text-xs font-black text-emerald-800 dark:text-emerald-200 bg-emerald-100 dark:bg-emerald-500/20 px-2.5 py-1 rounded-lg border border-emerald-300 dark:border-emerald-500/40">
                  {result.passDetails.nfcId}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">Parent Visitor</p>
                  <p className="font-extrabold text-slate-900 dark:text-white mt-0.5">
                    {result.passDetails.parent?.name}
                  </p>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400">
                    {result.passDetails.parent?.address || result.passDetails.parent?.phone || 'Verified on Record'}
                  </p>
                </div>

                <div>
                  <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">Meeting Room / Staff</p>
                  <p className="font-bold text-slate-800 dark:text-slate-200 mt-0.5">
                    {result.passDetails.meetingRoom || 'General Visit Area'}
                  </p>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400">
                    Staff: {result.passDetails.assignedStaff || 'Care Supervisor'}
                  </p>
                </div>
              </div>

              {/* Scan History Log List */}
              {Array.isArray(result.passDetails.scans) && result.passDetails.scans.length > 0 && (
                <div className="mt-3 border-t border-emerald-200/50 pt-3 dark:border-emerald-800/40">
                  <p className="text-[11px] font-extrabold text-slate-700 dark:text-slate-300 flex items-center gap-1.5 mb-2">
                    <FiClock className="h-3 w-3 text-emerald-600" /> Recent Scan History
                  </p>
                  <div className="space-y-1.5 max-h-28 overflow-y-auto pr-1">
                    {result.passDetails.scans.map((scan, idx) => (
                      <div
                        key={scan.id || idx}
                        className="flex items-center justify-between text-[11px] rounded-lg bg-white/70 px-2.5 py-1 dark:bg-slate-800/60"
                      >
                        <span className="text-slate-600 dark:text-slate-300 font-medium">
                          {new Date(scan.scannedAt).toLocaleDateString()} {new Date(scan.scannedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                        <span className="font-bold text-emerald-600 dark:text-emerald-400">✓ {scan.result}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="mt-4 flex justify-end">
            <button
              onClick={onClose}
              className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 transition"
            >
              Close
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
