import { useState } from "react";
import { NavLink } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  FiShield, FiChevronRight, FiLogOut, FiChevronLeft,
  FiActivity, FiCheckCircle
} from "react-icons/fi";
import { useAuth } from "../context/AuthContext";
import { classNames } from "../utils/formatters";

function NavItem({ item, collapsed }) {
  return (
    <NavLink
      to={item.path}
      end
      className={({ isActive }) =>
        classNames(
          "group relative flex items-center gap-3 rounded-2xl px-3.5 py-2.5 text-sm font-medium transition-all duration-150 focus:outline-none",
          isActive
            ? "bg-[#EFF6FF] text-[#2563EB] font-bold dark:bg-blue-500/15 dark:text-blue-400"
            : "text-slate-600 hover:bg-slate-100/70 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200"
        )
      }
    >
      {({ isActive }) => (
        <>
          {isActive && (
            <motion.span
              layoutId="activeNav"
              className="absolute inset-0 rounded-2xl bg-[#EFF6FF] dark:bg-blue-500/15"
              transition={{ type: "spring", stiffness: 380, damping: 32 }}
            />
          )}
          <span className="relative flex h-[18px] w-[18px] shrink-0 items-center justify-center">
            <item.icon
              className={classNames(
                "h-[18px] w-[18px] shrink-0 transition-colors duration-150",
                isActive ? "text-[#2563EB] dark:text-blue-400" : "text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300"
              )}
            />
          </span>
          <AnimatePresence>
            {!collapsed && (
              <motion.span
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: "auto" }}
                exit={{ opacity: 0, width: 0 }}
                transition={{ duration: 0.15 }}
                className="relative flex-1 truncate font-display"
              >
                {item.label}
              </motion.span>
            )}
          </AnimatePresence>
          {!collapsed && isActive && (
            <FiChevronRight className="relative h-3.5 w-3.5 shrink-0 text-[#2563EB] dark:text-blue-400" />
          )}
        </>
      )}
    </NavLink>
  );
}

