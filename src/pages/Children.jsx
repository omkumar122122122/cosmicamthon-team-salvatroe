import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { FiUsers, FiAlertTriangle, FiHeart, FiUserCheck, FiLoader } from "react-icons/fi";
import Breadcrumb from "../components/Breadcrumb";
import DataTable from "../components/DataTable";
import Pagination from "../components/Pagination";
import SearchBar from "../components/SearchBar";
import ToastContainer from "../components/Toast";
import { SkeletonTable } from "../components/Loader";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../hooks/useToast";
import { childrenService } from "../services/childrenService";
import { classNames } from "../utils/formatters";

const summaryConfig = [
  { label: "Total Children", key: "total",    icon: FiUsers,        color: "bg-civic-50 text-civic-700 ring-1 ring-civic-200 dark:bg-civic-500/10 dark:text-civic-300 dark:ring-civic-500/20" },
  { label: "High Risk",      key: "highRisk",      icon: FiAlertTriangle, color: "bg-red-50 text-red-700 ring-1 ring-red-200 dark:bg-red-500/10 dark:text-red-300 dark:ring-red-500/20" },
  { label: "Adopted",        key: "adopted",   icon: FiHeart,        color: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-300 dark:ring-emerald-500/20" },
  { label: "Needs Review",   key: "needsReview",    icon: FiUserCheck,    color: "bg-amber-50 text-amber-700 ring-1 ring-amber-200 dark:bg-amber-500/10 dark:text-amber-300 dark:ring-amber-500/20" },
];

export default function Children() {
  const [query, setQuery] = useState("");
  const [data, setData] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 8, total: 0, totalPages: 0 });
  const [summary, setSummary] = useState({ total: 0, highRisk: 0, adopted: 0, needsReview: 0 });
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toasts, error: showError, removeToast } = useToast();

  const isOrphanageUser = user?.role === 'orphanage';
  const basePath = user?.role === "admin" ? "/admin" : "/orphanage";

  // Define columns based on user role - orphanage column only for admin users
  const columns = [
    { key: "childCode",  label: "Child ID" },
    { key: "name",       label: "Name" },
    { key: "age",        label: "Age" },
    ...(isOrphanageUser ? [] : [{ key: "orphanage",  label: "Orphanage" }]),
    { key: "risk",       label: "Risk" },
    { key: "health",     label: "Health" },
    { key: "attendance", label: "Attendance" },
  ];

  const loadChildren = async (page = 1, searchQuery = query) => {
    try {
      setLoading(true);
      const response = await childrenService.getAll({
        search: searchQuery,
        page,
        limit: 8,
      });

      // childrenService.getAll returns unwrapped response: { data, pagination, summary }
      // Handle both wrapped and unwrapped responses
      const payload = response?.data && typeof response?.data === 'object' && !Array.isArray(response?.data)
        ? response.data
        : response;
      setData(Array.isArray(payload?.data) ? payload.data : []);
      setPagination(payload?.pagination ?? { page: 1, limit: 8, total: 0, totalPages: 0 });
      setSummary(payload?.summary ?? { total: 0, highRisk: 0, adopted: 0, needsReview: 0 });
    } catch (err) {
      showError(err.message || "Failed to load children");
      console.error("Error loading children:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadChildren();
  }, []);

  useEffect(() => {
    const delaySearch = setTimeout(() => {
      if (query !== undefined) {
        loadChildren(1, query);
      }
    }, 300);

    return () => clearTimeout(delaySearch);
  }, [query]);

  const handlePageChange = (newPage) => {
    loadChildren(newPage);
  };

  const handleRowClick = (child) => {
    navigate(`${basePath}/children/${child.id}`);
  };

  return (
    <div className="space-y-6">
      <ToastContainer toasts={toasts} onRemove={removeToast} />

      <Breadcrumb items={["Records", "Children"]} />

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center"
      >
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-civic-50 text-civic-600 dark:bg-civic-500/10 dark:text-civic-400">
            <FiUsers className="h-5 w-5" />
          </div>
          <div>
            <h1 className="page-title">Child Records</h1>
            <p className="page-subtitle">
              {isOrphanageUser
                ? "Children in your care home"
                : "Centralised welfare and AI risk monitoring list"}
            </p>
          </div>
        </div>
        <SearchBar value={query} onChange={setQuery} placeholder="Search by name, ID or risk…" className="sm:max-w-xs" />
      </motion.div>

      {/* Summary strip */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="grid grid-cols-2 gap-3 sm:grid-cols-4"
      >
        {summaryConfig.map((s) => {
          const Icon = s.icon;
          return (
            <div key={s.label} className={classNames("flex items-center gap-3 rounded-2xl px-4 py-3.5 shadow-sm border border-slate-200/60 dark:border-slate-800", s.color)}>
              <Icon className="h-4.5 w-4.5 shrink-0" />
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider opacity-75 font-display">{s.label}</p>
                <p className="mt-0.5 text-xl font-bold tabular-nums leading-none font-display">{summary[s.key] || 0}</p>
              </div>
            </div>
          );
        })}
      </motion.div>

      {/* Table */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="section-card"
      >
        {loading ? (
          <SkeletonTable rows={8} cols={columns.length} />
        ) : data.length === 0 ? (
          <div className="empty-state py-16">
            <div className="empty-state-icon"><FiUsers className="h-6 w-6 text-slate-400" /></div>
            <p className="empty-state-title">No Children Found</p>
            <p className="empty-state-desc">
              {query ? "Try adjusting your search query" : isOrphanageUser ? "No children registered yet in your care home" : "No children registered yet"}
            </p>
          </div>
        ) : (
          <>
            <DataTable
              columns={columns}
              rows={data}
              onRowClick={handleRowClick}
            />
            {pagination.totalPages > 1 && (
              <div className="border-t border-slate-100 px-5 py-4 dark:border-slate-800">
                <Pagination
                  page={pagination.page}
                  totalPages={pagination.totalPages}
                  onPageChange={handlePageChange}
                />
              </div>
            )}
          </>
        )}
      </motion.div>
    </div>
  );
}