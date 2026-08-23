import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  FiZap,
  FiX,
  FiSmartphone,
  FiCheckCircle,
  FiAlertCircle,
  FiLoader,
  FiArrowRight,
  FiInfo,
} from 'react-icons/fi';
import { isWebNfcSupported, startWebNfcScan } from '../../utils/nfcHelper';

export default function NfcScannerModal({ isOpen, onClose, selectedPass }) {
  const navigate = useNavigate();
  const [hasNfcApi, setHasNfcApi] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [statusMessage, setStatusMessage] = useState('Ready to scan');
  const [statusCode, setStatusCode] = useState('IDLE');
  const [errorText, setErrorText] = useState(null);
  const [manualInput, setManualInput] = useState('');
  const abortControllerRef = useRef(null);

  useEffect(() => {
    setHasNfcApi(isWebNfcSupported());
  }, []);

  useEffect(() => {
    if (!isOpen) {
      stopScanning();
      setErrorText(null);
      setStatusCode('IDLE');
      setStatusMessage('Ready to scan');
    }
  }, [isOpen]);

  const startScan = async () => {
    setErrorText(null);
    setScanning(true);
    abortControllerRef.current = new AbortController();

    try {
      await startWebNfcScan({
        signal: abortControllerRef.current.signal,
        onStatusChange: (code, msg) => {
          setStatusCode(code);
          setStatusMessage(msg);
        },
        onReading: ({ extractedData }) => {
          setStatusCode('SUCCESS');
          setStatusMessage('NFC Tag Detected! Resolving pass...');

          const val = extractedData?.value || '';
          onClose();
          if (val.toUpperCase().startsWith('NFC-VST-')) {
            navigate(`/nfc/parent/${val.toUpperCase()}`);
          } else {
            navigate(`/nfc/visit/${val}`);
          }
        },
        onError: (err) => {
          setErrorText(err.message || 'Error reading NFC tag.');
          setStatusCode('ERROR');
        },
      });
    } catch (err) {
      setErrorText(err.message || 'Failed to initialize NFC sensor.');
      setScanning(false);
      setStatusCode('ERROR');
    }
  };

  const stopScanning = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setScanning(false);
  };

  const handleManualSubmit = (e) => {
    e.preventDefault();
    const clean = manualInput.trim();
    if (!clean) return;

    onClose();
    if (clean.toUpperCase().startsWith('NFC-VST-')) {
      navigate(`/nfc/parent/${clean.toUpperCase()}`);
    } else {
      navigate(`/nfc/visit/${clean}`);
    }
  };

  const handleSimulatePassTap = () => {
    const targetId = selectedPass?.nfcId || selectedPass?.secureToken;
    if (!targetId) return;

    onClose();
    if (targetId.startsWith('NFC-VST-')) {
      navigate(`/nfc/parent/${targetId}`);
    } else {
      navigate(`/nfc/visit/${targetId}`);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="relative w-full max-w-md overflow-hidden rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900"
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-100 pb-4 dark:border-slate-800">
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-100 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400">
                <FiZap className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                  NFC Visit Scanner
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Tap sensor or test pass credentials
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

          {/* Scanner Visual Radar */}
          <div className="my-6 flex flex-col items-center justify-center text-center">
            <div className="relative flex h-32 w-32 items-center justify-center">
              {/* Radar waves */}
              {scanning && (
                <>
                  <motion.div
                    animate={{ scale: [1, 2], opacity: [0.6, 0] }}
                    transition={{ duration: 1.8, repeat: Infinity, ease: 'easeOut' }}
                    className="absolute inset-0 rounded-full bg-blue-500/30"
                  />
                  <motion.div
                    animate={{ scale: [1, 1.6], opacity: [0.8, 0] }}
                    transition={{ duration: 1.8, repeat: Infinity, ease: 'easeOut', delay: 0.5 }}
                    className="absolute inset-0 rounded-full bg-indigo-500/20"
                  />
                </>
              )}
              <div className="relative z-10 flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white shadow-xl shadow-blue-500/30">
                <FiSmartphone className="h-10 w-10 animate-bounce" />
              </div>
            </div>

            <p className="mt-4 text-sm font-extrabold text-slate-900 dark:text-white">
              {statusMessage}
            </p>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 max-w-xs">
              {scanning
                ? 'Bring your NFC-enabled phone or tag close to the device back...'
                : 'Tap Start Scan to listen for nearby physical NFC cards or tags.'}
            </p>
          </div>

          {/* Web NFC Controls / Compatibility Note */}
          {hasNfcApi ? (
            <div className="space-y-3">
              {!scanning ? (
                <button
                  onClick={startScan}
                  className="w-full rounded-xl bg-blue-600 py-3 text-sm font-extrabold text-white shadow-lg shadow-blue-600/30 transition hover:bg-blue-500"
                >
                  Start NFC Sensor Scan
                </button>
              ) : (
                <button
                  onClick={stopScanning}
                  className="w-full rounded-xl bg-slate-200 py-3 text-sm font-extrabold text-slate-800 transition hover:bg-slate-300 dark:bg-slate-800 dark:text-white dark:hover:bg-slate-700"
                >
                  Stop Scanning
                </button>
              )}
            </div>
          ) : (
            <div className="rounded-2xl border border-amber-200 bg-amber-50/80 p-3.5 text-xs text-amber-800 dark:border-amber-500/30 dark:bg-amber-950/30 dark:text-amber-300 flex items-start gap-2.5">
              <FiInfo className="h-4 w-4 shrink-0 text-amber-600 mt-0.5" />
              <div>
                <p className="font-bold">Web NFC Sensor Info</p>
                <p className="mt-0.5 text-[11px] text-amber-700/90 dark:text-amber-300/90 leading-relaxed">
                  Native hardware NFC scanning is supported on Android Chrome. You can also test your pass below with 1-click emulation!
                </p>
              </div>
            </div>
          )}

          {errorText && (
            <div className="mt-3 flex items-center gap-2 rounded-xl bg-rose-50 p-3 text-xs font-bold text-rose-600 dark:bg-rose-950/40 dark:text-rose-400">
              <FiAlertCircle className="h-4 w-4 shrink-0" />
              <span>{errorText}</span>
            </div>
          )}

          {/* Selected Pass Quick-Test Action */}
          {selectedPass && (
            <div className="mt-4 border-t border-slate-100 pt-4 dark:border-slate-800">
              <button
                onClick={handleSimulatePassTap}
                className="w-full rounded-xl border border-indigo-200 bg-indigo-50/70 p-3 text-left transition hover:bg-indigo-100/70 dark:border-indigo-500/30 dark:bg-indigo-950/40 dark:hover:bg-indigo-900/40 flex items-center justify-between"
              >
                <div>
                  <p className="text-[11px] font-extrabold uppercase text-indigo-600 dark:text-indigo-400">
                    Quick Emulate Tap with Pass
                  </p>
                  <p className="font-mono text-xs font-bold text-slate-900 dark:text-white mt-0.5">
                    {selectedPass.nfcId || 'Active Pass'}
                  </p>
                </div>
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 text-white">
                  <FiArrowRight className="h-4 w-4" />
                </div>
              </button>
            </div>
          )}

          {/* Manual Token Lookup Input */}
          <form onSubmit={handleManualSubmit} className="mt-4 border-t border-slate-100 pt-4 dark:border-slate-800">
            <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-1.5">
              Or Lookup by Token / NFC ID
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={manualInput}
                onChange={(e) => setManualInput(e.target.value)}
                placeholder="e.g. NFC-VST-43C0AB or token"
                className="flex-1 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-800 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
              <button
                type="submit"
                className="rounded-xl bg-slate-900 px-4 py-2 text-xs font-extrabold text-white transition hover:bg-slate-800 dark:bg-blue-600 dark:hover:bg-blue-500"
              >
                Verify
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
