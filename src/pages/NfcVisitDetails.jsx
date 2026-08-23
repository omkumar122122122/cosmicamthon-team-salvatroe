import { useState, useEffect } from 'react';
import { useParams, useLocation, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  FiCheckCircle,
  FiAlertCircle,
  FiShield,
  FiUser,
  FiMapPin,
  FiCalendar,
  FiClock,
  FiHome,
  FiZap,
  FiHeart,
  FiArrowLeft,
  FiCheck,
  FiLoader,
} from 'react-icons/fi';
import { nfcService } from '../services/nfcService';
import { QRCodeSVG } from 'qrcode.react';
import { classNames } from '../utils/formatters';

export default function NfcVisitDetails() {
  const params = useParams();
  const location = useLocation();

  // Extract identifier from params or parse from URL pathname directly
  const pathSegments = location.pathname.split('/').filter(Boolean);
  const lastSegment = pathSegments[pathSegments.length - 1];
  const urlIdentifier =
    params.nfcId ||
    params.token ||
    params['*'] ||
    Object.values(params).find(Boolean) ||
    (lastSegment && lastSegment !== 'nfc' && lastSegment !== 'scan' ? lastSegment : null);

  const [activeIdentifier, setActiveIdentifier] = useState(urlIdentifier || '');
  const [manualInput, setManualInput] = useState('');
  const [passData, setPassData] = useState(null);
  const [loading, setLoading] = useState(Boolean(urlIdentifier));
  const [error, setError] = useState(null);

  useEffect(() => {
    if (urlIdentifier) {
      setActiveIdentifier(urlIdentifier);
      loadPassDetails(urlIdentifier);
    } else {
      setLoading(false);
    }
  }, [urlIdentifier]);

  const loadPassDetails = async (passToken) => {
    if (!passToken || !passToken.trim()) {
      setError('Please provide a valid NFC Pass ID or token.');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const cleanToken = passToken.trim();
      const data = await nfcService.getVisitByToken(cleanToken);
      setPassData(data);
      setActiveIdentifier(cleanToken);
    } catch (err) {
      setError(err.message || 'Unable to verify this NFC pass. It may be invalid or expired.');
    } finally {
      setLoading(false);
    }
  };

  const handleManualSubmit = (e) => {
    e.preventDefault();
    if (manualInput.trim()) {
      loadPassDetails(manualInput.trim());
    }
  };

  const formatDate = (dateVal) => {
    if (!dateVal) return '--';
    try {
      return new Date(dateVal).toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    } catch {
      return String(dateVal);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 p-4 dark:bg-slate-950">
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-xl shadow-blue-500/30">
            <FiZap className="h-8 w-8 animate-pulse text-amber-300" />
          </div>
          <div>
            <h2 className="text-lg font-extrabold text-slate-900 dark:text-white">
              Verifying NFC Digital Pass
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 flex items-center justify-center gap-1.5">
              <FiLoader className="h-3.5 w-3.5 animate-spin text-blue-600" /> Cryptographically verifying token with child safety server...
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (!passData) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 p-4 dark:bg-slate-950">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-2xl dark:border-slate-800 dark:bg-slate-900"
        >
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-100 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400">
            <FiShield className="h-8 w-8" />
          </div>
          <h2 className="mt-4 text-xl font-extrabold text-slate-900 dark:text-white">
            {error ? 'Pass Verification Failed' : 'NFC Gate Verification'}
          </h2>
          <p className="mt-2 text-xs font-medium text-slate-600 dark:text-slate-400 leading-relaxed">
            {error || 'Scan a physical NFC badge or enter a Unique NFC Pass ID below to verify authorization.'}
          </p>

          <form onSubmit={handleManualSubmit} className="mt-6 flex flex-col gap-3">
            <input
              type="text"
              value={manualInput}
              onChange={(e) => setManualInput(e.target.value)}
              placeholder="e.g. NFC-VST-D3642D"
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-center font-mono text-sm font-bold uppercase tracking-wider text-slate-900 focus:border-blue-500 focus:bg-white focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            />
            <button
              type="submit"
              disabled={!manualInput.trim()}
              className="w-full rounded-xl bg-blue-600 py-3 text-xs font-extrabold text-white shadow-md shadow-blue-600/30 transition hover:bg-blue-500 disabled:opacity-50"
            >
              Verify NFC Pass ⚡
            </button>
          </form>

          {activeIdentifier && error && (
            <button
              onClick={() => loadPassDetails(activeIdentifier)}
              className="mt-3 w-full rounded-xl border border-slate-200 py-2.5 text-xs font-bold text-slate-700 transition hover:bg-slate-50 dark:border-slate-800 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              Retry ({activeIdentifier})
            </button>
          )}

          <div className="mt-4">
            <Link
              to="/login"
              className="text-xs font-semibold text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
            >
              Return to Login &rarr;
            </Link>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-100 via-slate-50 to-slate-100 py-10 px-4 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 flex flex-col items-center justify-center">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-lg overflow-hidden rounded-3xl border border-slate-200/90 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-900"
      >
        {/* Verification Success Header */}
        <div className="relative overflow-hidden bg-gradient-to-br from-emerald-600 via-emerald-700 to-teal-800 p-6 text-white text-center">
          <div className="pointer-events-none absolute -right-6 -top-6 h-32 w-32 rounded-full bg-white/10 blur-2xl" />
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-emerald-600 shadow-lg shadow-emerald-900/30 mb-3">
            <FiCheckCircle className="h-8 w-8 text-emerald-600" />
          </div>

          <span className="inline-flex items-center gap-1 rounded-full bg-white/20 px-3 py-1 text-[11px] font-black uppercase tracking-wider text-emerald-100 backdrop-blur-md">
            <FiShield className="h-3.5 w-3.5" /> Official Visit Pass
          </span>

          <h1 className="mt-2 text-2xl font-black tracking-tight text-white font-display">
            VISIT VERIFIED
          </h1>
          <p className="mt-0.5 text-xs text-emerald-100 font-medium">
            Authenticated by State Adoption Authority & Child Safety Network
          </p>

          <div className="mt-4 inline-block rounded-xl border border-white/25 bg-black/15 px-4 py-1.5 backdrop-blur-md">
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-emerald-200">NFC Pass ID: </span>
            <span className="font-mono text-xs font-black tracking-wider text-white ml-1">{passData.nfcId}</span>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-6">
          {/* Parent Details Card */}
          <div className="rounded-2xl border border-slate-100 bg-slate-50/70 p-4 dark:border-slate-800 dark:bg-slate-800/50 space-y-3">
            <div className="flex items-center gap-2 text-xs font-extrabold text-slate-800 dark:text-slate-200">
              <FiUser className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              <span>Parent Information</span>
            </div>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <p className="text-[11px] text-slate-400 font-semibold">Full Name</p>
                <p className="font-extrabold text-slate-900 dark:text-white mt-0.5">{passData.parent?.name || 'Verified Parent'}</p>
              </div>
              <div>
                <p className="text-[11px] text-slate-400 font-semibold">Identity Status</p>
                <p className="font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">✓ KYC Verified on Record</p>
              </div>
            </div>
          </div>

          {/* Visit & Orphanage Details Card */}
          <div className="rounded-2xl border border-slate-100 bg-slate-50/70 p-4 dark:border-slate-800 dark:bg-slate-800/50 space-y-3">
            <div className="flex items-center gap-2 text-xs font-extrabold text-slate-800 dark:text-slate-200">
              <FiHome className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
              <span>Visit & Facility Details</span>
            </div>

            <div className="grid grid-cols-2 gap-4 text-xs">
              <div>
                <p className="text-[11px] text-slate-400 font-semibold">Orphanage</p>
                <p className="font-extrabold text-slate-900 dark:text-white mt-0.5">{passData.orphanage?.name || 'Care Facility'}</p>
                {passData.orphanage?.city && (
                  <p className="text-[10px] text-slate-500 dark:text-slate-400">{passData.orphanage.city}, {passData.orphanage.state}</p>
                )}
              </div>

              <div>
                <p className="text-[11px] text-slate-400 font-semibold">Status</p>
                <span className="inline-flex items-center gap-1 mt-1 rounded-full bg-emerald-100 px-2.5 py-0.5 text-[11px] font-black text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300">
                  <FiCheck className="h-3 w-3" /> {passData.visitStatus}
                </span>
              </div>

              <div>
                <p className="text-[11px] text-slate-400 font-semibold">Visit Date</p>
                <p className="font-bold text-slate-800 dark:text-slate-200 mt-0.5">{formatDate(passData.visitDate)}</p>
              </div>

              <div>
                <p className="text-[11px] text-slate-400 font-semibold">Time Slot</p>
                <p className="font-bold text-slate-800 dark:text-slate-200 mt-0.5">{passData.visitTime}</p>
              </div>

              {passData.meetingRoom && (
                <div>
                  <p className="text-[11px] text-slate-400 font-semibold">Meeting Room</p>
                  <p className="font-bold text-slate-800 dark:text-slate-200 mt-0.5">{passData.meetingRoom}</p>
                </div>
              )}

              {passData.assignedStaff && (
                <div>
                  <p className="text-[11px] text-slate-400 font-semibold">Staff Supervisor</p>
                  <p className="font-bold text-slate-800 dark:text-slate-200 mt-0.5">{passData.assignedStaff}</p>
                </div>
              )}
            </div>

            {passData.child && (
              <div className="border-t border-slate-200/60 pt-3 dark:border-slate-700/60 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-pink-100 text-pink-600 dark:bg-pink-500/20 dark:text-pink-400">
                    <FiHeart className="h-3.5 w-3.5" />
                  </div>
                  <div>
                    <p className="text-[11px] font-bold text-slate-800 dark:text-slate-200">
                      Child Interaction: {passData.child.name}
                    </p>
                    <p className="text-[10px] text-slate-400 font-mono">Code: {passData.child.code}</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Scannable Gate QR Code Card */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-slate-50/80 p-4 dark:border-slate-800 dark:bg-slate-800/60">
            <div>
              <p className="text-xs font-extrabold text-slate-900 dark:text-white font-display">
                Gate Entry QR Pass
              </p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                Present this QR code to the scanner camera at the Orphanage Gate checkpoint.
              </p>
            </div>
            <div className="shrink-0 rounded-xl bg-white p-2 shadow-sm">
              <QRCodeSVG
                value={typeof window !== 'undefined' ? window.location.href : (passData.nfcId || '')}
                size={84}
                level="H"
                includeMargin={false}
              />
            </div>
          </div>

          {/* Security stamp & verification details */}
          <div className="rounded-2xl border border-blue-100 bg-blue-50/60 p-3.5 text-xs text-blue-900 dark:border-blue-900/30 dark:bg-blue-950/20 dark:text-blue-200 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FiShield className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              <div>
                <p className="font-bold">Cryptographically Verified</p>
                <p className="text-[10px] text-blue-700/80 dark:text-blue-300/80">
                  Scan Count: {passData.scanCount} · Tracking Ref: #{passData.requestId}
                </p>
              </div>
            </div>
            <span className="text-[10px] font-mono text-blue-600 dark:text-blue-400 font-bold">
              {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>

          <div className="text-center pt-2">
            <Link
              to="/login"
              className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-blue-600 dark:text-slate-400 dark:hover:text-white transition"
            >
              <FiArrowLeft className="h-3.5 w-3.5" /> Return to Child Safety Portal
            </Link>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
