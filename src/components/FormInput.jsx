import { forwardRef } from "react";
import { FiAlertCircle, FiCheckCircle } from "react-icons/fi";
import { classNames } from "../utils/formatters";

function sanitizeInputValue(label, type, value) {
  if (type === "file")   return value;
  if (type === "number") return value.replace(/[^0-9]/g, "");
  if (type === "tel")    return value.replace(/[^0-9+\-\s]/g, "");
  if (/name/i.test(label)) return value.replace(/[^A-Za-z\s'.-]/g, "");
  return value;
}

const FormInput = forwardRef(function FormInput(
  { label, error, hint, success, icon: Icon, onChange, className = "", ...props },
  ref
) {
  const isFile   = props.type === "file";
  const isNumber = props.type === "number";
  const isTel    = props.type === "tel";
  const inputMode = props.inputMode || ((isNumber || isTel) ? "numeric" : undefined);
  const hasError  = Boolean(error);
  const hasSuccess = Boolean(success);

  const handleChange = (e) => {
    const next = sanitizeInputValue(label, props.type, e.target.value);
    if (next !== e.target.value) e.target.value = next;
    onChange?.(e);
  };

  return (
    <div className={classNames("flex flex-col gap-1.5", className)}>
      {label && (
        <label className="text-[13px] font-semibold text-slate-700 dark:text-slate-300 font-display">
          {label}
          {props.required && <span className="ml-1 text-red-500">*</span>}
        </label>
      )}

      <div
        className={classNames(
          "flex items-center rounded-xl border bg-white transition-all duration-150",
          "focus-within:ring-2",
          hasError
            ? "border-red-300 focus-within:border-red-400 focus-within:ring-red-500/15 dark:border-red-500/50"
            : hasSuccess
            ? "border-emerald-300 focus-within:border-emerald-400 focus-within:ring-emerald-500/15"
            : "border-slate-200 focus-within:border-civic-500 focus-within:ring-civic-500/15 dark:border-slate-700",
          isFile ? "py-1.5 px-3" : "px-3",
          "dark:bg-slate-800/80"
        )}
      >
        {Icon && (
          <Icon className={classNames(
            "mr-2.5 h-4 w-4 shrink-0 transition-colors",
            hasError ? "text-red-400" : hasSuccess ? "text-emerald-400" : "text-slate-400"
          )} />
        )}
        <input
          ref={ref}
          className={classNames(
            "w-full border-0 bg-transparent text-sm outline-none",
            "text-slate-900 placeholder:text-slate-400 dark:text-white dark:placeholder:text-slate-500",
            isFile
              ? "cursor-pointer file:mr-3 file:cursor-pointer file:rounded-lg file:border-0 file:bg-civic-50 file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-civic-700 hover:file:bg-civic-100 dark:file:bg-civic-900/30 dark:file:text-civic-300"
              : "min-h-[42px]"
          )}
          inputMode={inputMode}
          onChange={handleChange}
          {...props}
        />
        {hasSuccess && !hasError && (
          <FiCheckCircle className="ml-2 h-4 w-4 shrink-0 text-emerald-500" />
        )}
      </div>

      {/* Error message */}
      {hasError && (
        <p className="flex items-center gap-1.5 text-xs font-medium text-red-600 dark:text-red-400">
          <FiAlertCircle className="h-3.5 w-3.5 shrink-0" />
          {error}
        </p>
      )}

      {/* Hint / helper */}
      {hint && !hasError && (
        <p className="text-xs text-slate-400 dark:text-slate-500">{hint}</p>
      )}
    </div>
  );
});

export default FormInput;
