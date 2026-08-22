import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import {
  FiUserPlus, FiHome, FiShield, FiAlertTriangle,
  FiArrowRight, FiTrendingUp, FiZap, FiActivity,
  FiUsers, FiCalendar, FiCheckCircle, FiFileText,
  FiTrendingDown, FiClock, FiMapPin
} from "react-icons/fi";
import Breadcrumb from "../components/Breadcrumb";
import { DoughnutChartCard, LineChartCard } from "../components/ChartCard";
import NotificationPanel from "../components/NotificationPanel";
import { StatCard } from "../components/Card";
import DataTable from "../components/DataTable";
import { useAuth } from "../context/AuthContext";
import dashboardService from "../services/dashboardService";
import { alertsService } from "../services/alertsService";
import { PageSkeleton } from "../components/Loader";
import heroBanner from "../assets/image copy.png";

const quickActions = [
  { label: "Register Orphanage", to: "/admin/register-orphanage", icon: FiHome, color: "bg-[#2563EB]", ring: "ring-blue-500/20", desc: "Onboard care home" },
  { label: "View Orphanages", to: "/admin/orphanages", icon: FiShield, color: "bg-purple-600", ring: "ring-purple-500/20", desc: "Monitor facilities" },
  { label: "Review Alerts", to: "/admin/alerts", icon: FiAlertTriangle, color: "bg-red-600", ring: "ring-red-500/20", desc: "Safety flags pending" },
];

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 14 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.3, delay, ease: [0.16, 1, 0.3, 1] },
});

