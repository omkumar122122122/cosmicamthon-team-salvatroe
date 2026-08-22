import React from 'react';

export default function PoseGuide({ currentPose, currentStepIndex, totalSteps }) {
  if (!currentPose) return null;

  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-card dark:border-slate-800 dark:bg-slate-900 text-center">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-2xl dark:bg-blue-500/10">
        {currentPose.icon}
      </div>

      <span className="mt-3 inline-block rounded-full bg-blue-50 px-3 py-0.5 text-xs font-bold text-[#2563EB] dark:bg-blue-500/10 dark:text-blue-400">
        Step {currentStepIndex + 1} of {totalSteps}
      </span>

      <h3 className="mt-2 text-lg font-extrabold text-[#0F172A] dark:text-white font-display">
        {currentPose.label}
      </h3>

      <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 font-sans">
        {currentPose.instruction}
      </p>
    </div>
  );
}
