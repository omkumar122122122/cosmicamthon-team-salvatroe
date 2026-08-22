import { useState, useEffect } from "react";
import { FiBell, FiActivity, FiHeart, FiFileText, FiAlertTriangle } from "react-icons/fi";
import { motion } from "framer-motion";
import { classNames } from "../utils/formatters";
import notificationsService from "../services/notificationsService";

// Map backend notification types to frontend icons
const getTypeIcon = (type) => {
  const typeMap = {
    'ADOPTION_STATUS_CHANGED': FiActivity,
    'VISIT_REQUEST_UPDATE': FiActivity,
    'DOCUMENT_REVIEW_RESULT': FiFileText,
    'POLICE_VERIFICATION_UPDATE': FiActivity,
    'KYC_STATUS_CHANGED': FiActivity,
    'TRUST_SCORE_UPDATED': FiActivity,
    'WELFARE_SESSION_REMINDER': FiActivity,
    'HEALTH_CHECKUP_DUE': FiHeart,
    'VACCINATION_DUE': FiHeart,
    'ALERT_RAISED': FiAlertTriangle,
    'ACCOUNT_STATUS_CHANGED': FiActivity,
    'SYSTEM_ANNOUNCEMENT': FiFileText,
    'AI_SESSION_SCHEDULED': FiActivity,
    'DOCUMENT_EXPIRY_WARNING': FiAlertTriangle,
  };
  return typeMap[type] || FiBell;
};

// Map backend notification types to frontend tones
const getTypeTone = (type) => {
  const toneMap = {
    'ADOPTION_STATUS_CHANGED': { bg: "bg-civic-50 text-civic-600 dark:bg-civic-500/10 dark:text-civic-400", dot: "bg-civic-500" },
    'VISIT_REQUEST_UPDATE': { bg: "bg-civic-50 text-civic-600 dark:bg-civic-500/10 dark:text-civic-400", dot: "bg-civic-500" },
    'DOCUMENT_REVIEW_RESULT': { bg: "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400", dot: "bg-emerald-500" },
    'POLICE_VERIFICATION_UPDATE': { bg: "bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400", dot: "bg-amber-500" },
    'KYC_STATUS_CHANGED': { bg: "bg-civic-50 text-civic-600 dark:bg-civic-500/10 dark:text-civic-400", dot: "bg-civic-500" },
    'TRUST_SCORE_UPDATED': { bg: "bg-civic-50 text-civic-600 dark:bg-civic-500/10 dark:text-civic-400", dot: "bg-civic-500" },
    'WELFARE_SESSION_REMINDER': { bg: "bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400", dot: "bg-amber-500" },
    'HEALTH_CHECKUP_DUE': { bg: "bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400", dot: "bg-red-500" },
    'VACCINATION_DUE': { bg: "bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400", dot: "bg-red-500" },
    'ALERT_RAISED': { bg: "bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400", dot: "bg-amber-500" },
    'ACCOUNT_STATUS_CHANGED': { bg: "bg-civic-50 text-civic-600 dark:bg-civic-500/10 dark:text-civic-400", dot: "bg-civic-500" },
    'SYSTEM_ANNOUNCEMENT': { bg: "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400", dot: "bg-emerald-500" },
    'AI_SESSION_SCHEDULED': { bg: "bg-civic-50 text-civic-600 dark:bg-civic-500/10 dark:text-civic-400", dot: "bg-civic-500" },
    'DOCUMENT_EXPIRY_WARNING': { bg: "bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400", dot: "bg-amber-500" },
  };
  return toneMap[type] || { bg: "bg-civic-50 text-civic-600 dark:bg-civic-500/10 dark:text-civic-400", dot: "bg-civic-500" };
};

// Format time ago
const formatTimeAgo = (dateString) => {
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now - date) / 1000);
  
  if (diffInSeconds < 60) return `${diffInSeconds}s ago`;
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
  if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;
  return date.toLocaleDateString();
};

export default function NotificationPanel({ limit = 10 }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchNotifications();
  }, [limit]);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await notificationsService.getAll({ 
        limit, 
        sortBy: 'createdAt', 
        sortOrder: 'desc' 
      });
      const fetchedItems = response?.data || [];
      setItems(Array.isArray(fetchedItems) ? fetchedItems : []);
    } catch (err) {
      console.error('Failed to fetch notifications:', err);
      setError('Failed to load notifications');
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await notificationsService.markAllAsRead();
      // Refresh notifications
      fetchNotifications();
    } catch (err) {
      console.error('Failed to mark all as read:', err);
    }
  };

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-card dark:border-slate-800 dark:bg-slate-900">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4 dark:border-slate-800">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-civic-50 text-civic-600 dark:bg-civic-500/10 dark:text-civic-400">
            <FiBell className="h-3.5 w-3.5" />
          </div>
          <h2 className="text-sm font-bold text-slate-900 dark:text-white font-display">Notifications</h2>
          {items.length > 0 && (
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
              {items.filter(item => !item.isRead).length}
            </span>
          )}
        </div>
        <button 
          onClick={handleMarkAllRead}
          className="text-[11px] font-semibold text-civic-600 hover:underline dark:text-civic-400"
        >
          Mark all read
        </button>
      </div>

      {/* Items */}
      <div className="divide-y divide-slate-100 dark:divide-slate-800">
        {loading ? (
          <div className="py-10 text-center">
            <div className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-civic-600 border-t-transparent"></div>
            <p className="mt-2 text-sm text-slate-500 font-display">Loading notifications...</p>
          </div>
        ) : error ? (
          <div className="py-10 text-center">
            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
            <button 
              onClick={fetchNotifications}
              className="mt-2 text-xs font-semibold text-civic-600 hover:underline dark:text-civic-400"
            >
              Try again
            </button>
          </div>
        ) : items.length === 0 ? (
          <div className="empty-state py-10">
            <div className="empty-state-icon"><FiBell className="h-6 w-6 text-slate-400" /></div>
            <p className="empty-state-title">No notifications</p>
            <p className="empty-state-desc">You're all caught up.</p>
          </div>
        ) : (
          items.map((item, i) => {
            const Icon  = getTypeIcon(item.type);
            const tone  = getTypeTone(item.type);
            return (
              <motion.article
                key={item.id}
                initial={{ opacity: 0, x: -6 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.04 }}
                className={`flex items-start gap-3 px-6 py-4 transition-all duration-150 hover:bg-slate-50/80 dark:hover:bg-slate-800/40 ${item.isRead ? 'opacity-50' : ''}`}
              >
                <div className={classNames("relative mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg", tone.bg)}>
                  <Icon className="h-3.5 w-3.5" />
                  {!item.isRead && (
                    <span className={classNames("absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full ring-2 ring-white dark:ring-slate-900", tone.dot)} />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="text-[13px] font-semibold leading-tight text-slate-900 dark:text-white font-display">{item.title}</h3>
                    <span className="shrink-0 text-[10px] text-slate-400 dark:text-slate-500">{formatTimeAgo(item.createdAt)}</span>
                  </div>
                  <p className="mt-1 text-[12px] leading-relaxed text-slate-500 dark:text-slate-400">{item.body}</p>
                </div>
              </motion.article>
            );
          })
        )}
      </div>
    </div>
  );
}