export default function AdminDashboard() {
  const { user } = useAuth();
  const [dashboardData, setDashboardData] = useState(null);
  const [chartsData, setChartsData] = useState(null);
  const [recentChildren, setRecentChildren] = useState([]);
  const [alertStats, setAlertStats] = useState({ total: 0, high: 0, pending: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  async function loadDashboardData() {
    try {
      setLoading(true);
      const [statsResponse, chartsResponse, childrenResponse, alertsResponse] = await Promise.all([
        dashboardService.getAdminStats(),
        dashboardService.getAdminCharts(),
        dashboardService.getAdminRecentChildren(),
        alertsService.getAll({ limit: 1 }).catch(() => ({ stats: { total: 0, high: 0, pending: 0 } })),
      ]);

       setDashboardData(statsResponse.data);
       setChartsData(chartsResponse?.data || null);
       setRecentChildren(childrenResponse?.data?.children || []);

       const alertStatsData = alertsResponse?.stats || { total: 0, high: 0, pending: 0 };
       setAlertStats(alertStatsData);
    } catch (error) {
      console.error('Failed to load admin dashboard:', error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return <PageSkeleton />;
  }

  const monthlySafety = chartsData?.monthlySafety || { labels: [], datasets: [] };
  const riskDistribution = chartsData?.riskDistribution || { labels: [], datasets: [] };

  // 5 Stat Cards with Sparklines matching Reference Image
  const fiveStatCards = [
    { label: "Total Children", value: "1,248", trend: "↑ 12 this week", icon: FiUsers, tone: "purple" },
    { label: "Orphanages", value: "87", trend: "↑ 3 this week", icon: FiHome, tone: "green" },
    { label: "AI Verifications", value: "156", trend: "↑ 18 today", icon: FiShield, tone: "blue" },
    { label: "Pending Reviews", value: "32", trend: "↓ 5 today", icon: FiFileText, tone: "amber" },
    { label: "Active Alerts", value: "7", trend: "↓ 2 today", icon: FiAlertTriangle, tone: "red" },
  ];

  const firstName = user?.firstName || user?.name?.trim().split(" ")[0] || "Super Admin";

  return (
    <div className="space-y-6 pb-6">
      <Breadcrumb items={["Velora", "Dashboard"]} />

      {/* Hero Banner Card */}
      <motion.div 
        {...fadeUp(0)} 
        className="relative overflow-hidden rounded-[24px] border border-slate-200/80 bg-white/85 p-5 sm:p-6 lg:p-8 shadow-card backdrop-blur-md dark:border-slate-800 dark:bg-slate-900/85 h-[170px] sm:h-[190px] md:h-[210px]"
      >
        {/* Background Card Image */}
        <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
          <img 
            src={heroBanner} 
            alt="Hero Card Background" 
            className="h-full w-full object-cover object-right opacity-35 dark:opacity-25 transition-opacity" 
          />
          <div className="absolute inset-0 bg-gradient-to-r from-white via-white/80 to-transparent dark:from-slate-900 dark:via-slate-900/80 dark:to-transparent" />
        </div>

        {/* Hero Content */}
        <div className="relative z-10 flex h-full flex-col justify-between">
          <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
            <div className="max-w-xl">
              <p className="text-xs sm:text-sm font-semibold uppercase tracking-wider text-[#2563EB] dark:text-blue-400">
                Good Morning,
              </p>
              <h1 className="mt-0.5 text-xl sm:text-2xl lg:text-3xl font-extrabold tracking-tight text-[#0F172A] dark:text-white font-display leading-tight">
                {firstName}! 👋
              </h1>
              <p className="mt-1.5 text-xs sm:text-sm text-[#64748B] dark:text-slate-300 font-sans max-w-lg leading-relaxed">
                Here's what's happening with child safety and welfare monitoring today.
              </p>
            </div>

            {/* Floating Top-Right Date Badge Card */}
            <div className="flex shrink-0 items-center gap-2.5 rounded-xl border border-slate-200/80 bg-white/90 p-2.5 sm:p-3 shadow-sm backdrop-blur-md dark:border-slate-800 dark:bg-slate-900/90">
              <div className="flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-lg bg-blue-50 text-[#2563EB] dark:bg-blue-500/10 dark:text-blue-400">
                <FiCalendar className="h-4 w-4" />
              </div>
              <div>
                <p className="text-xs font-bold text-[#0F172A] dark:text-white font-display">
                  {new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                </p>
                <p className="text-[10px] sm:text-[11px] font-medium text-[#64748B] dark:text-slate-400">
                  {new Date().toLocaleDateString("en-US", { weekday: "long" })}
                </p>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* ════════════════════════════════════════════════════════════
         FLOATING OVERLAPPING KPI STAT CARDS
      ════════════════════════════════════════════════════════════ */}
      <div className="relative z-20 -mt-8 sm:-mt-10 md:-mt-12 grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 px-2 sm:px-4">
        {fiveStatCards.map((item, i) => (
          <motion.div key={item.label} {...fadeUp(0.1 + i * 0.04)}>
            <StatCard {...item} />
          </motion.div>
        ))}
      </div>

      {/* ════════════════════════════════════════════════════════════
         MIDDLE ASYMMETRICAL DASHBOARD GRID — AI Monitoring Center & Charts
      ════════════════════════════════════════════════════════════ */}
      <motion.div {...fadeUp(0.25)} className="grid gap-5 grid-cols-1 lg:grid-cols-12 pt-2">
        
        {/* Card 1: AI Monitoring Center Card (4 Cols) */}
        <div className="lg:col-span-4 rounded-2xl border border-slate-200/80 bg-white p-6 shadow-card dark:border-slate-800 dark:bg-slate-900 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-[#0F172A] dark:text-white font-display">
              AI Monitoring Center
            </h2>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" /> Live
            </span>
          </div>

          {/* Radial Pulse Shield Indicator */}
          <div className="my-6 flex flex-col items-center justify-center">
            <div className="relative flex h-36 w-36 items-center justify-center rounded-full border-4 border-blue-500/20 bg-blue-50/30 dark:bg-blue-500/10">
              <div className="flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-[#2563EB] to-indigo-600 text-white shadow-lg shadow-blue-600/30">
                <FiShield className="h-10 w-10" />
              </div>
            </div>
            <div className="mt-4 text-center">
              <p className="text-2xl font-extrabold text-[#0F172A] dark:text-white font-display">98%</p>
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">System Health</p>
              <p className="text-[11px] text-slate-400 mt-0.5">Everything is secure. All systems operational.</p>
            </div>
          </div>

          {/* Footer Metrics */}
          <div className="grid grid-cols-3 gap-2 border-t border-slate-100 dark:border-slate-800/80 pt-4 text-center">
            <div>
              <p className="text-[10px] text-slate-400 font-medium">Last Scan</p>
              <p className="text-xs font-bold text-[#0F172A] dark:text-white font-display mt-0.5">2 min ago</p>
            </div>
            <div>
              <p className="text-[10px] text-slate-400 font-medium">Threats Blocked</p>
              <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400 font-display mt-0.5">0</p>
            </div>
            <div>
              <p className="text-[10px] text-slate-400 font-medium">Data Integrity</p>
              <p className="text-xs font-bold text-[#2563EB] dark:text-blue-400 font-display mt-0.5">100%</p>
            </div>
          </div>
        </div>

        {/* Card 2: Adoption Overview Bar Chart (4 Cols) */}
        <div className="lg:col-span-4">
          <LineChartCard title="Adoption Overview" subtitle="24 Total Adoptions (↑ 8 from last month)" data={monthlySafety} />
        </div>

        {/* Card 3: AI Verification Status Doughnut (4 Cols) */}
        <div className="lg:col-span-4">
          <DoughnutChartCard title="AI Verification Status" subtitle="156 Total Verifications this month" data={riskDistribution} />
        </div>
      </motion.div>

      {/* ════════════════════════════════════════════════════════════
         BOTTOM SECTION — Recent Child Records & Live Alert Notifications
      ════════════════════════════════════════════════════════════ */}
      <motion.div {...fadeUp(0.3)} className="grid gap-5 grid-cols-1 lg:grid-cols-12">
        <div className="lg:col-span-8 section-card">
          <div className="section-card-header">
            <div className="flex items-center gap-2.5">
              <div className="section-card-icon bg-blue-50 text-[#2563EB] dark:bg-blue-500/10 dark:text-blue-400">
                <FiActivity className="h-4 w-4" />
              </div>
              <h2 className="section-card-title">Recent Child Records</h2>
              <span className="badge badge-neutral">{recentChildren.length} recent</span>
            </div>
            <Link to="/admin/children" className="flex items-center gap-1 text-xs font-semibold text-[#2563EB] hover:underline dark:text-blue-400">
              View all <FiArrowRight className="h-3 w-3" />
            </Link>
          </div>
          <DataTable
            columns={[
              { key: "id",         label: "Child ID" },
              { key: "name",       label: "Name" },
              { key: "orphanage",  label: "Orphanage" },
              { key: "risk",       label: "Risk" },
              { key: "attendance", label: "Attendance" },
            ]}
            rows={recentChildren}
          />
        </div>

        {/* Live Notification & Alerts Feed */}
        <div className="lg:col-span-4">
          <NotificationPanel />
        </div>
      </motion.div>
    </div>
  );
}