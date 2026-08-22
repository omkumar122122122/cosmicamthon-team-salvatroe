import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import {
  FiUsers, FiCamera, FiAlertTriangle, FiFileText, FiCheckCircle,
  FiArrowRight, FiActivity, FiShield, FiCalendar, FiClock
} from "react-icons/fi";
import Breadcrumb from "../components/Breadcrumb";
import { StatCard } from "../components/Card";
import DataTable from "../components/DataTable";
import NotificationPanel from "../components/NotificationPanel";
import { useAuth } from "../context/AuthContext";
import { orphanagesService } from "../services/orphanagesService";
import { alertsService } from "../services/alertsService";
import { visitRequestsService } from "../services/visitRequestsService";
import { PageSkeleton } from "../components/Loader";
import heroBanner from "../assets/image copy.png";

const quickActions = [
  { label: "AI Attendance", to: "/orphanage/ai-attendance", icon: FiCamera, color: "bg-purple-600", ring: "ring-purple-500/20", desc: "Face recognition check-in" },
  { label: "Health Monitoring", to: "/orphanage/health", icon: FiActivity, color: "bg-[#2563EB]", ring: "ring-blue-500/20", desc: "Vitals & medical checkups" },
  { label: "Follow-up Sessions", to: "/orphanage/follow-up", icon: FiFileText, color: "bg-emerald-600", ring: "ring-emerald-500/20", desc: "Welfare officer reviews" },
  { label: "Visit Requests", to: "/orphanage/visit-requests", icon: FiUsers, color: "bg-amber-600", ring: "ring-amber-500/20", desc: "Manage parent visits" },
];

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 14 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.3, delay, ease: [0.16, 1, 0.3, 1] },
});

