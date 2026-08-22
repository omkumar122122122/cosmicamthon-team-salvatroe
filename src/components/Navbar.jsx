import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FiMenu, FiBell, FiMoon, FiSun, FiChevronDown,
  FiLogOut, FiUser, FiSearch, FiX, FiCheck, FiMaximize,
  FiMail, FiPlus, FiUserPlus
} from "react-icons/fi";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { useTheme } from "../context/ThemeContext.jsx";
import notificationsService from "../services/notificationsService.js";

const roleColors = {
  admin:     "bg-indigo-600",
  orphanage: "bg-civic-600",
  parent:    "bg-emerald-600",
};

// Map backend notification types to frontend tones
const getNotificationTone = (type) => {
  const typeMap = {
    'ADOPTION_STATUS_CHANGED': 'green',
    'VISIT_REQUEST_UPDATE': 'green',
    'DOCUMENT_REVIEW_RESULT': 'green',
    'POLICE_VERIFICATION_UPDATE': 'amber',
    'KYC_STATUS_CHANGED': 'amber',
    'TRUST_SCORE_UPDATED': 'amber',
    'WELFARE_SESSION_REMINDER': 'amber',
    'HEALTH_CHECKUP_DUE': 'red',
    'VACCINATION_DUE': 'red',
    'ALERT_RAISED': 'red',
    'ACCOUNT_STATUS_CHANGED': 'amber',
    'SYSTEM_ANNOUNCEMENT': 'green',
    'AI_SESSION_SCHEDULED': 'green',
    'DOCUMENT_EXPIRY_WARNING': 'amber',
  };
  return typeMap[type] || 'amber';
};

const toneMap = {
  red:   "bg-red-100 text-red-600 dark:bg-red-500/15 dark:text-red-400",
  green: "bg-emerald-100 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-400",
  amber: "bg-amber-100 text-amber-600 dark:bg-amber-500/15 dark:text-amber-400",
};

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

