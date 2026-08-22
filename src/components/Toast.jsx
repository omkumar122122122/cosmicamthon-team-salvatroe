import { motion, AnimatePresence } from 'framer-motion';
import { FiCheckCircle, FiAlertCircle, FiInfo, FiAlertTriangle, FiX } from 'react-icons/fi';
import { classNames } from '../utils/formatters';

const toastConfig = {
  success: {
    icon: FiCheckCircle,
    className: 'bg-emerald-50 border-emerald-200 text-emerald-800 dark:bg-emerald-500/10 dark:border-emerald-500/20 dark:text-emerald-300',
    iconClassName: 'text-emerald-600 dark:text-emerald-400',
  },
  error: {
    icon: FiAlertCircle,
    className: 'bg-red-50 border-red-200 text-red-800 dark:bg-red-500/10 dark:border-red-500/20 dark:text-red-300',
    iconClassName: 'text-red-600 dark:text-red-400',
  },
  warning: {
    icon: FiAlertTriangle,
    className: 'bg-amber-50 border-amber-200 text-amber-800 dark:bg-amber-500/10 dark:border-amber-500/20 dark:text-amber-300',
    iconClassName: 'text-amber-600 dark:text-amber-400',
  },
  info: {
    icon: FiInfo,
    className: 'bg-blue-50 border-blue-200 text-blue-800 dark:bg-blue-500/10 dark:border-blue-500/20 dark:text-blue-300',
    iconClassName: 'text-blue-600 dark:text-blue-400',
  },
};

export default function ToastContainer({ toasts, onRemove }) {
  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 pointer-events-none">
      <AnimatePresence>
        {toasts.map((toast) => (
          <Toast
            key={toast.id}
            message={toast.message}
            type={toast.type}
            onClose={() => onRemove(toast.id)}
          />
        ))}
      </AnimatePresence>
    </div>
  );
}

function Toast({ message, type = 'success', onClose }) {
  const config = toastConfig[type] || toastConfig.info;
  const Icon = config.icon;

  return (
    <motion.div
      initial={{ opacity: 0, x: 50, scale: 0.9 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 50, scale: 0.9 }}
      className={classNames(
        'flex items-center gap-3 rounded-xl border px-4 py-3 shadow-lg pointer-events-auto min-w-[320px] max-w-md',
        config.className
      )}
    >
      <Icon className={classNames('h-5 w-5 shrink-0', config.iconClassName)} />
      <p className="flex-1 text-sm font-medium">{message}</p>
      <button
        onClick={onClose}
        className="shrink-0 rounded-lg p-1 opacity-60 hover:opacity-100 transition"
      >
        <FiX className="h-4 w-4" />
      </button>
    </motion.div>
  );
}
