import React from 'react';
import { ENROLLMENT_POSES } from './constants';
import { FiCheck } from 'react-icons/fi';

export default function ProgressIndicator({ currentStepIndex, capturedPoses = {} }) {
  return (
    <div className="flex items-center justify-between gap-1 overflow-x-auto py-2 pr-1">
      {ENROLLMENT_POSES.map((pose, idx) => {
        const isCaptured = Boolean(capturedPoses[pose.id]);
        const isCurrent = idx === currentStepIndex;

        return (
          <div key={pose.id} className="flex flex-col items-center gap-1 min-w-[54px]">
            <div
              className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold transition-all ${
                isCaptured
                  ? 'bg-emerald-500 text-white shadow-md'
                  : isCurrent
                  ? 'bg-[#2563EB] text-white ring-4 ring-blue-100 dark:ring-blue-900/40'
                  : 'bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-600'
              }`}
            >
              {isCaptured ? <FiCheck className="h-4 w-4 stroke-[3]" /> : idx + 1}
            </div>
            <span className={`text-[10px] font-semibold tracking-tight text-center ${isCurrent ? 'text-[#2563EB] dark:text-blue-400' : 'text-slate-400'}`}>
              {pose.label.split(' ')[0]}
            </span>
          </div>
        );
      })}
    </div>
  );
}
