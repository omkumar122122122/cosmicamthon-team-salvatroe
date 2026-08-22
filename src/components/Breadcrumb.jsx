import { FiHome, FiChevronRight } from "react-icons/fi";
import { Link } from "react-router-dom";

export default function Breadcrumb({ items = [] }) {
  return (
    <nav
      className="flex flex-wrap items-center gap-1.5 text-xs text-slate-400 dark:text-slate-500"
      aria-label="Breadcrumb"
    >
      <FiHome className="h-3.5 w-3.5 shrink-0 text-slate-400 dark:text-slate-500" />
      {items.map((item, i) => {
        const isLast = i === items.length - 1;
        const label = typeof item === "object" ? item?.label || item?.title || item?.name || "" : String(item);
        const path = typeof item === "object" ? item?.path : null;

        return (
          <span key={`crumb-${i}`} className="flex items-center gap-1.5">
            <FiChevronRight className="h-3 w-3 shrink-0 text-slate-300 dark:text-slate-600" />
            {path && !isLast ? (
              <Link
                to={path}
                className="text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
              >
                {label}
              </Link>
            ) : (
              <span
                className={
                  isLast
                    ? "font-semibold text-slate-700 dark:text-slate-200 font-display"
                    : "text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 transition-colors cursor-default"
                }
              >
                {label}
              </span>
            )}
          </span>
        );
      })}
    </nav>
  );
}
