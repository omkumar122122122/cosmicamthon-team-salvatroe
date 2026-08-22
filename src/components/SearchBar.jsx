import { FiSearch, FiX } from "react-icons/fi";

export default function SearchBar({ value, onChange, placeholder = "Search records…", className = "" }) {
  return (
    <label className={`flex min-h-[38px] cursor-text items-center gap-2.5 rounded-xl border border-slate-200 bg-white px-3.5 transition-all duration-150 focus-within:border-civic-500 focus-within:ring-2 focus-within:ring-civic-500/15 dark:border-slate-700 dark:bg-slate-800 ${className}`}>
      <FiSearch className="h-4 w-4 shrink-0 text-slate-400 transition-colors focus-within:text-civic-500" />
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full border-0 bg-transparent text-sm text-slate-900 outline-none placeholder:text-slate-400 dark:text-white dark:placeholder:text-slate-500"
        aria-label={placeholder}
      />
      {value && (
        <button
          onClick={() => onChange("")}
          className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-400 transition hover:bg-slate-200 hover:text-slate-600 dark:bg-slate-700 dark:hover:bg-slate-600"
          aria-label="Clear search"
        >
          <FiX className="h-3 w-3" />
        </button>
      )}
    </label>
  );
}
