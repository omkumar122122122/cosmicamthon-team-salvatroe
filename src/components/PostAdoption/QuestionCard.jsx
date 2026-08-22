import { motion, AnimatePresence } from "framer-motion";
import { FiArrowLeft, FiArrowRight, FiCheckCircle, FiHelpCircle, FiSmile, FiMeh, FiFrown } from "react-icons/fi";
import Button from "../Button";

export default function QuestionCard({
  question,
  questionIndex,
  totalQuestions,
  currentAnswer,
  onAnswerChange,
  onPrev,
  onNext,
  isLastQuestion,
}) {
  if (!question) return null;

  const quickOptions = [
    { label: "Very Positive / Excellent", value: "Very Positive", sentiment: "POSITIVE", icon: FiSmile, color: "hover:border-emerald-500 hover:bg-emerald-50/50" },
    { label: "Good / Normal", value: "Good / Normal", sentiment: "POSITIVE", icon: FiSmile, color: "hover:border-blue-500 hover:bg-blue-50/50" },
    { label: "Neutral / Moderate", value: "Neutral", sentiment: "NEUTRAL", icon: FiMeh, color: "hover:border-amber-500 hover:bg-amber-50/50" },
    { label: "Needs Support / Concerns Observed", value: "Needs Support", sentiment: "NEGATIVE", icon: FiFrown, color: "hover:border-red-500 hover:bg-red-50/50" },
  ];

  return (
    <div className="w-full max-w-xl space-y-6">
      {/* Category & Age Bracket Badge */}
      <div className="flex items-center justify-between">
        <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-bold text-blue-700 dark:bg-blue-900/40 dark:text-blue-300">
          Category: {question.category?.replace('_', ' ') || 'Welfare'}
        </span>
        <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
          Target Age: {question.minAge} - {question.maxAge} Years
        </span>
      </div>

      {/* Main Question Display */}
      <AnimatePresence mode="wait">
        <motion.div
          key={question.id || questionIndex}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.25 }}
          className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 space-y-5"
        >
          <div className="flex gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-300">
              <FiHelpCircle className="h-5 w-5" />
            </div>
            <div>
              <span className="text-xs font-bold text-slate-400">Question {questionIndex + 1} of {totalQuestions}</span>
              <h4 className="text-lg font-black text-slate-900 dark:text-white mt-0.5">
                {question.question}
              </h4>
            </div>
          </div>

          {/* Quick Select Options */}
          <div className="space-y-2 pt-2">
            <p className="text-xs font-bold text-slate-500 dark:text-slate-400">Select Response or Type Details below:</p>
            <div className="grid gap-2 sm:grid-cols-2">
              {quickOptions.map((opt) => {
                const isSelected = currentAnswer?.answer === opt.value;
                const Icon = opt.icon;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => onAnswerChange({ answer: opt.value, sentiment: opt.sentiment })}
                    className={`flex items-center gap-2.5 rounded-xl border p-3 text-left text-xs font-bold transition-all duration-200 ${
                      isSelected
                        ? "border-blue-600 bg-blue-50 text-blue-800 ring-2 ring-blue-500/20 dark:border-blue-500 dark:bg-blue-950/40 dark:text-blue-200"
                        : `border-slate-200 bg-slate-50/50 text-slate-700 dark:border-slate-800 dark:bg-slate-800/40 dark:text-slate-300 ${opt.color}`
                    }`}
                  >
                    <Icon className={`h-4 w-4 ${isSelected ? "text-blue-600" : "text-slate-400"}`} />
                    <span>{opt.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Text Area for Additional Observations */}
          <div className="space-y-1.5 pt-1">
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
              Observations / Comments:
            </label>
            <textarea
              rows={3}
              value={currentAnswer?.answer || ""}
              onChange={(e) => onAnswerChange({ answer: e.target.value })}
              placeholder="Enter detailed observations regarding the child's response or behavior..."
              className="w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs font-medium text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-slate-800 dark:bg-slate-950 dark:text-white"
            />
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Navigation Buttons */}
      <div className="flex items-center justify-between pt-2">
        <Button
          variant="secondary"
          onClick={onPrev}
          disabled={questionIndex === 0}
          className="flex items-center gap-2 px-5"
        >
          <FiArrowLeft className="h-4 w-4" /> Previous
        </Button>

        <Button
          variant={isLastQuestion ? "success" : "primary"}
          onClick={onNext}
          disabled={!currentAnswer?.answer?.trim()}
          className={`flex items-center gap-2 px-6 ${isLastQuestion ? "bg-emerald-600 text-white" : ""}`}
        >
          {isLastQuestion ? (
            <>
              Finish Questions <FiCheckCircle className="h-4 w-4" />
            </>
          ) : (
            <>
              Next Question <FiArrowRight className="h-4 w-4" />
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