export default function OrphanageDashboard() {
  const { user } = useAuth();
  const [dashboardData, setDashboardData] = useState(null);
  const [recentChildren, setRecentChildren] = useState([]);
  const [pendingVisitRequests, setPendingVisitRequests] = useState([]);
  const [alertStats, setAlertStats] = useState({ total: 0, high: 0, pending: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
      loadDashboardData({ silent: false });

    const timer = setInterval(() => {
      loadDashboardData({ silent: true });
    }, 30000);

    return () => clearInterval(timer);
  }, []);

  async function loadDashboardData({ silent = false } = {}) {
    try {
      if (!silent) {
        setLoading(true);
      }
      const [statsResponse, childrenResponse, visitsResponse, alertsResponse] = await Promise.allSettled([
        orphanagesService.getDashboardStats(),
        orphanagesService.getMyChildren(5),
        visitRequestsService.getAll({ status: "PENDING", limit: 5, sortBy: "createdAt", sortOrder: "desc" }),
        alertsService.getAll({ limit: 1 }).catch(() => ({ stats: { total: 0, high: 0, pending: 0 } })),
      ]);

      if (statsResponse.status === "fulfilled") {
        setDashboardData(statsResponse.value.data);
      }

      if (childrenResponse.status === "fulfilled") {
        setRecentChildren(childrenResponse.value?.data || []);
      } else {
        setRecentChildren([]);
      }

      if (visitsResponse.status === "fulfilled") {
        setPendingVisitRequests(visitsResponse.value?.data || []);
      } else {
        setPendingVisitRequests([]);
      }

      if (alertsResponse.status === "fulfilled") {
        const alertStatsData = alertsResponse.value?.stats || alertsResponse.value?.data?.stats || { total: 0, high: 0, pending: 0 };
        setAlertStats(alertStatsData);
      } else {
        setAlertStats({ total: 0, high: 0, pending: 0 });
      }
    } catch (error) {
      console.error('Failed to load orphanage dashboard:', error);
    } finally {
      if (!silent) {
        setLoading(false);
      }
    }
  }

  if (loading) {
    return <PageSkeleton />;
  }

  const inCare = dashboardData?.inCare || 0;
  const attendanceRate = dashboardData?.attendanceRate || "0%";
  const activeAlertsCount = dashboardData?.activeAlerts || 0;
  const pendingVisits = dashboardData?.pendingVisits || 0;

  const orphanageStatCards = [
    { label: "Children in Care", value: inCare, trend: "↑ Active records", icon: FiUsers, tone: "purple" },
    { label: "Today's Attendance", value: attendanceRate, trend: "↑ AI Verified", icon: FiCamera, tone: "green" },
    { label: "Active Alerts", value: activeAlertsCount, trend: "Requires attention", icon: FiAlertTriangle, tone: "red" },
    { label: "Pending Visits", value: pendingVisits, trend: "Awaiting approval", icon: FiClock, tone: "amber" },
  ];

  const firstName = user?.firstName || user?.name?.trim().split(" ")[0] || "Officer";

  return (
    <div className="space-y-6 pb-6">
      <Breadcrumb items={["Orphanage", "Dashboard"]} />

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

        <div className="relative z-10 flex h-full flex-col justify-between">
          <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
            <div className="max-w-xl">
              <p className="text-xs sm:text-sm font-semibold uppercase tracking-wider text-[#2563EB] dark:text-blue-400">
                Welcome Back,
              </p>
              <h1 className="mt-0.5 text-xl sm:text-2xl lg:text-3xl font-extrabold tracking-tight text-[#0F172A] dark:text-white font-display leading-tight">
                {firstName}! 👋
              </h1>
              <p className="mt-1.5 text-xs sm:text-sm text-[#64748B] dark:text-slate-300 font-sans max-w-lg leading-relaxed">
                {user?.department ? `${user.department} — Manage child welfare, AI attendance tracking, and parent visit coordination.` : "Manage child welfare, automated AI attendance tracking, and parent visit coordination efficiently."}
              </p>
            </div>

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

      {/* Overlapping Floating Stat Cards */}
      <div className="relative z-20 -mt-8 sm:-mt-10 md:-mt-12 grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 px-2 sm:px-4">
        {orphanageStatCards.map((item, i) => (
          <motion.div key={item.label} {...fadeUp(0.1 + i * 0.04)}>
            <StatCard {...item} />
          </motion.div>
        ))}
      </div>

      {/* Operational Quick Actions */}
      <motion.div {...fadeUp(0.2)}>
        <h2 className="mb-3 text-xs font-bold uppercase tracking-widest text-[#64748B] dark:text-slate-400 font-display">
          Operational Quick Actions
        </h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {quickActions.map((a) => {
            const Icon = a.icon;
            return (
              <Link
                key={a.label}
                to={a.to}
                className="group relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-4 shadow-card transition-all duration-200 hover:-translate-y-1 hover:shadow-card-hover dark:border-slate-800 dark:bg-slate-900"
              >
                <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${a.color} shadow-sm ring-2 ${a.ring} ring-offset-1`}>
                  <Icon className="h-4.5 w-4.5 text-white" />
                </div>
                <p className="mt-3 text-[13px] font-bold text-[#0F172A] dark:text-white font-display">{a.label}</p>
                <p className="mt-0.5 text-[11px] text-[#64748B] dark:text-slate-400">{a.desc}</p>
                <FiArrowRight className="absolute right-4 top-4 h-3.5 w-3.5 text-slate-300 opacity-0 transition group-hover:opacity-100 dark:text-slate-600" />
              </Link>
            );
          })}
        </div>
      </motion.div>

      <motion.div {...fadeUp(0.22)}>
        <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-card dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400">
                <FiClock className="h-3.5 w-3.5" />
              </div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-white font-display">Pending Visit Requests</h2>
              <span className="badge badge-neutral">{pendingVisitRequests.length}</span>
            </div>
            <Link to="/orphanage/visit-requests" className="flex items-center gap-1 text-xs font-semibold text-[#2563EB] hover:underline dark:text-blue-400">
              Open queue <FiArrowRight className="h-3 w-3" />
            </Link>
          </div>
          <div className="p-6">
            {pendingVisitRequests.length === 0 ? (
              <div className="py-8 text-center text-sm text-slate-500 dark:text-slate-400">
                No pending visit requests at the moment.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[760px] border-separate border-spacing-y-2 text-left">
                  <thead>
                    <tr className="text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                      <th className="px-3 py-2">Request ID</th>
                      <th className="px-3 py-2">Parent</th>
                      <th className="px-3 py-2">Visit Date</th>
                      <th className="px-3 py-2">Time</th>
                      <th className="px-3 py-2">Purpose</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pendingVisitRequests.map((request) => (
                      <tr key={request.id} className="rounded-xl bg-slate-50 text-sm font-medium text-slate-700 dark:bg-slate-800/60 dark:text-slate-200">
                        <td className="rounded-l-xl px-3 py-3 font-bold text-civic-700 dark:text-civic-300">{request.requestId}</td>
                        <td className="px-3 py-3">{request.parent?.fullName || request.parentName || "Unknown Parent"}</td>
                        <td className="px-3 py-3">{new Date(request.visitDate).toLocaleDateString()}</td>
                        <td className="px-3 py-3">{request.visitTime || "N/A"}</td>
                        <td className="px-3 py-3">{request.purpose}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </motion.div>

      {/* Children Table & Notifications */}
      <motion.div {...fadeUp(0.28)} className="grid gap-5 grid-cols-1 lg:grid-cols-12">
        <div className="lg:col-span-8 section-card">
          <div className="section-card-header">
            <div className="flex items-center gap-2.5">
              <div className="section-card-icon bg-blue-50 text-[#2563EB] dark:bg-blue-500/10 dark:text-blue-400">
                <FiUsers className="h-4 w-4" />
              </div>
              <h2 className="section-card-title">Children in Care</h2>
              <span className="badge badge-neutral">{recentChildren.length} recent</span>
            </div>
            <Link to="/orphanage/children" className="flex items-center gap-1 text-xs font-semibold text-[#2563EB] hover:underline dark:text-blue-400">
              View all <FiArrowRight className="h-3 w-3" />
            </Link>
          </div>
          <DataTable
            columns={[
              { key: "childCode",  label: "Child ID" },
              { key: "name",       label: "Name" },
              { key: "age",        label: "Age" },
              { key: "risk",       label: "Risk Level" },
              { key: "attendance", label: "Attendance" },
            ]}
            rows={recentChildren}
          />
        </div>

        <div className="lg:col-span-4">
          <NotificationPanel />
        </div>
      </motion.div>
    </div>
  );
}