function NotificationDropdown({ onClose }) {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const response = await notificationsService.getAll({ limit: 5, sortBy: 'createdAt', sortOrder: 'desc' });
      setNotifications(response?.data || []);
      setUnreadCount(response?.meta?.unreadCount || 0);
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsRead = async (id) => {
    try {
      await notificationsService.markAsRead(id);
      setNotifications(notifications.map(n => 
        n.id === id ? { ...n, isRead: true, readAt: new Date() } : n
      ));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Failed to mark as read:', error);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 6, scale: 0.97 }}
      transition={{ duration: 0.15 }}
      className="absolute right-0 top-full z-50 mt-2 w-80 rounded-2xl border border-slate-200/80 bg-white shadow-xl dark:border-slate-700 dark:bg-slate-900"
    >
      <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3 dark:border-slate-800">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-bold text-[#0F172A] dark:text-white font-display">Notifications</h3>
          {unreadCount > 0 && (
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#2563EB] text-[10px] font-bold text-white">
              {unreadCount}
            </span>
          )}
        </div>
        <button onClick={onClose} className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800">
          <FiX className="h-3.5 w-3.5" />
        </button>
      </div>
      <div className="divide-y divide-slate-100 dark:divide-slate-800">
        {loading ? (
          <div className="py-8 text-center text-sm text-slate-500 font-display">Loading notifications...</div>
        ) : notifications.length === 0 ? (
          <div className="py-8 text-center">
            <FiBell className="mx-auto h-8 w-8 text-slate-300 dark:text-slate-600" />
            <p className="mt-2 text-sm font-medium text-slate-600 dark:text-slate-400">No notifications</p>
            <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">You're all caught up</p>
          </div>
        ) : (
          notifications.map((n) => {
            const tone = getNotificationTone(n.type);
            return (
              <div 
                key={n.id} 
                className={`flex items-start gap-3 px-4 py-3.5 transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer ${n.isRead ? "opacity-60" : ""}`}
                onClick={() => !n.isRead && handleMarkAsRead(n.id)}
              >
                <div className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${toneMap[tone]}`}>
                  {n.isRead ? <FiCheck className="h-3.5 w-3.5" /> : <span className="h-2 w-2 rounded-full bg-current" />}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-[13px] font-semibold text-[#0F172A] dark:text-white leading-tight font-display">{n.title}</p>
                    <span className="shrink-0 text-[10px] text-slate-400 mt-0.5">{formatTimeAgo(n.createdAt)}</span>
                  </div>
                  <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400 leading-relaxed">{n.body}</p>
                </div>
              </div>
            );
          })
        )}
      </div>
      <div className="border-t border-slate-100 px-4 py-2.5 dark:border-slate-800 text-center">
        <button className="text-xs font-semibold text-[#2563EB] hover:underline dark:text-blue-400 font-display">
          View all notifications →
        </button>
      </div>
    </motion.div>
  );
}

export default function Navbar({ title, onMenuClick }) {
  const { user, logout } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const [profileOpen, setProfileOpen]   = useState(false);
  const [notifOpen, setNotifOpen]       = useState(false);
  const [quickActionOpen, setQuickActionOpen] = useState(false);
  const [unreadCount, setUnreadCount]   = useState(5);
  const avatarBg  = roleColors[user?.role] ?? "bg-slate-600";

  useEffect(() => {
    const fetchUnreadCount = async () => {
      try {
        const response = await notificationsService.getUnreadCount();
        if (response?.unreadCount !== undefined) {
          setUnreadCount(response.unreadCount);
        }
      } catch (error) {
        console.error('Failed to fetch unread count:', error);
      }
    };

    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 30000);
    return () => clearInterval(interval);
  }, [user?.role]);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  };

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-4 border-b border-slate-200/80 bg-white/95 px-4 backdrop-blur-md dark:border-slate-800 dark:bg-slate-950/95 sm:px-6 lg:px-8">
      
      {/* Left Row: Mobile Menu & Command Palette Search Bar */}
      <div className="flex items-center gap-3 flex-1 max-w-xl">
        <button
          onClick={onMenuClick}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-slate-600 transition hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800 lg:hidden"
          aria-label="Open navigation"
        >
          <FiMenu className="h-5 w-5" />
        </button>

        {/* Hero Command Palette Search Bar matching reference image */}
        <div className="relative w-full max-w-md">
          <div className="flex h-10 w-full items-center gap-2.5 rounded-xl border border-slate-200/90 bg-slate-50/80 px-3.5 transition-all focus-within:border-[#2563EB] focus-within:bg-white focus-within:ring-2 focus-within:ring-[#2563EB]/15 dark:border-slate-800 dark:bg-slate-900/80 dark:focus-within:bg-slate-900">
            <FiSearch className="h-4 w-4 shrink-0 text-slate-400" />
            <input
              placeholder="Search children, orphanages, parents, documents..."
              className="w-full bg-transparent text-xs text-[#0F172A] outline-none placeholder:text-slate-400 dark:text-white font-sans"
            />
            <kbd className="hidden sm:inline-flex h-5 select-none items-center gap-0.5 rounded border border-slate-200 bg-white px-1.5 font-mono text-[10px] font-medium text-slate-400 shadow-2xs dark:border-slate-700 dark:bg-slate-800">
              ⌘ K
            </kbd>
          </div>
        </div>
      </div>

      {/* Right Controls Row (Exact layout matching Reference Image) */}
      <div className="flex items-center gap-2 sm:gap-2.5">
        
        {/* Fullscreen toggle */}
        <button
          onClick={toggleFullscreen}
          className="hidden sm:flex h-9 w-9 items-center justify-center rounded-xl text-slate-500 hover:bg-slate-100 hover:text-slate-700 dark:text-slate-400 dark:hover:bg-slate-800 transition-colors"
          title="Fullscreen"
        >
          <FiMaximize className="h-4 w-4" />
        </button>

        {/* Notifications Dropdown */}
        <div className="relative">
          <button
            onClick={() => { setNotifOpen((v) => !v); setProfileOpen(false); setQuickActionOpen(false); }}
            className="relative flex h-9 w-9 items-center justify-center rounded-xl text-slate-500 hover:bg-slate-100 hover:text-slate-700 dark:text-slate-400 dark:hover:bg-slate-800 transition-colors"
            aria-label="Notifications"
          >
            <FiBell className="h-4 w-4" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[9px] font-bold text-white shadow-xs">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </button>
          <AnimatePresence>
            {notifOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setNotifOpen(false)} />
                <div className="relative z-50">
                  <NotificationDropdown onClose={() => setNotifOpen(false)} />
                </div>
              </>
            )}
          </AnimatePresence>
        </div>

        {/* Messages */}
        <button
          className="hidden sm:flex h-9 w-9 items-center justify-center rounded-xl text-slate-500 hover:bg-slate-100 hover:text-slate-700 dark:text-slate-400 dark:hover:bg-slate-800 transition-colors"
          title="Messages"
        >
          <FiMail className="h-4 w-4" />
        </button>

        {/* Theme toggle */}
        <button
          onClick={toggleTheme}
          className="flex h-9 w-9 items-center justify-center rounded-xl text-slate-500 hover:bg-slate-100 hover:text-slate-700 dark:text-slate-400 dark:hover:bg-slate-800 transition-colors"
          title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
        >
          {isDark ? <FiSun className="h-4 w-4" /> : <FiMoon className="h-4 w-4" />}
        </button>

        {/* Primary Action Button: + Quick Action ˅ */}
        <div className="relative">
          <button
            onClick={() => setQuickActionOpen((v) => !v)}
            className="flex items-center gap-1.5 rounded-xl bg-[#2563EB] hover:bg-[#1D4ED8] text-white px-3.5 py-2 text-xs font-semibold shadow-md shadow-blue-600/20 active:scale-[0.98] transition-all font-display"
          >
            <FiPlus className="h-4 w-4" />
            <span className="hidden sm:inline">Quick Action</span>
            <FiChevronDown className="h-3.5 w-3.5" />
          </button>

          <AnimatePresence>
            {quickActionOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setQuickActionOpen(false)} />
                <motion.div
                  initial={{ opacity: 0, y: 8, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 6, scale: 0.97 }}
                  transition={{ duration: 0.15 }}
                  className="absolute right-0 top-full z-50 mt-2 w-48 rounded-2xl border border-slate-200/80 bg-white py-1.5 shadow-xl dark:border-slate-700 dark:bg-slate-900"
                >
                  <Link
                    to={`/${user?.role}/children`}
                    className="flex items-center gap-2 px-3.5 py-2 text-xs font-medium text-[#0F172A] hover:bg-slate-50 dark:text-white dark:hover:bg-slate-800"
                    onClick={() => setQuickActionOpen(false)}
                  >
                    <FiUserPlus className="h-3.5 w-3.5 text-[#2563EB]" /> Register Child
                  </Link>
                  <Link
                    to={`/${user?.role}/alerts`}
                    className="flex items-center gap-2 px-3.5 py-2 text-xs font-medium text-[#0F172A] hover:bg-slate-50 dark:text-white dark:hover:bg-slate-800"
                    onClick={() => setQuickActionOpen(false)}
                  >
                    <FiBell className="h-3.5 w-3.5 text-amber-500" /> Review Alerts
                  </Link>
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>

      </div>
    </header>
  );
}
