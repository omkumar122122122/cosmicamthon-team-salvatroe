import { useState, useEffect } from 'react';
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
  FiUsers,
} from 'react-icons/fi';
import { QRCodeSVG } from 'qrcode.react';
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
  const visitIdDisplay = visitRequest.requestId || `VIS-${visitRequest.id?.substring(0, 6)?.toUpperCase()}`;

  return (
    <div className="relative overflow-hidden rounded-2xl border border-indigo-200/80 bg-gradient-to-br from-indigo-950 via-slate-900 to-slate-950 p-5 text-white shadow-xl backdrop-blur-md dark:border-indigo-500/30">
      {/* Decorative background glow */}
      <div className="pointer-events-none absolute -right-8 -top-8 h-40 w-40 rounded-full bg-blue-500/20 blur-3xl" />
      <div className="pointer-events-none absolute -left-8 -bottom-8 h-40 w-40 rounded-full bg-indigo-500/20 blur-3xl" />

      {/* Header */}
      <div className="relative z-10 flex flex-wrap items-start justify-between gap-3 border-b border-indigo-400/20 pb-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 text-white shadow-md shadow-indigo-500/30">
            <FiZap className="h-5 w-5 animate-pulse text-amber-300" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="text-sm font-extrabold text-white">VISIT APPROVED</h4>
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/20 px-2 py-0.5 text-[10px] font-bold text-emerald-300 border border-emerald-500/30">
                <FiCheckCircle className="h-3 w-3" /> Active Pass
              </span>
            </div>
            <p className="text-xs text-indigo-200/80">
              Official QR & NFC Visit Credential
            </p>
          </div>
        </div>

        {/* IDs Badge */}
        <div className="flex items-center gap-2">
          <div className="rounded-xl border border-white/10 bg-white/5 px-2.5 py-1 text-right">
            <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400">Visit ID</p>
            <p className="font-mono text-xs font-bold text-slate-200">{visitIdDisplay}</p>
          </div>
          <div className="rounded-xl border border-indigo-400/30 bg-indigo-500/20 px-3 py-1 text-right">
            <p className="text-[9px] font-bold uppercase tracking-wider text-indigo-300">Pass ID</p>
            <p className="font-mono text-xs font-black tracking-wider text-white">{nfcId}</p>
          </div>
        </div>
      </div>

      {/* Body details + QR Code badge */}
      <div className="relative z-10 mt-4 flex flex-col md:flex-row gap-5 items-center justify-between">
        <div className="flex-1 grid gap-2.5 sm:grid-cols-2 text-xs w-full">
          <div className="rounded-xl bg-white/5 p-3 border border-white/5">
            <p className="text-[10px] font-semibold text-indigo-200/70 uppercase">Orphanage</p>
            <p className="mt-0.5 font-bold text-white truncate">
              {visitRequest.orphanageName || passData?.orphanage?.name || 'Care Home'}
            </p>
          </div>

          <div className="rounded-xl bg-white/5 p-3 border border-white/5">
            <p className="text-[10px] font-semibold text-indigo-200/70 uppercase">Scheduled Slot</p>
            <p className="mt-0.5 font-bold text-white">
              {visitRequest.visitDate} · {visitRequest.arrivalTime || visitRequest.visitTime || '10:00 AM'}
            </p>
          </div>

          <div className="rounded-xl bg-white/5 p-3 border border-white/5">
            <p className="text-[10px] font-semibold text-indigo-200/70 uppercase">Meeting Location</p>
            <p className="mt-0.5 font-bold text-white truncate">
              {passData?.meetingRoom || visitRequest.meetingRoom || 'Assigned Room'}
            </p>
          </div>

          <div className="rounded-xl bg-white/5 p-3 border border-white/5">
            <p className="text-[10px] font-semibold text-indigo-200/70 uppercase">Visitors</p>
            <p className="mt-0.5 font-bold text-white">
              {visitRequest.visitorsCount || 1} Person(s) Approved
            </p>
          </div>
        </div>

        {/* Crisp Pure SVG QR Code Box */}
        <div className="shrink-0 flex flex-col items-center justify-center rounded-2xl border border-indigo-400/30 bg-slate-900/90 p-3 shadow-lg">
          <div className="rounded-xl bg-white p-2.5 shadow-sm">
            <QRCodeSVG
              value={publicScanUrl}
              size={96}
              level="H"
              includeMargin={false}
            />
          </div>
          <span className="mt-2 text-[10px] font-extrabold tracking-wider uppercase text-indigo-300 text-center">
            📱 Gate Scan QR
          </span>
        </div>
      </div>

      {/* Gate Instruction Notice */}
      <div className="relative z-10 mt-4 rounded-xl bg-indigo-500/10 border border-indigo-400/20 px-3.5 py-2 text-center text-xs text-indigo-200">
        Please present this QR code or tap NFC pass at the orphanage gate for security verification.
      </div>

      {/* Action buttons */}
      <div className="relative z-10 mt-4 flex flex-wrap items-center gap-2.5 pt-3 border-t border-white/10">
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