function SidebarContent({ navItems, roleLabel, user, collapsed, onToggle, onLogout }) {
  // Group nav items logically
  const groupedNav = {
    MANAGEMENT: navItems.filter(i => ['Dashboard', 'Children', 'Orphanages', 'Parents', 'Adoptions', 'AI Verifications', 'Visits & Attendance', 'Documents'].includes(i.label)),
    MONITORING: navItems.filter(i => ['Alerts', 'Reports', 'Audit Logs', 'Health Monitoring', 'AI Attendance', 'Follow-up Sessions'].includes(i.label)),
    SYSTEM: navItems.filter(i => ['Settings', 'Profile', 'Staff Management'].includes(i.label)),
  };

  // Fallback if items don't fit exact groups
  const uncategorized = navItems.filter(i => 
    !groupedNav.MANAGEMENT.includes(i) && 
    !groupedNav.MONITORING.includes(i) && 
    !groupedNav.SYSTEM.includes(i)
  );

  return (
    <div className="flex h-full flex-col justify-between bg-white dark:bg-slate-900 border-r border-slate-200/80 dark:border-slate-800">
      
      {/* ── Top Header Brand ─────────────────────── */}
      <div>
        <div className={classNames("flex items-center gap-3 px-4 py-5", collapsed ? "justify-center" : "")}>
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[#2563EB] shadow-md shadow-blue-600/20 text-white">
            <svg className="h-6 w-6 fill-current" viewBox="0 0 24 24">
              <path d="M12 2L2 7l10 15 10-15-10-5zm0 3.8L18.4 8 12 17.6 5.6 8 12 5.8z" />
            </svg>
          </div>
          <AnimatePresence>
            {!collapsed && (
              <motion.div
                initial={{ opacity: 0, x: -6 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -6 }}
                transition={{ duration: 0.15 }}
                className="min-w-0"
              >
                <h1 className="font-display text-lg font-extrabold tracking-wider text-[#0F172A] dark:text-white">
                  VELORA
                </h1>
                <p className="text-[11px] font-medium text-slate-400 dark:text-slate-500 leading-tight">
                  Child Safety &amp; Adoption
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="mx-4 h-px bg-slate-100 dark:bg-slate-800" />
      </div>

      {/* ── Scrollable Navigation Group List ──────── */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-5" aria-label="Sidebar navigation">
        {Object.entries(groupedNav).map(([groupName, items]) => {
          if (items.length === 0) return null;
          return (
            <div key={groupName} className="space-y-1">
              {!collapsed && (
                <p className="px-3 pb-1 text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400 dark:text-slate-500 font-display">
                  {groupName}
                </p>
              )}
              {items.map((item) => (
                <NavItem key={item.path} item={item} collapsed={collapsed} />
              ))}
            </div>
          );
        })}

        {uncategorized.length > 0 && (
          <div className="space-y-1">
            {!collapsed && (
              <p className="px-3 pb-1 text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400 dark:text-slate-500 font-display">
                OTHER
              </p>
            )}
            {uncategorized.map((item) => (
              <NavItem key={item.path} item={item} collapsed={collapsed} />
            ))}
          </div>
        )}
      </nav>

      {/* ── Bottom Section: Integrated AI Card & User Profile Footer ── */}
      <div className="px-3 pb-3 space-y-3">
        
        {/* Floating AI Protection Active Status Card */}
        {!collapsed && (
          <div className="rounded-2xl border border-blue-100 bg-[#F0F7FF] p-3.5 dark:border-blue-500/20 dark:bg-blue-500/10">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#2563EB] text-white shadow-sm">
                <FiShield className="h-5 w-5" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-xs font-bold text-[#0F172A] dark:text-white font-display">
                    AI Protection Active
                  </span>
                </div>
                <p className="mt-0.5 text-[10px] text-slate-500 dark:text-slate-400 leading-tight">
                  All systems are secure and monitoring 24/7
                </p>
              </div>
            </div>
          </div>
        )}

        {/* User Profile Footer Card */}
        {user && (
          <div className="rounded-2xl border border-slate-200/80 bg-white p-2.5 shadow-2xs dark:border-slate-800 dark:bg-slate-900">
            <div className={classNames("flex items-center gap-3", collapsed ? "justify-center" : "")}>
              <div className={classNames(
                "flex shrink-0 items-center justify-center rounded-xl text-xs font-bold text-white shadow-sm font-display h-9 w-9",
                user.role === "admin" ? "bg-indigo-600" : user.role === "parent" ? "bg-emerald-600" : "bg-civic-600"
              )}>
                {user.avatar}
              </div>
              {!collapsed && (
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-bold text-[#0F172A] dark:text-white font-display">
                    {user.name}
                  </p>
                  <p className="truncate text-[10px] text-slate-400 capitalize">
                    {user.email || `${user.role}@velora.com`}
                  </p>
                </div>
              )}
              {!collapsed && (
                <button
                  onClick={onLogout}
                  className="rounded-lg p-1 text-slate-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-500/10 transition-colors"
                  aria-label="Sign out"
                  title="Sign out"
                >
                  <FiLogOut className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>
        )}

        {/* Sidebar Collapse Toggle */}
        <button
          onClick={onToggle}
          className="flex w-full items-center justify-center rounded-xl py-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800"
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          <motion.span animate={{ rotate: collapsed ? 180 : 0 }} transition={{ duration: 0.2 }}>
            <FiChevronLeft className="h-4 w-4" />
          </motion.span>
        </button>
      </div>

    </div>
  );
}

export default function Sidebar({ navItems, roleLabel, mobile = false }) {
  const { user, logout } = useAuth();
  const [collapsed, setCollapsed] = useState(false);

  if (mobile) {
    return (
      <div className="h-full w-full overflow-y-auto">
        <SidebarContent
          navItems={navItems}
          roleLabel={roleLabel}
          user={user}
          collapsed={false}
          onToggle={() => {}}
          onLogout={logout}
        />
      </div>
    );
  }

  return (
    <motion.aside
      animate={{ width: collapsed ? 72 : 260 }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
      className="hidden lg:flex lg:flex-col lg:shrink-0 lg:sticky lg:top-0 lg:h-screen overflow-hidden z-10"
    >
      <SidebarContent
        navItems={navItems}
        roleLabel={roleLabel}
        user={user}
        collapsed={collapsed}
        onToggle={() => setCollapsed((v) => !v)}
        onLogout={logout}
      />
    </motion.aside>
  );
}
