import { FiSun, FiMoon } from "react-icons/fi";
import { useTheme } from "../context/ThemeContext";

export default function ThemeToggle({ className = "" }) {
  const { isDark, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className={[
        "flex h-9 w-9 items-center justify-center rounded-xl border transition",
        /* Light mode: visible on white background */
        "border-slate-200 bg-white text-slate-600 hover:bg-slate-100 hover:text-slate-900 shadow-sm",
        /* Dark mode: visible on dark background */
        "dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 dark:hover:text-white",
        className,
      ].join(" ")}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
    >
      {isDark ? <FiSun className="h-4 w-4" /> : <FiMoon className="h-4 w-4" />}
    </button>
  );
}
