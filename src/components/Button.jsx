import { classNames } from "../utils/formatters";

const variants = {
  primary: [
    "bg-gradient-to-b from-civic-500 to-civic-600 text-white",
    "hover:from-civic-500 hover:to-civic-700 active:from-civic-700 active:to-civic-800",
    "shadow-btn-primary active:shadow-none",
    "active:scale-[0.98]",
    "border border-civic-700/20",
  ].join(" "),

  secondary: [
    "bg-white border border-slate-200 text-slate-700",
    "hover:bg-slate-50 hover:border-slate-300 hover:text-slate-900",
    "shadow-sm active:scale-[0.98]",
    "dark:bg-slate-800 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-700 dark:hover:border-slate-600",
  ].join(" "),

  success: [
    "bg-gradient-to-b from-emerald-500 to-emerald-600 text-white",
    "hover:from-emerald-500 hover:to-emerald-700 active:from-emerald-700 active:to-emerald-800",
    "shadow-btn-success active:shadow-none",
    "active:scale-[0.98]",
  ].join(" "),

  danger: [
    "bg-gradient-to-b from-red-500 to-red-600 text-white",
    "hover:from-red-500 hover:to-red-700 active:from-red-700 active:to-red-800",
    "shadow-btn-danger active:shadow-none",
    "active:scale-[0.98]",
  ].join(" "),

  ai: [
    "bg-gradient-to-r from-violet-600 to-indigo-600 text-white",
    "hover:from-violet-700 hover:to-indigo-700",
    "shadow-btn-ai active:shadow-none",
    "active:scale-[0.98]",
  ].join(" "),

  outline: [
    "border border-civic-300 bg-transparent text-civic-700",
    "hover:bg-civic-50 hover:border-civic-400 hover:text-civic-800",
    "active:scale-[0.98]",
    "dark:border-civic-600 dark:text-civic-400 dark:hover:bg-civic-500/10",
  ].join(" "),

  ghost: [
    "bg-transparent text-slate-600",
    "hover:bg-slate-100 hover:text-slate-900",
    "active:scale-[0.98]",
    "dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white",
  ].join(" "),
};

const sizes = {
  xs: "min-h-[28px] px-2.5 py-1 text-xs rounded-lg gap-1.5",
  sm: "min-h-[32px] px-3 py-1.5 text-xs rounded-xl gap-1.5",
  md: "min-h-[38px] px-4 py-2 text-sm rounded-xl gap-2",
  lg: "min-h-[48px] px-5 py-2.5 text-[15px] rounded-xl gap-2",
  xl: "min-h-[52px] px-6 py-3 text-base rounded-2xl gap-2.5",
};

const iconSizes = {
  xs: "h-3 w-3",
  sm: "h-3.5 w-3.5",
  md: "h-4 w-4",
  lg: "h-[18px] w-[18px]",
  xl: "h-5 w-5",
};

export default function Button({
  children,
  variant = "primary",
  size = "md",
  className = "",
  icon: Icon,
  iconRight: IconRight,
  loading = false,
  fullWidth = false,
  ...props
}) {
  const sizeClasses = sizes[size] ?? sizes.md;
  const iconClass   = iconSizes[size] ?? iconSizes.md;

  return (
    <button
      className={classNames(
        "inline-flex items-center justify-center font-semibold transition-all duration-150 font-display",
        "focus:outline-none focus-visible:ring-2 focus-visible:ring-civic-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-900",
        "disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none disabled:active:scale-100",
        variants[variant] ?? variants.primary,
        sizeClasses,
        fullWidth ? "w-full" : "",
        className
      )}
      disabled={loading || props.disabled}
      {...props}
    >
      {loading ? (
        <span className={classNames("animate-spin rounded-full border-2 border-current border-t-transparent opacity-80", iconClass)} />
      ) : (
        Icon && <Icon className={classNames(iconClass, "shrink-0")} />
      )}
      {children}
      {!loading && IconRight && <IconRight className={classNames(iconClass, "shrink-0 ml-auto")} />}
    </button>
  );
}
