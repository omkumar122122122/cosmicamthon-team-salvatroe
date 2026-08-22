import { motion } from "framer-motion";
import { FiCheckCircle } from "react-icons/fi";

const WIZARD_STEPS = [
  { id: 1, title: "Overview" },
  { id: 2, title: "Cam Permission" },
  { id: 3, title: "Face Scan" },
  { id: 4, title: "Mic Permission" },
  { id: 5, title: "Voice Record" },
  { id: 6, title: "AI Questions" },
  { id: 7, title: "Uploading" },
  { id: 8, title: "Results" },
];

export default function ProgressBar({ currentStep = 1, totalSteps = 8, questionIndex = 0, totalQuestions = 0 }) {
  const percentage = Math.min(100, Math.max(0, Math.round(((currentStep - 1) / (totalSteps - 1)) * 100)));

  return (
    <div className="w-full space-y-4">
      {/* Wizard Steps Bar */}
      <div className="flex items-center justify-between text-xs font-semibold text-slate-500 dark:text-slate-400">
        <span>Step {currentStep} of {totalSteps}</span>
        <span className="font-extrabold text-blue-600 dark:text-blue-400">{percentage}% Completed</span>
      </div>

      {/* Progress Track */}
      <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
        <motion.div
          className="h-full bg-gradient-to-r from-blue-600 via-indigo-600 to-emerald-500 rounded-full"
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 0.4, ease: "easeOut" }}
        />
      </div>

      {/* Stepper Dots (Desktop) */}
      <div className="hidden sm:flex items-center justify-between pt-1">
        {WIZARD_STEPS.map((step) => {
          const isDone = currentStep > step.id;
          const isCurrent = currentStep === step.id;
          return (
            <div key={step.id} className="flex flex-col items-center gap-1.5">
              <div
                className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold transition-all duration-300 ${
                  isDone
                    ? "bg-emerald-500 text-white shadow-sm"
                    : isCurrent
                    ? "bg-blue-600 text-white ring-4 ring-blue-500/20 shadow-md"
                    : "bg-slate-200 text-slate-500 dark:bg-slate-800 dark:text-slate-400"
                }`}
              >
                {isDone ? <FiCheckCircle className="h-4 w-4" /> : step.id}
              </div>
              <span className={`text-[10px] font-semibold hidden md:inline ${isCurrent ? "text-blue-600 dark:text-blue-400 font-bold" : "text-slate-400"}`}>
                {step.title}
              </span>
            </div>
          );
        })}
      </div>

      {/* Optional Question-level Sub Progress Bar */}
      {currentStep === 6 && totalQuestions > 0 && (
        <div className="mt-3 rounded-xl border border-blue-100 bg-blue-50/60 p-3 dark:border-blue-900/30 dark:bg-blue-950/20">
          <div className="flex items-center justify-between text-xs font-bold text-blue-700 dark:text-blue-300 mb-1.5">
            <span>Question {questionIndex + 1} of {totalQuestions}</span>
            <span>{Math.round(((questionIndex + 1) / totalQuestions) * 100)}%</span>
          </div>
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-blue-200/60 dark:bg-blue-900/40">
            <motion.div
              className="h-full bg-blue-600 rounded-full"
              animate={{ width: `${((questionIndex + 1) / totalQuestions) * 100}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
