import React from 'react';
import { ENROLLMENT_POSES } from './constants';
import { FiCheckCircle, FiRefreshCw } from 'react-icons/fi';

export default function CapturePreview({ capturedPoses = {}, onRetakePose }) {
  const capturedKeys = Object.keys(capturedPoses);

  if (capturedKeys.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-200 p-6 text-center dark:border-slate-800">
        <p className="text-xs font-semibold text-slate-400">Captured facial pose thumbnails will appear here.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="text-xs font-bold text-[#0F172A] dark:text-white font-display">
          Captured Poses ({capturedKeys.length} / {ENROLLMENT_POSES.length})
        </h4>
      </div>

      <div className="grid grid-cols-4 gap-2.5 sm:grid-cols-7">
        {ENROLLMENT_POSES.map((pose) => {
          const frameData = capturedPoses[pose.id];
          return (
            <div
              key={pose.id}
              className={`relative group overflow-hidden rounded-xl border p-1 text-center transition-all ${
                frameData ? 'border-emerald-500/80 bg-emerald-50/50 dark:border-emerald-500/30 dark:bg-emerald-900/10' : 'border-slate-100 bg-slate-50 dark:border-slate-800 dark:bg-slate-800/40'
              }`}
            >
              {frameData ? (
                <>
                  <img src={frameData.imageBase64} alt={pose.label} className="h-14 w-full rounded-lg object-cover" />
                  <div className="mt-1 flex items-center justify-between px-0.5 text-[9px] font-bold text-emerald-700 dark:text-emerald-400">
                    <span className="truncate">{pose.label.split(' ')[0]}</span>
                    <FiCheckCircle className="h-3 w-3 shrink-0" />
                  </div>
                  {onRetakePose && (
                    <button
                      onClick={() => onRetakePose(pose.id)}
                      title="Retake Pose"
                      className="absolute inset-0 flex items-center justify-center bg-slate-950/60 opacity-0 group-hover:opacity-100 transition-opacity text-white text-xs font-bold"
                    >
                      <FiRefreshCw className="h-4 w-4" />
                    </button>
                  )}
                </>
              ) : (
                <div className="flex h-14 w-full items-center justify-center rounded-lg border border-dashed border-slate-200 dark:border-slate-700 text-slate-300">
                  <span className="text-xs">{pose.icon}</span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
