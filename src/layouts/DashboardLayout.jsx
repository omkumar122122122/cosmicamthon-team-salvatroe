import { useState } from "react";
import { Outlet } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { FiX } from "react-icons/fi";
import Navbar from "../components/Navbar.jsx";
import Sidebar from "../components/Sidebar.jsx";
import { roleLabels } from "../utils/constants.js";
import mainBgPattern from "../assets/image copy 2.png";

export default function DashboardLayout({ navItems, role, title }) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="relative flex min-h-screen bg-[#F8FAFC] dark:bg-[#080E1A]">
      {/* Global Main Enterprise SaaS Background Image */}
      <div 
        className="pointer-events-none fixed inset-0 z-0 bg-cover bg-right-top bg-no-repeat opacity-90 dark:opacity-20"
        style={{ backgroundImage: `url("${mainBgPattern}")` }}
      />

      {/* Desktop sidebar */}
      <Sidebar navItems={navItems} roleLabel={roleLabels[role]} />

      {/* Mobile overlay + drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              className="fixed inset-0 z-40 bg-slate-900/60 backdrop-blur-sm lg:hidden"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileOpen(false)}
            />
            <motion.div
              className="fixed inset-y-0 left-0 z-50 w-72 bg-sidebar shadow-sidebar lg:hidden"
              initial={{ x: -288 }}
              animate={{ x: 0 }}
              exit={{ x: -288 }}
              transition={{ type: "spring", damping: 28, stiffness: 280 }}
            >
              <div className="flex items-center justify-end px-3 pt-3">
                <button
                  onClick={() => setMobileOpen(false)}
                  className="flex h-8 w-8 items-center justify-center rounded-xl text-slate-400 transition hover:bg-white/10 hover:text-white"
                  aria-label="Close navigation"
                >
                  <FiX className="h-4 w-4" />
                </button>
              </div>
              <Sidebar navItems={navItems} roleLabel={roleLabels[role]} mobile />
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Main content */}
      <div className="relative z-10 flex min-w-0 flex-1 flex-col">
        <Navbar title={title} onMenuClick={() => setMobileOpen(true)} />
        <main className="flex-1 px-4 py-5 sm:px-6 sm:py-6 lg:px-8 lg:py-8 max-w-[1400px] w-full mx-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
