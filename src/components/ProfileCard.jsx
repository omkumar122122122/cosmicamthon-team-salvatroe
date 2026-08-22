import { classNames } from "../utils/formatters";

const roleColors = {
  admin:     { bg: "bg-indigo-600",  badge: "bg-indigo-50 text-indigo-700 ring-1 ring-indigo-200 dark:bg-indigo-500/10 dark:text-indigo-400 dark:ring-indigo-500/20" },
  orphanage: { bg: "bg-civic-600",   badge: "bg-civic-50 text-civic-700 ring-1 ring-civic-200 dark:bg-civic-500/10 dark:text-civic-400 dark:ring-civic-500/20" },
  parent:    { bg: "bg-emerald-600", badge: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:ring-emerald-500/20" },
};

export default function ProfileCard({ user }) {
  const cfg = roleColors[user.role] ?? { bg: "bg-slate-600", badge: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300" };

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-card dark:border-slate-800 dark:bg-slate-900">
      {/* Cover strip */}
      <div className={classNames("h-2 w-full", cfg.bg)} />
      <div className="flex items-center gap-4 px-5 py-4">
        <div className={classNames("flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-sm font-bold text-white shadow-sm", cfg.bg)}>
          {user.avatar}
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="truncate text-[15px] font-bold text-slate-900 dark:text-white">{user.name}</h3>
          <p className="mt-0.5 truncate text-xs text-slate-500 dark:text-slate-400">{user.department}</p>
          <span className={classNames("mt-1.5 inline-block rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider", cfg.badge)}>
            {user.role}
          </span>
        </div>
      </div>
    </div>
  );
}
