import { motion } from "framer-motion";
import { classNames } from "../utils/formatters";
import { FiActivity, FiTrendingUp, FiTrendingDown } from "react-icons/fi";

const fadeUp = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.22, ease: [0.16, 1, 0.3, 1] }
};

export default function Card({ children, className = "", hover = false, padding = true }) {
  return (
    <motion.section
      {...fadeUp}
      className={classNames(
        "rounded-2xl border border-slate-200/80 bg-white shadow-card dark:border-slate-800 dark:bg-slate-900",
        hover && "transition-all duration-200 hover:-translate-y-0.5 hover:shadow-card-hover",
        padding && "p-6",
        className
      )}
    >
      {children}
    </motion.section>
  );
}

/* ── Accent & Sparkline Colours ───────────────────────── */
const toneConfig = {
  blue: {
    icon:    "bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400",
    iconGlow:"shadow-blue-500/20",
    stroke:  "#2563EB",
    fillGrad:"from-blue-500/20 to-transparent",
    trend:   "text-blue-600 dark:text-blue-400",
    bar:     "bg-[#2563EB]",
  },
  green: {
    icon:    "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400",
    iconGlow:"shadow-emerald-500/20",
    stroke:  "#10B981",
    fillGrad:"from-emerald-500/20 to-transparent",
    trend:   "text-emerald-600 dark:text-emerald-400",
    bar:     "bg-[#10B981]",
  },
  amber: {
    icon:    "bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400",
    iconGlow:"shadow-amber-500/20",
    stroke:  "#F59E0B",
    fillGrad:"from-amber-500/20 to-transparent",
    trend:   "text-amber-600 dark:text-amber-400",
    bar:     "bg-[#F59E0B]",
  },
  red: {
    icon:    "bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400",
    iconGlow:"shadow-red-500/20",
    stroke:  "#EF4444",
    fillGrad:"from-red-500/20 to-transparent",
    trend:   "text-red-600 dark:text-red-400",
    bar:     "bg-[#EF4444]",
  },
  indigo: {
    icon:    "bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400",
    iconGlow:"shadow-indigo-500/20",
    stroke:  "#6366F1",
    fillGrad:"from-indigo-500/20 to-transparent",
    trend:   "text-indigo-600 dark:text-indigo-400",
    bar:     "bg-[#6366F1]",
  },
  purple: {
    icon:    "bg-purple-50 text-purple-600 dark:bg-purple-500/10 dark:text-purple-400",
    iconGlow:"shadow-purple-500/20",
    stroke:  "#8B5CF6",
    fillGrad:"from-purple-500/20 to-transparent",
    trend:   "text-purple-600 dark:text-purple-400",
    bar:     "bg-[#8B5CF6]",
  },
  ai: {
    icon:    "bg-violet-50 text-violet-600 dark:bg-violet-500/10 dark:text-violet-400",
    iconGlow:"shadow-violet-500/20",
    stroke:  "#8B5CF6",
    fillGrad:"from-violet-500/20 to-transparent",
    trend:   "text-violet-600 dark:text-violet-400",
    bar:     "bg-[#8B5CF6]",
  },
};

export function StatCard({ label, value, trend, icon: Icon, tone = "blue" }) {
  const cfg = toneConfig[tone] ?? toneConfig.blue;
  const isPositive = trend?.startsWith("+") || trend?.includes("this week") || trend?.includes("today");
  const isNegative = trend?.startsWith("-");
  const IconComponent = Icon && typeof Icon === 'function' ? Icon : FiActivity;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
      whileHover={{ y: -3, transition: { duration: 0.15 } }}
      className={classNames(
        "relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-5 shadow-card dark:border-slate-800 dark:bg-slate-900",
        "transition-all duration-200 hover:shadow-card-hover flex flex-col justify-between"
      )}
    >
      <div className="relative flex items-start justify-between gap-4">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700/60 shadow-2xs">
          <div className={classNames("flex h-9 w-9 items-center justify-center rounded-lg shadow-xs", cfg.icon)}>
            <IconComponent className="h-5 w-5" />
          </div>
        </div>
        <div className="text-right">
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400 font-display">
            {label}
          </p>
          <p className="stat-value mt-1 text-2xl font-bold tracking-tight text-slate-900 dark:text-white font-display">
            {value}
          </p>
        </div>
      </div>

      {/* Micro-sparkline Chart & Trend indicator */}
      <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-end justify-between gap-2">
        <div className="flex items-center gap-1 text-[11px] font-semibold">
          {isPositive ? (
            <span className="flex items-center gap-0.5 text-emerald-600 dark:text-emerald-400">
              <FiTrendingUp className="h-3 w-3" />
              {trend}
            </span>
          ) : isNegative ? (
            <span className="flex items-center gap-0.5 text-red-600 dark:text-red-400">
              <FiTrendingDown className="h-3 w-3" />
              {trend}
            </span>
          ) : (
            <span className="text-slate-500 dark:text-slate-400">{trend}</span>
          )}
        </div>

        {/* SVG Sparkline Curve */}
        <div className="h-7 w-24 opacity-85">
          <svg className="h-full w-full overflow-visible" viewBox="0 0 100 30" preserveAspectRatio="none">
            <defs>
              <linearGradient id={`grad-${tone}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={cfg.stroke} stopOpacity="0.35" />
                <stop offset="100%" stopColor={cfg.stroke} stopOpacity="0.0" />
              </linearGradient>
            </defs>
            <path
              d="M0 22 C20 28, 40 10, 60 18 C80 2, 90 14, 100 6 L100 30 L0 30 Z"
              fill={`url(#grad-${tone})`}
            />
            <path
              d="M0 22 C20 28, 40 10, 60 18 C80 2, 90 14, 100 6"
              fill="none"
              stroke={cfg.stroke}
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
        </div>
      </div>
    </motion.div>
  );
}
