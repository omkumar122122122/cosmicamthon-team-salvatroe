import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FiZap,
  FiCheckCircle,
  FiClock,
  FiMapPin,
  FiUser,
  FiShield,
  FiCopy,
  FiCheck,
  FiExternalLink,
  FiSmartphone,
} from 'react-icons/fi';
import { nfcService } from '../../services/nfcService';
import { buildNfcPublicScanUrl } from '../../utils/nfcHelper';
import { classNames } from '../../utils/formatters';

export default function NfcPassCard({ visitRequest, onOpenScanner }) {
  const [passData, setPassData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (visitRequest?.id && (visitRequest.status === 'APPROVED' || visitRequest.status === 'Approved')) {
      loadPass();
    }
  }, [visitRequest?.id, visitRequest?.status]);

  const loadPass = async () => {
    try {
      setLoading(true);
      const data = await nfcService.getPassByVisitRequestId(visitRequest.id);
      setPassData(data);
    } catch (err) {
      console.warn('Could not fetch NFC pass info:', err);
    } finally {
      setLoading(false);
    }
  };

  const copyUrl = (url) => {
    if (url) {
      navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (visitRequest?.status !== 'APPROVED' && visitRequest?.status !== 'Approved') {
    return null;
  }

  const nfcId = passData?.nfcId || `NFC-VST-${visitRequest.id?.slice(0, 6)?.toUpperCase()}`;
  const publicScanUrl = buildNfcPublicScanUrl(nfcId);
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(publicScanUrl)}`;

  return (
    <div className="relative overflow-hidden rounded-2xl border border-indigo-200/80 bg-gradient-to-br from-indigo-900/90 via-slate-900/95 to-slate-950 p-5 text-white shadow-xl backdrop-blur-md dark:border-indigo-500/30">
      {/* Decorative background glow */}
      <div className="pointer-events-none absolute -right-8 -top-8 h-40 w-40 rounded-full bg-blue-500/20 blur-3xl" />
      <div className="pointer-events-none absolute -left-8 -bottom-8 h-40 w-40 rounded-full bg-indigo-500/20 blur-3xl" />

      {/* Header */}
      <div className="relative z-10 flex items-start justify-between gap-3 border-b border-indigo-400/20 pb-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 text-white shadow-md shadow-indigo-500/30">
            <FiZap className="h-5 w-5 animate-pulse text-amber-300" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="text-sm font-extrabold text-white">NFC Digital Visit Pass</h4>
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/20 px-2 py-0.5 text-[10px] font-bold text-emerald-300 border border-emerald-500/30">
                <FiCheckCircle className="h-3 w-3" /> Active
              </span>
            </div>
            <p className="text-xs text-indigo-200/80">
              Tap at orphanage security gate or present QR code
            </p>
          </div>
        </div>

        {/* Human NFC ID Badge */}
        <div className="rounded-xl border border-indigo-400/30 bg-white/10 px-3 py-1.5 backdrop-blur-md text-right">
          <p className="text-[10px] font-bold uppercase tracking-wider text-indigo-300">NFC Pass ID</p>
          <p className="font-mono text-xs font-black tracking-wider text-white">{nfcId}</p>
        </div>
      </div>

      {/* Body details + QR Code badge */}
      <div className="relative z-10 mt-4 flex flex-col md:flex-row gap-4 items-center">
        <div className="flex-1 grid gap-3 sm:grid-cols-3 text-xs w-full">
          <div className="rounded-xl bg-white/5 p-3 border border-white/5">
            <p className="text-[11px] font-semibold text-indigo-200/70">Orphanage Center</p>
            <p className="mt-1 font-bold text-white truncate">
              {visitRequest.orphanageName || passData?.orphanage?.name || 'Care Home'}
            </p>
          </div>

          <div className="rounded-xl bg-white/5 p-3 border border-white/5">
            <p className="text-[11px] font-semibold text-indigo-200/70">Scheduled Slot</p>
            <p className="mt-1 font-bold text-white">
              {visitRequest.visitDate} · {visitRequest.arrivalTime || visitRequest.visitTime || '10:00 AM'}
            </p>
          </div>

          <div className="rounded-xl bg-white/5 p-3 border border-white/5">
            <p className="text-[11px] font-semibold text-indigo-200/70">Meeting Location</p>
            <p className="mt-1 font-bold text-white truncate">
              {passData?.meetingRoom || visitRequest.meetingRoom || 'Assigned Room'}
            </p>
          </div>
        </div>

        {/* QR Code thumbnail */}
        {qrUrl && (
          <a
            href={publicScanUrl}
            target="_blank"
            rel="noopener noreferrer"
            title="Click to open Cloudflare Public NFC Pass"
            className="shrink-0 flex flex-col items-center justify-center rounded-xl bg-white p-2 text-slate-900 shadow-md transition hover:scale-105"
          >
            <img src={qrUrl} alt="NFC QR Pass" className="h-16 w-16 object-contain" />
            <span className="text-[9px] font-black tracking-wider text-blue-600 mt-0.5">PUBLIC QR ↗</span>
          </a>
        )}
      </div>

      {/* Action buttons */}
      <div className="relative z-10 mt-5 flex flex-wrap items-center gap-2.5 pt-3 border-t border-white/10">
        <a
          href={publicScanUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-3.5 py-2 text-xs font-extrabold text-white shadow-md shadow-blue-600/30 transition hover:bg-blue-500 hover:scale-[1.02]"
        >
          <FiExternalLink className="h-3.5 w-3.5" />
          View Visit Details
        </a>

        <button
          onClick={() => onOpenScanner && onOpenScanner(visitRequest, passData || { nfcId })}
          className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600/30 border border-emerald-400/30 px-3.5 py-2 text-xs font-extrabold text-emerald-200 transition hover:bg-emerald-600/40 hover:text-white"
        >
          <FiSmartphone className="h-3.5 w-3.5 text-emerald-300" />
          Scan NFC
        </button>

        <button
          onClick={() => copyUrl(publicScanUrl)}
          className="ml-auto inline-flex items-center gap-1 text-[11px] font-bold text-indigo-300 hover:text-white transition px-2 py-1 rounded-lg hover:bg-white/5"
        >
          {copied ? <FiCheck className="h-3 w-3 text-emerald-400" /> : <FiCopy className="h-3 w-3" />}
          {copied ? 'Copied Public Link' : 'Copy Pass Link'}
        </button>
      </div>
    </div>
  );
}
