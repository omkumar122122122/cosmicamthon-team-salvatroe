import { motion, AnimatePresence } from "framer-motion";
import { FiX } from "react-icons/fi";
import { classNames } from "../utils/formatters";

export default function Modal({ 
  isOpen, 
  onClose, 
  title, 
  children, 
  size = "md",
  showCloseButton = true 
}) {
  const sizeClasses = {
    sm: "max-w-md",
    md: "max-w-lg",
    lg: "max-w-2xl",
    xl: "max-w-3xl",
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 z-40 bg-black/25 backdrop-blur-sm dark:bg-black/50"
            onClick={onClose}
          />

          {/* Modal */}
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, y: -16, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.96 }}
              transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
              className={classNames(
                "w-full overflow-hidden rounded-2xl bg-white shadow-modal dark:bg-slate-900",
                "border border-slate-200/80 dark:border-slate-700/80",
                sizeClasses[size] ?? sizeClasses.md
              )}
            >
              {/* Modal header with border separator */}
              <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/50 px-6 py-4 dark:border-slate-800 dark:bg-slate-800/30">
                <h3 className="text-[15px] font-bold text-slate-900 dark:text-white font-display tracking-tight">
                  {title}
                </h3>
                {showCloseButton && (
                  <button
                    onClick={onClose}
                    className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-200 hover:text-slate-600 dark:hover:bg-slate-700 dark:hover:text-slate-200"
                    aria-label="Close modal"
                  >
                    <FiX className="h-4 w-4" />
                  </button>
                )}
              </div>
              <div className="p-6">{children}</div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}

export function ModalFooter({ children, className = "" }) {
  return (
    <div className={classNames(
      "mt-6 flex items-center justify-end gap-3 border-t border-slate-100 pt-4 dark:border-slate-800",
      className
    )}>
      {children}
    </div>
  );
}