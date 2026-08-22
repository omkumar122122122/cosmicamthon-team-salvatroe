import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  FiAlertCircle,
  FiArrowDownRight,
  FiArrowUpRight,
  FiCalendar,
  FiCheck,
  FiCheckCircle,
  FiClock,
  FiDownload,
  FiEye,
  FiFileText,
  FiFilter,
  FiMessageSquare,
  FiRefreshCw,
  FiShield,
  FiSlash,
  FiStar,
  FiX
} from "react-icons/fi";
import Breadcrumb from "../components/Breadcrumb";
import { PageSkeleton } from "../components/Loader";
import Button from "../components/Button";
import Card from "../components/Card";
import { DoughnutChartCard, LineChartCard } from "../components/ChartCard";
import { classNames } from "../utils/formatters";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../hooks/useToast";
import ToastContainer from "../components/Toast";
import { visitRequestsService } from "../services/visitRequestsService";

// Notification configuration (static UI elements)
const notifications = [
  { title: "New Visit Request", detail: "Ananya Rao submitted a parent-child visit request.", time: "8 min ago", icon: FiCalendar },
  { title: "Visit Approved", detail: "Sameer Khanna has been cleared for today's session.", time: "32 min ago", icon: FiCheckCircle },
  { title: "Visit Cancelled", detail: "Vivek Iyer's request is awaiting fresh verification.", time: "2 hr ago", icon: FiSlash },
  { title: "High Risk Alert", detail: "Nikhil Verma needs additional document review.", time: "Today", icon: FiAlertCircle }
];

const calendarLegend = [
  { label: "Approved", color: "bg-emerald-500" },
  { label: "Pending", color: "bg-amber-500" },
  { label: "Rejected", color: "bg-rose-500" },
  { label: "Completed", color: "bg-civic-500" }
];

const feedbackOptions = {
  parentBehaviour: ["Excellent", "Good", "Average", "Poor"],
  childComfort: ["Comfortable", "Neutral", "Uncomfortable"],
  meetingOutcome: ["Suitable for Adoption", "Needs Further Evaluation", "Rejected"],
  recommendation: ["Approve Visit", "Request Follow-up", "Escalate Review"]
};

function avatarDataUri(initials, startColor, endColor) {
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="120" height="120" viewBox="0 0 120 120">
      <defs>
        <linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="${startColor}" />
          <stop offset="100%" stop-color="${endColor}" />
        </linearGradient>
      </defs>
      <rect width="120" height="120" rx="30" fill="url(#g)" />
      <circle cx="60" cy="52" r="24" fill="rgba(255,255,255,0.22)" />
      <path d="M26 100c5-18 19-28 34-28s29 10 34 28" fill="rgba(255,255,255,0.22)" />
      <text x="60" y="69" text-anchor="middle" font-family="Inter, Arial, sans-serif" font-size="30" font-weight="700" fill="white">${initials}</text>
    </svg>
  `;

  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}

function localIsoDate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function formatIsoToYYYYMMDD(dateStr) {
  if (!dateStr) return new Date(Date.now() + 86400000).toISOString().split('T')[0];
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return dateStr;
  try {
    return new Date(dateStr).toISOString().split('T')[0];
  } catch {
    return new Date(Date.now() + 86400000).toISOString().split('T')[0];
  }
}

function formatTo24HourTime(timeStr) {
  if (!timeStr) return "10:00";
  const clean = String(timeStr).trim();
  if (/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/.test(clean)) return clean;
  const match = clean.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)/i);
  if (match) {
    let hours = parseInt(match[1], 10);
    const minutes = match[2];
    const period = match[3].toUpperCase();
    if (period === 'PM' && hours < 12) hours += 12;
    if (period === 'AM' && hours === 12) hours = 0;
    return `${String(hours).padStart(2, '0')}:${minutes}`;
  }
  return "10:00";
}

const arrivalTone = {
  "Checked In": "bg-emerald-500 text-white",
  "Waiting": "bg-amber-500 text-white",
  "En Route": "bg-blue-500 text-white",
};

const priorityTone = {
  HIGH: "bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-300 border-rose-300",
  MEDIUM: "bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300 border-amber-300",
  LOW: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-300",
};

function formatDisplayDate(isoDate) {
  if (!isoDate) return "--";
  const date = new Date(`${isoDate}T00:00:00`);
  if (Number.isNaN(date.getTime())) return isoDate;
  return date.toLocaleDateString("en-US", { day: "numeric", month: "short" });
}

function shiftDate(baseDate, offset) {
  const date = new Date(baseDate);
  date.setDate(date.getDate() + offset);
  return localIsoDate(date);
}

function formatClockTime(value) {
  if (!value || value === "-" || value === "--" || value.includes("AM") || value.includes("PM")) {
    return value;
  }

  const [hoursPart, minutesPart] = value.split(":");
  const hours = Number(hoursPart);
  const minutes = minutesPart || "00";

  if (Number.isNaN(hours)) {
    return value;
  }

  const suffix = hours >= 12 ? "PM" : "AM";
  const normalizedHours = hours % 12 || 12;

  return `${normalizedHours}:${minutes} ${suffix}`;
}

function getMonthGrid(baseDate, visits) {
  const monthStart = new Date(baseDate.getFullYear(), baseDate.getMonth(), 1);
  const monthEnd = new Date(baseDate.getFullYear(), baseDate.getMonth() + 1, 0);
  const padding = monthStart.getDay();
  const cells = [];
  const eventMap = visits.reduce((map, visit) => {
    if (!map[visit.visitDate]) {
      map[visit.visitDate] = [];
    }
    map[visit.visitDate].push(visit);
    return map;
  }, {});

  for (let index = 0; index < padding; index += 1) {
    cells.push(null);
  }

  for (let day = 1; day <= monthEnd.getDate(); day += 1) {
    const date = new Date(baseDate.getFullYear(), baseDate.getMonth(), day);
    const isoDate = localIsoDate(date);

    cells.push({
      iso: isoDate,
      day,
      events: eventMap[isoDate] || []
    });
  }

  while (cells.length % 7 !== 0) {
    cells.push(null);
  }

  return cells;
}

function statusTone(status) {
  const map = {
    PENDING: "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-200",
    APPROVED: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-200",
    REJECTED: "bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-200",
    COMPLETED: "bg-civic-100 text-civic-700 dark:bg-civic-500/15 dark:text-civic-100",
    RESCHEDULED: "bg-violet-100 text-violet-700 dark:bg-violet-500/15 dark:text-violet-100",
    CANCELLED: "bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-200",
    Pending: "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-200",
    Approved: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-200",
    Rejected: "bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-200",
    Completed: "bg-civic-100 text-civic-700 dark:bg-civic-500/15 dark:text-civic-100",
    Rescheduled: "bg-violet-100 text-violet-700 dark:bg-violet-500/15 dark:text-violet-100"
  };

  return map[status] || map.Pending;
}

function riskTone(risk) {
  const map = {
    VERY_LOW: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-200",
    LOW: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-200",
    MEDIUM: "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-200",
    HIGH: "bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-200",
    CRITICAL: "bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-200",
    Low: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-200",
    Medium: "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-200",
    High: "bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-200"
  };

  return map[risk] || map.Low;
}

function ModalShell({ open, title, subtitle, onClose, children, widthClass = "max-w-5xl" }) {
  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/55 p-4 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className={classNames("glass-panel max-h-[92vh] w-full overflow-y-auto rounded-3xl", widthClass)}
            initial={{ opacity: 0, y: 24, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 24, scale: 0.98 }}
            transition={{ duration: 0.22 }}
          >
            <div className="flex items-start justify-between gap-4 border-b border-white/50 px-6 py-5 dark:border-white/10">
              <div>
                <h2 className="text-xl font-bold text-slate-950 dark:text-white">{title}</h2>
                {subtitle ? <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{subtitle}</p> : null}
              </div>
              <Button variant="ghost" icon={FiX} onClick={onClose} aria-label="Close modal" className="px-3" />
            </div>
            <div className="p-6">{children}</div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}

function SectionTitle({ eyebrow, title, subtitle, action }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-3">
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.28em] text-civic-600 dark:text-civic-100">{eyebrow}</p>
        <h3 className="mt-2 text-lg font-bold text-slate-950 dark:text-white">{title}</h3>
        {subtitle ? <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{subtitle}</p> : null}
      </div>
      {action}
    </div>
  );
}

function LabelValue({ label, value }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white/80 p-4 dark:border-slate-800 dark:bg-slate-950/55">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">{label}</p>
      <p className="mt-2 text-sm font-semibold text-slate-950 dark:text-white">{value}</p>
    </div>
  );
}

function RequestStatusCard({ label, value, trend, icon: Icon, tone, accent }) {
  return (
    <motion.div
      className="group relative overflow-hidden rounded-3xl border border-white/70 bg-white/75 p-5 shadow-lg shadow-slate-900/5 backdrop-blur-xl dark:border-white/10 dark:bg-slate-950/70"
      whileHover={{ y: -3 }}
    >
      <div className={classNames("absolute inset-x-0 top-0 h-1.5", accent)} />
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{label}</p>
          <h3 className="mt-2 text-3xl font-black tracking-tight text-slate-950 dark:text-white">{value}</h3>
          <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-200">
            {trend.startsWith("+") ? <FiArrowUpRight className="h-4 w-4 text-safety" /> : <FiArrowDownRight className="h-4 w-4 text-alert" />}
            <span>{trend} this week</span>
          </div>
        </div>
        <div className={classNames("rounded-2xl p-3", tone)}>
          <Icon className="h-6 w-6" />
        </div>
      </div>
    </motion.div>
  );
}

function SelectField({ label, value, onChange, options }) {
  return (
    <label className="block text-sm font-semibold text-slate-600 dark:text-slate-300">
      <span>{label}</span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="mt-2 w-full rounded-2xl border border-slate-200 bg-white/85 px-4 py-3 text-sm text-slate-950 outline-none transition focus:border-civic-500 focus:ring-2 focus:ring-civic-500/20 dark:border-slate-800 dark:bg-slate-950/80 dark:text-white"
      >
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </label>
  );
}

function InputField({ label, value, onChange, placeholder, type = "text" }) {
  return (
    <label className="block text-sm font-semibold text-slate-600 dark:text-slate-300">
      <span>{label}</span>
      <input
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="mt-2 w-full rounded-2xl border border-slate-200 bg-white/85 px-4 py-3 text-sm text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-civic-500 focus:ring-2 focus:ring-civic-500/20 dark:border-slate-800 dark:bg-slate-950/80 dark:text-white"
      />
    </label>
  );
}

function TextAreaField({ label, value, onChange, placeholder }) {
  return (
    <label className="block text-sm font-semibold text-slate-600 dark:text-slate-300">
      <span>{label}</span>
      <textarea
        rows={4}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="mt-2 w-full rounded-2xl border border-slate-200 bg-white/85 px-4 py-3 text-sm text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-civic-500 focus:ring-2 focus:ring-civic-500/20 dark:border-slate-800 dark:bg-slate-950/80 dark:text-white"
      />
    </label>
  );
}

function ToggleField({ label, checked, onChange }) {
  return (
    <label className="flex items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white/85 px-4 py-3 text-sm font-semibold text-slate-600 dark:border-slate-800 dark:bg-slate-950/80 dark:text-slate-300">
      <span>{label}</span>
      <button
        type="button"
        onClick={() => onChange(!checked)}
        className={classNames(
          "relative h-7 w-12 rounded-full transition",
          checked ? "bg-civic-600" : "bg-slate-300 dark:bg-slate-700"
        )}
        aria-pressed={checked}
      >
        <span
          className={classNames(
            "absolute top-1 h-5 w-5 rounded-full bg-white shadow transition",
            checked ? "left-6" : "left-1"
          )}
        />
      </button>
    </label>
  );
}

function ActionButton({ children, variant = "secondary", ...props }) {
  return (
    <Button variant={variant} className="rounded-full px-4 py-2 text-xs font-bold uppercase tracking-wide" {...props}>
      {children}
    </Button>
  );
}

export default function ManageVisitRequests() {
  const { user } = useAuth();
  const { toasts, success: showSuccess, error: showError, removeToast } = useToast();
  
  const today = new Date();
  const todayIso = localIsoDate(today);
  
  const [requests, setRequests] = useState([]);
  const [todayVisits, setTodayVisits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchParent, setSearchParent] = useState("");
  const [searchRequest, setSearchRequest] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [riskFilter, setRiskFilter] = useState("All");
  const [dateFilter, setDateFilter] = useState("");

  // Drawer & Modal States
  const [activeModal, setActiveModal] = useState(null); // 'qr' | 'report' | 'calendar' | 'reschedule'
  const [visitTimerSeconds, setVisitTimerSeconds] = useState(1455); // 24m 15s mock timer
  const [timerRunning, setTimerRunning] = useState(false);

  // Post-Visit Report Form State
  const [postReport, setPostReport] = useState({
    parentBehaviour: "Exemplary",
    childComfort: "High",
    childEmotion: "Happy & Calm",
    meetingOutcome: "Successful - Approved for Adoption Step",
    recommendation: "Approved for Next Visit",
    followUpRequired: false,
    staffNotes: "Parent demonstrated great affection and caregiving readiness during the session.",
  });
  const [activeRequest, setActiveRequest] = useState(null);
  const [savedReport, setSavedReport] = useState(false);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, totalPages: 1 });
  
  const [feedback, setFeedback] = useState({
    parentBehaviour: "Excellent",
    childComfort: "Comfortable",
    meetingOutcome: "Suitable for Adoption",
    recommendation: "Approve Visit",
    staffNotes: ""
  });

  const [approveForm, setApproveForm] = useState({
    visitDate: todayIso,
    visitTime: "10:30",
    meetingRoom: "Conference Room A",
    staffMember: "Meera Nair",
    visitorLimit: "2",
    instructions: "Complete face verification and escort the family to the counselling room.",
    generateQr: true,
    notifyParent: true
  });

  const [rejectForm, setRejectForm] = useState({
    reason: "Incomplete Documents",
    comments: ""
  });

  const [rescheduleForm, setRescheduleForm] = useState({
    newDate: shiftDate(todayIso, 2),
    newTime: "11:00",
    reason: "Staff availability",
    notifyParent: true
  });

  const [documentsForm, setDocumentsForm] = useState({
    aadhaar: true,
    pan: true,
    incomeCertificate: true,
    marriageCertificate: false,
    addressProof: false,
    note: "Please submit the marked documents before the next slot can be confirmed."
  });

  useEffect(() => {
    loadRequests();
    loadTodayVisits();
  }, []);

  useEffect(() => {
    const delaySearch = setTimeout(() => {
      loadRequests();
    }, 300);
    return () => clearTimeout(delaySearch);
  }, [searchParent, searchRequest, statusFilter, riskFilter, dateFilter]);

  const loadRequests = async () => {
    try {
      setLoading(true);
      const params = {
        page: pagination.page,
        limit: pagination.limit,
      };
      
      if (searchParent) params.parentName = searchParent;
      if (searchRequest) params.search = searchRequest;
      if (statusFilter !== 'All') params.status = statusFilter.toUpperCase();
      if (riskFilter !== 'All') params.risk = riskFilter.toUpperCase();
      if (dateFilter) params.visitDate = dateFilter;

      const response = await visitRequestsService.getAll(params);
      const fetchedRequests = response.data || [];
      
      // Inject enriched operational mock data for safety operations dashboard if needed
      const enriched = fetchedRequests.map((r, i) => ({
        ...r,
        childName: r.childName || (i % 3 === 0 ? "Rahul Sharma" : i % 3 === 1 ? "Sneha Patel" : "Aarav Gupta"),
        visitId: r.requestId || `VIS-${1000 + i}`,
        parentPhoto: avatarDataUri(r.initials || "PR", "#1e40af", "#4f46e5"),
        verificationStatus: i % 4 === 0 ? "Pending" : "Verified",
        assignedStaff: r.assignedStaff || (i % 2 === 0 ? "Meera Nair" : "Ramesh Kumar"),
        meetingRoom: r.meetingRoom || (i % 2 === 0 ? "Room R-102" : "Conference Room B"),
        arrivalStatus: i === 0 ? "Checked In" : i === 1 ? "Waiting" : "En Route",
        priority: i % 3 === 0 ? "HIGH" : i % 3 === 1 ? "MEDIUM" : "LOW",
        timeSlot: r.visitTime || "10:30 AM - 11:30 AM",
      }));

      setRequests(enriched);
      if (response.pagination) {
        setPagination(response.pagination);
      }
    } catch (err) {
      showError(err.message || 'Failed to load visit requests');
      console.error('Error loading requests:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadTodayVisits = async () => {
    try {
      const visits = await visitRequestsService.getTodayVisits();
      setTodayVisits(visits || []);
    } catch (err) {
      console.error('Error loading today visits:', err);
    }
  };

  const filteredRequests = requests;

  const counts = {
    pending: requests.filter((request) => request.status === "PENDING").length,
    today: todayVisits.length,
    approved: requests.filter((request) => request.status === "APPROVED").length,
    rejected: requests.filter((request) => request.status === "REJECTED").length,
    completed: requests.filter((request) => request.status === "COMPLETED").length,
    highRisk: requests.filter((request) => request.riskLevel === "HIGH" || request.riskLevel === "CRITICAL").length
  };

  const riskData = {
    labels: ["Low", "Medium", "High"],
    datasets: [
      {
        data: [
          requests.filter((request) => request.riskLevel === "LOW").length,
          requests.filter((request) => request.riskLevel === "MEDIUM").length,
          requests.filter((request) => request.riskLevel === "HIGH" || request.riskLevel === "CRITICAL").length
        ],
        backgroundColor: ["#0f9f6e", "#f59e0b", "#dc2626"],
        borderWidth: 0
      }
    ]
  };

  const visitTrendData = {
    labels: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
    datasets: [
      {
        label: "Visits Reviewed",
        data: [12, 15, 17, 14, 21, 19, 24],
        borderColor: "#1c74d8",
        backgroundColor: "rgba(28, 116, 216, 0.14)",
        tension: 0.38,
        fill: true
      },
      {
        label: "Approved",
        data: [8, 10, 13, 11, 16, 15, 19],
        borderColor: "#7c3aed",
        backgroundColor: "rgba(124, 58, 237, 0.12)",
        tension: 0.38,
        fill: true
      }
    ]
  };

  const monthGrid = getMonthGrid(today, requests);
  const selectedRequest = (activeRequest && requests.find((request) => request.id === activeRequest.id)) || activeRequest || filteredRequests[0] || requests[0];

  const openDetails = (request) => {
    setActiveRequest(request);
    setActiveModal("details");
  };

  const openApprove = (request = selectedRequest) => {
    if (!request) return;
    setActiveRequest(request);
    const visitDate = formatIsoToYYYYMMDD(request.visitDate);
    const visitTime = formatTo24HourTime(request.visitTime);
    setApproveForm({
      visitDate,
      visitTime,
      meetingRoom: request.meetingRoom || "Room A",
      staffMember: request.assignedStaff || "Staff Administrator",
      visitorLimit: String(request.visitorsCount || 2),
      instructions: request.specialNotes || "Please bring original photo ID.",
      generateQr: true,
      notifyParent: true
    });
    setActiveModal("approve");
  };

  const openReject = (request = selectedRequest) => {
    if (!request) return;
    setActiveRequest(request);
    setRejectForm({
      reason: "Incomplete Documents",
      comments: ""
    });
    setActiveModal("reject");
  };

  const openReschedule = (request = selectedRequest) => {
    if (!request) return;
    setActiveRequest(request);
    const currentDate = formatIsoToYYYYMMDD(request.visitDate);
    const currentTime = formatTo24HourTime(request.visitTime);
    setRescheduleForm({
      newDate: currentDate,
      newTime: currentTime,
      reason: "Staff availability",
      notifyParent: true
    });
    setActiveModal("reschedule");
  };

  const openDocuments = (request = selectedRequest) => {
    setActiveRequest(request);
    setDocumentsForm({
      aadhaar: true,
      pan: true,
      incomeCertificate: true,
      marriageCertificate: false,
      addressProof: false,
      note: "Please submit the marked documents before the next slot can be confirmed."
    });
    setActiveModal("documents");
  };

  const activeVisit = useMemo(
    () => requests.find((r) => r.arrivalStatus === "Checked In") || requests[0],
    [requests]
  );

  const formatTimer = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  };

  const updateRequest = (requestId, patch) => {
    setRequests((current) =>
      current.map((request) =>
        request.requestId === requestId
          ? {
              ...request,
              ...patch
            }
          : request
      )
    );
  };

  const handleApprove = async () => {
    if (!selectedRequest) return;

    try {
      await visitRequestsService.approve(selectedRequest.id, {
        visitDate: approveForm.visitDate,
        visitTime: approveForm.visitTime,
        meetingRoom: approveForm.meetingRoom,
        assignedStaff: approveForm.staffMember,
        visitorLimit: parseInt(approveForm.visitorLimit, 10),
        instructions: approveForm.instructions,
        generateQr: approveForm.generateQr,
        notifyParent: approveForm.notifyParent,
      });
      
      showSuccess('Visit request approved successfully');
      setActiveModal(null);
      loadRequests();
      loadTodayVisits();
    } catch (err) {
      showError(err.message || 'Failed to approve visit request');
      console.error('Error approving request:', err);
    }
  };

  const handleReject = async () => {
    if (!selectedRequest) return;

    try {
      await visitRequestsService.reject(selectedRequest.id, {
        reason: rejectForm.reason,
        comments: rejectForm.comments,
      });
      
      showSuccess('Visit request rejected');
      setActiveModal(null);
      loadRequests();
    } catch (err) {
      showError(err.message || 'Failed to reject visit request');
      console.error('Error rejecting request:', err);
    }
  };

  const handleReschedule = async () => {
    if (!selectedRequest) return;

    try {
      await visitRequestsService.reschedule(selectedRequest.id, {
        newDate: rescheduleForm.newDate,
        newTime: rescheduleForm.newTime,
        reason: rescheduleForm.reason,
        notifyParent: rescheduleForm.notifyParent,
      });
      
      showSuccess('Visit rescheduled successfully');
      setActiveModal(null);
      loadRequests();
    } catch (err) {
      showError(err.message || 'Failed to reschedule visit');
      console.error('Error rescheduling request:', err);
    }
  };

  const handleCheckIn = async (visit) => {
    try {
      await visitRequestsService.checkIn(visit.id);
      showSuccess(`Check-in confirmed for ${visit.parentName}`);
      loadRequests();
      loadTodayVisits();
    } catch (err) {
      showError(err.message || 'Failed to check in visit');
    }
  };

  const handleNoShow = async (visit) => {
    try {
      await visitRequestsService.noShow(visit.id, { reason: 'Parent did not arrive for visit slot' });
      showSuccess(`Visit marked as No-Show for ${visit.parentName}`);
      loadRequests();
      loadTodayVisits();
    } catch (err) {
      showError(err.message || 'Failed to mark visit as no-show');
    }
  };

  const handleRequestDocs = async () => {
    if (!selectedRequest) return;

    try {
      const requiredDocs = [];
      if (documentsForm.aadhaar) requiredDocs.push('AADHAAR');
      if (documentsForm.pan) requiredDocs.push('PAN');
      if (documentsForm.incomeCertificate) requiredDocs.push('INCOME_CERTIFICATE');
      if (documentsForm.marriageCertificate) requiredDocs.push('MARRIAGE_CERTIFICATE');
      if (documentsForm.addressProof) requiredDocs.push('ADDRESS_PROOF');

      await visitRequestsService.requestDocuments(selectedRequest.id, {
        requiredDocuments: requiredDocs,
        note: documentsForm.note,
      });
      
      showSuccess('Document request sent to parent');
      setActiveModal(null);
      loadRequests();
    } catch (err) {
      showError(err.message || 'Failed to request documents');
      console.error('Error requesting documents:', err);
    }
  };

  const resetFilters = () => {
    setSearchParent("");
    setSearchRequest("");
    setStatusFilter("All");
    setRiskFilter("All");
    setDateFilter("");
  };

  if (loading && requests.length === 0) {
    return <PageSkeleton />;
  }

  return (
    <div className="relative space-y-8 overflow-hidden pb-10">
      <ToastContainer toasts={toasts} onRemove={removeToast} />
      <div className="absolute -right-20 top-10 h-72 w-72 rounded-full bg-civic-500/15 blur-3xl" />
      <div className="absolute left-0 top-40 h-64 w-64 rounded-full bg-violet-500/10 blur-3xl" />

      <div className="relative space-y-6">
        <Breadcrumb items={["Orphanage", "Manage Visit Requests"]} />

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="glass-panel relative overflow-hidden rounded-3xl border border-white/60 p-6 dark:border-white/10"
          style={{ boxShadow: "0 1px 4px rgba(15,23,42,0.06)" }}
        >
          <div className="absolute inset-0 bg-gradient-to-br from-civic-500/10 via-transparent to-violet-500/10" />
          <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <p className="text-xs font-bold uppercase tracking-[0.32em] text-civic-600 dark:text-civic-100">
                Government Visit Control
              </p>
              <h1 className="mt-3 text-3xl font-black tracking-tight text-slate-950 dark:text-white md:text-4xl">
                Manage Parent Visit Requests
              </h1>
              <p className="mt-4 max-w-2xl text-sm leading-6 text-slate-600 dark:text-slate-300 md:text-base">
                Review, verify and manage adoption visit requests submitted by parents with a secure, AI-assisted
                workflow designed for a modern child safety dashboard.
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <Button icon={FiDownload} variant="secondary" className="rounded-full">
                Export Report
              </Button>
              <Button icon={FiRefreshCw} className="rounded-full">
                Sync Live Queue
              </Button>
            </div>
          </div>
        </motion.div>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          <RequestStatusCard
            label="Pending Requests"
            value={counts.pending}
            trend="+14%"
            icon={FiClock}
            tone="bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-200"
            accent="bg-gradient-to-r from-amber-400 to-saffron"
          />
          <RequestStatusCard
            label="Today's Visits"
            value={counts.today}
            trend="+6%"
            icon={FiCalendar}
            tone="bg-civic-100 text-civic-700 dark:bg-civic-500/15 dark:text-civic-100"
            accent="bg-gradient-to-r from-civic-500 to-violet-500"
          />
          <RequestStatusCard
            label="Approved Visits"
            value={counts.approved}
            trend="+18%"
            icon={FiCheckCircle}
            tone="bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-200"
            accent="bg-gradient-to-r from-emerald-400 to-safety"
          />
          <RequestStatusCard
            label="Rejected Requests"
            value={counts.rejected}
            trend="-3%"
            icon={FiSlash}
            tone="bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-200"
            accent="bg-gradient-to-r from-rose-400 to-alert"
          />
          <RequestStatusCard
            label="Completed Visits"
            value={counts.completed}
            trend="+10%"
            icon={FiCheck}
            tone="bg-violet-100 text-violet-700 dark:bg-violet-500/15 dark:text-violet-100"
            accent="bg-gradient-to-r from-violet-500 to-civic-500"
          />
          <RequestStatusCard
            label="High Risk Requests"
            value={counts.highRisk}
            trend="-5%"
            icon={FiShield}
            tone="bg-slate-100 text-slate-700 dark:bg-slate-500/15 dark:text-slate-200"
            accent="bg-gradient-to-r from-slate-500 to-civic-500"
          />
        </div>

        <div className="grid gap-6 xl:grid-cols-[1.7fr_1fr]">
          <LineChartCard title="Visit Review Trend" data={visitTrendData} />
          <DoughnutChartCard title="AI Risk Distribution" data={riskData} />
        </div>

        <Card>
          <SectionTitle
            eyebrow="Filters"
            title="Refine the request queue"
            subtitle="Search by parent or request ID, then narrow the review queue by approval state, AI risk, or a specific visit date."
            action={
              <Button variant="ghost" icon={FiFilter} onClick={resetFilters} className="rounded-full px-4 py-2">
                Reset Filters
              </Button>
            }
          />

          <div className="mt-5 grid gap-4 lg:grid-cols-5">
            <InputField
              label="Search Parent"
              value={searchParent}
              onChange={setSearchParent}
              placeholder="Parent name"
            />
            <InputField
              label="Search by Request ID"
              value={searchRequest}
              onChange={setSearchRequest}
              placeholder="Request ID"
            />
            <SelectField
              label="Status Filter"
              value={statusFilter}
              onChange={setStatusFilter}
              options={["All", "Pending", "Approved", "Rejected", "Completed", "Rescheduled"]}
            />
            <SelectField label="AI Risk Filter" value={riskFilter} onChange={setRiskFilter} options={["All", "Low", "Medium", "High"]} />
            <InputField label="Date Picker" type="date" value={dateFilter} onChange={setDateFilter} />
          </div>
        </Card>

        <Card>
          <SectionTitle
            eyebrow="Visit Queue"
            title="Visit request review table"
            subtitle="Each row contains the parent profile summary, trust score, risk level, current state, and direct moderation actions."
          />

          <div className="mt-6 overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200 text-sm dark:divide-slate-800">
                <thead className="bg-slate-50/95 dark:bg-slate-950/55">
                  <tr>
                    {["Parent Photo", "Parent Name", "Request ID", "Visit Date", "Purpose", "AI Trust Score", "Risk Level", "Status", "Actions"].map(
                      (column) => (
                        <th
                          key={column}
                          className="whitespace-nowrap px-4 py-3 text-left text-xs font-bold uppercase tracking-[0.22em] text-slate-500 dark:text-slate-400"
                        >
                          {column}
                        </th>
                      )
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white/70 dark:divide-slate-800 dark:bg-slate-950/40">
                  {filteredRequests.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="py-12 text-center text-slate-500 dark:text-slate-400">
                        <div className="flex flex-col items-center justify-center space-y-2">
                          <FiCalendar className="h-10 w-10 text-slate-400" />
                          <p className="text-base font-bold text-slate-700 dark:text-slate-200">
                            No visit requests have been received yet.
                          </p>
                          <p className="text-xs text-slate-500 dark:text-slate-400">
                            New visit requests submitted by verified parents will appear here automatically.
                          </p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filteredRequests.map((request) => (
                      <tr key={request.requestId} className="transition hover:bg-civic-50/60 dark:hover:bg-slate-900/70">
                        <td className="px-4 py-4">
                          <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-2xl border border-white/70 bg-slate-100 dark:border-white/10 dark:bg-slate-800">
                            <img
                              src={avatarDataUri(request.initials, "#1c74d8", "#7c3aed")}
                              alt={`${request.parentName} avatar`}
                              className="h-full w-full object-cover"
                            />
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <div className="space-y-1">
                            <p className="font-bold text-slate-950 dark:text-white">{request.parentName}</p>
                            <p className="text-xs text-slate-500 dark:text-slate-400">{request.occupation}</p>
                          </div>
                        </td>
                        <td className="whitespace-nowrap px-4 py-4 font-semibold text-slate-700 dark:text-slate-200">{request.requestId}</td>
                        <td className="whitespace-nowrap px-4 py-4 text-slate-700 dark:text-slate-200">
                          <div className="space-y-1">
                            <p className="font-semibold">{formatDisplayDate(request.visitDate)}</p>
                            <p className="text-xs text-slate-500 dark:text-slate-400">{formatClockTime(request.visitTime)}</p>
                          </div>
                        </td>
                        <td className="px-4 py-4 text-slate-700 dark:text-slate-200">{request.purpose}</td>
                        <td className="whitespace-nowrap px-4 py-4">
                          <div className="inline-flex items-center gap-2 rounded-full bg-civic-100 px-3 py-1.5 text-xs font-bold text-civic-700 dark:bg-civic-500/15 dark:text-civic-100">
                            <FiStar className="h-3.5 w-3.5" />
                            {request.trustScore}%
                          </div>
                        </td>
                        <td className="whitespace-nowrap px-4 py-4">
                          <span className={classNames("rounded-full px-3 py-1.5 text-xs font-bold", riskTone(request.risk))}>{request.risk}</span>
                        </td>
                        <td className="whitespace-nowrap px-4 py-4">
                          <span className={classNames("rounded-full px-3 py-1.5 text-xs font-bold", statusTone(request.status))}>
                            {request.status}
                          </span>
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex flex-wrap gap-2">
                            <ActionButton variant="secondary" icon={FiEye} onClick={() => openDetails(request)}>
                              View
                            </ActionButton>
                            <ActionButton variant="primary" icon={FiCheckCircle} onClick={() => openApprove(request)}>
                              Approve
                            </ActionButton>
                            <ActionButton variant="danger" icon={FiSlash} onClick={() => openReject(request)}>
                              Reject
                            </ActionButton>
                            <ActionButton variant="secondary" icon={FiCalendar} onClick={() => openReschedule(request)}>
                              Reschedule
                            </ActionButton>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </Card>

        <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <Card>
            <SectionTitle
              eyebrow="Today's Visits"
              title="Arrival and check-in control"
              subtitle="Track the parents expected today, the assigned staff member, QR status, and live check-in progress."
            />

            <div className="mt-5 grid gap-4">
              {todayVisits.map((visit) => (
                <motion.div
                  key={visit.requestId}
                  className="rounded-3xl border border-slate-200 bg-white/80 p-4 dark:border-slate-800 dark:bg-slate-950/60"
                  whileHover={{ y: -2 }}
                >
                  <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div className="flex items-center gap-4">
                      <div className="h-14 w-14 overflow-hidden rounded-2xl">
                        <img
                          src={avatarDataUri(visit.initials, "#155fba", "#7c3aed")}
                          alt={`${visit.parentName} avatar`}
                          className="h-full w-full object-cover"
                        />
                      </div>
                      <div>
                        <p className="font-bold text-slate-950 dark:text-white">{visit.parentName}</p>
                        <p className="text-sm text-slate-500 dark:text-slate-400">
                          {formatClockTime(visit.arrivalTime)} · {visit.meetingRoom}
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <span className={classNames("rounded-full px-3 py-1.5 text-xs font-bold", statusTone(visit.status))}>{visit.status}</span>
                      <span className={classNames("rounded-full px-3 py-1.5 text-xs font-bold", riskTone(visit.risk))}>{visit.risk} Risk</span>
                    </div>
                  </div>

                  <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                    <LabelValue label="Staff Assigned" value={visit.assignedStaff} />
                    <LabelValue label="QR Status" value={visit.qrStatus} />
                    <LabelValue label="Face Match" value={`${visit.faceMatch}%`} />
                    <LabelValue
                      label="Check-In / Check-Out"
                      value={`${formatClockTime(visit.checkIn)} / ${formatClockTime(visit.checkOut)}`}
                    />
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                    <ActionButton variant="primary" icon={FiCheckCircle} onClick={() => handleCheckIn(visit)}>
                      Confirm Check-In
                    </ActionButton>
                    <ActionButton variant="danger" icon={FiSlash} onClick={() => handleNoShow(visit)}>
                      Mark No-Show
                    </ActionButton>
                  </div>
                </motion.div>
              ))}
            </div>
          </Card>

          <Card>
            <SectionTitle
              eyebrow="Notifications"
              title="Recent updates"
              subtitle="Keep an eye on the latest request activity and high-risk alerts."
            />

            <div className="mt-5 space-y-3">
              {notifications.map((item) => {
                const Icon = item.icon;

                return (
                  <div
                    key={item.title}
                    className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-white/80 p-4 dark:border-slate-800 dark:bg-slate-950/60"
                  >
                    <div className="rounded-2xl bg-civic-100 p-3 text-civic-700 dark:bg-civic-500/15 dark:text-civic-100">
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <p className="font-bold text-slate-950 dark:text-white">{item.title}</p>
                        <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">{item.time}</span>
                      </div>
                      <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">{item.detail}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        </div>

        <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
          <Card>
            <SectionTitle
              eyebrow="Visit Calendar"
              title="Monthly schedule overview"
              subtitle="Approved, pending, rejected, and completed visits are color-coded for quick operational planning."
            />

            <div className="mt-5 overflow-hidden rounded-3xl border border-slate-200 dark:border-slate-800">
              <div className="grid grid-cols-7 bg-slate-50/95 text-center text-xs font-bold uppercase tracking-[0.22em] text-slate-500 dark:bg-slate-950/55 dark:text-slate-400">
                {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
                  <div key={day} className="px-2 py-3">
                    {day}
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-7 divide-x divide-y divide-slate-200 dark:divide-slate-800">
                {monthGrid.map((cell, index) => (
                  <div key={`${cell?.iso || "empty"}-${index}`} className="min-h-28 bg-white/70 p-3 dark:bg-slate-950/50">
                    {cell ? (
                      <>
                        <div className="flex items-start justify-between gap-2">
                          <span className="text-sm font-bold text-slate-950 dark:text-white">{cell.day}</span>
                          <span className="h-2.5 w-2.5 rounded-full bg-slate-300 dark:bg-slate-600" />
                        </div>
                        <div className="mt-3 space-y-2">
                          {cell.events.slice(0, 2).map((event) => {
                            const badgeColor =
                              event.status === "Approved"
                                ? "bg-emerald-500"
                                : event.status === "Rejected"
                                  ? "bg-rose-500"
                                  : event.status === "Completed"
                                    ? "bg-civic-500"
                                    : "bg-amber-500";

                            return (
                              <div
                                key={event.requestId}
                                className={classNames("rounded-xl px-2.5 py-2 text-xs font-semibold text-white", badgeColor)}
                              >
                                <p>{event.parentName}</p>
                                <p className="mt-0.5 opacity-90">{event.status}</p>
                              </div>
                            );
                          })}
                          {cell.events.length > 2 ? (
                            <div className="rounded-xl bg-slate-100 px-2.5 py-2 text-xs font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-200">
                              +{cell.events.length - 2} more
                            </div>
                          ) : null}
                        </div>
                      </>
                    ) : null}
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              {calendarLegend.map((item) => (
                <span
                  key={item.label}
                  className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white/80 px-3 py-1.5 text-xs font-semibold text-slate-600 dark:border-slate-800 dark:bg-slate-950/70 dark:text-slate-300"
                >
                  <span className={classNames("h-2.5 w-2.5 rounded-full", item.color)} />
                  {item.label}
                </span>
              ))}
            </div>
          </Card>

          <Card>
            <SectionTitle
              eyebrow="Post Visit Feedback"
              title="Complete visit review"
              subtitle="Capture staff assessment after the visit closes and store a report for the adoption review team."
            />

            <form
              className="mt-5 space-y-4"
              onSubmit={(event) => {
                event.preventDefault();
                setSavedReport(true);
              }}
            >
              <SelectField
                label="Parent Behaviour"
                value={feedback.parentBehaviour}
                onChange={(value) => setFeedback((current) => ({ ...current, parentBehaviour: value }))}
                options={feedbackOptions.parentBehaviour}
              />
              <SelectField
                label="Child Comfort Level"
                value={feedback.childComfort}
                onChange={(value) => setFeedback((current) => ({ ...current, childComfort: value }))}
                options={feedbackOptions.childComfort}
              />
              <SelectField
                label="Meeting Outcome"
                value={feedback.meetingOutcome}
                onChange={(value) => setFeedback((current) => ({ ...current, meetingOutcome: value }))}
                options={feedbackOptions.meetingOutcome}
              />
              <SelectField
                label="Recommendation"
                value={feedback.recommendation}
                onChange={(value) => setFeedback((current) => ({ ...current, recommendation: value }))}
                options={feedbackOptions.recommendation}
              />
              <TextAreaField
                label="Staff Notes"
                value={feedback.staffNotes}
                onChange={(value) => setFeedback((current) => ({ ...current, staffNotes: value }))}
                placeholder="Add observations about the parent visit, child reaction, and any follow-up steps."
              />

              <Button type="submit" className="w-full rounded-full">
                Save Report
              </Button>

              {savedReport ? (
                <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-200">
                  Feedback report saved locally for this session.
                </div>
              ) : null}
            </form>
          </Card>
        </div>
      </div>

      <ModalShell
        open={activeModal === "details"}
        title="Visit Request Details"
        subtitle={`${selectedRequest?.parentName || ""} · ${selectedRequest?.requestId || ""}`}
        onClose={() => setActiveModal(null)}
        widthClass="max-w-6xl"
      >
        {selectedRequest ? (
          <div className="space-y-6">
            <div className="grid gap-4 lg:grid-cols-[0.95fr_1.05fr]">
              <div className="rounded-3xl border border-slate-200 bg-white/80 p-5 dark:border-slate-800 dark:bg-slate-950/60">
                <div className="flex items-center gap-4">
                  <div className="h-20 w-20 overflow-hidden rounded-3xl">
                    <img
                      src={avatarDataUri(selectedRequest.initials, "#1c74d8", "#7c3aed")}
                      alt={`${selectedRequest.parentName} avatar`}
                      className="h-full w-full object-cover"
                    />
                  </div>
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.26em] text-civic-600 dark:text-civic-100">Parent Information</p>
                    <h3 className="mt-2 text-2xl font-black text-slate-950 dark:text-white">{selectedRequest.parentName}</h3>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <span className={classNames("rounded-full px-3 py-1.5 text-xs font-bold", statusTone(selectedRequest.status))}>
                        {selectedRequest.status}
                      </span>
                      <span className={classNames("rounded-full px-3 py-1.5 text-xs font-bold", riskTone(selectedRequest.risk))}>
                        {selectedRequest.risk} Risk
                      </span>
                    </div>
                  </div>
                </div>

                <div className="mt-5 grid gap-3 sm:grid-cols-2">
                  <LabelValue label="Age" value={`${selectedRequest.age} years`} />
                  <LabelValue label="Occupation" value={selectedRequest.occupation} />
                  <LabelValue label="Phone" value={selectedRequest.phone} />
                  <LabelValue label="Email" value={selectedRequest.email} />
                  <LabelValue label="Address" value={selectedRequest.address} />
                  <LabelValue label="Family Members" value={selectedRequest.familyMembers} />
                  <LabelValue label="Income" value={selectedRequest.income} />
                  <LabelValue label="Request ID" value={selectedRequest.requestId} />
                </div>
              </div>

              <div className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <LabelValue label="KYC" value={selectedRequest.verification.kyc} />
                  <LabelValue label="Police Verification" value={selectedRequest.verification.police} />
                  <LabelValue label="Face Verification" value={selectedRequest.verification.face} />
                  <LabelValue label="Background Check" value={selectedRequest.verification.background} />
                  <LabelValue label="Documents" value={selectedRequest.verification.documents} />
                  <LabelValue label="Recommended Action" value={selectedRequest.recommendation} />
                </div>

                <div className="rounded-3xl border border-slate-200 bg-white/80 p-5 dark:border-slate-800 dark:bg-slate-950/60">
                  <SectionTitle eyebrow="AI Analysis" title="Risk and readiness profile" />
                  <div className="mt-5 grid gap-4 sm:grid-cols-2">
                    <LabelValue label="Trust Score" value={`${selectedRequest.trustScore}%`} />
                    <LabelValue label="Face Match" value={`${selectedRequest.faceMatch}%`} />
                    <LabelValue label="Risk Level" value={selectedRequest.risk} />
                    <LabelValue label="Document Authenticity" value={selectedRequest.documentAuthenticity} />
                    <LabelValue label="Behaviour Prediction" value={selectedRequest.behaviourPrediction} />
                    <LabelValue label="Adoption Readiness" value={selectedRequest.adoptionReadiness} />
                  </div>
                  <div className="mt-4 rounded-2xl bg-gradient-to-r from-civic-600 to-violet-600 p-4 text-white">
                    <p className="text-xs font-bold uppercase tracking-[0.28em] text-white/80">Recommendation</p>
                    <p className="mt-2 text-lg font-bold">{selectedRequest.recommendation}</p>
                    <p className="mt-1 text-sm text-white/80">{selectedRequest.reason}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
              <div className="rounded-3xl border border-slate-200 bg-white/80 p-5 dark:border-slate-800 dark:bg-slate-950/60">
                <SectionTitle eyebrow="Visit Details" title="Requested slot and instructions" />
                <div className="mt-5 grid gap-3 sm:grid-cols-2">
                  <LabelValue label="Requested Date" value={formatDisplayDate(selectedRequest.visitDate)} />
                  <LabelValue label="Requested Time" value={selectedRequest.visitTime} />
                  <LabelValue label="Purpose" value={selectedRequest.purpose} />
                  <LabelValue label="Visitors Count" value={`${selectedRequest.visitorsCount}`} />
                  <LabelValue label="Expected Adoption Timeline" value={selectedRequest.timeline} />
                  <LabelValue label="Meeting Room" value={selectedRequest.meetingRoom} />
                </div>
                <div className="mt-3 rounded-2xl border border-slate-200 bg-white/70 p-4 dark:border-slate-800 dark:bg-slate-950/70">
                  <p className="text-xs font-bold uppercase tracking-[0.22em] text-slate-500 dark:text-slate-400">Special Notes</p>
                  <p className="mt-2 text-sm leading-6 text-slate-700 dark:text-slate-200">{selectedRequest.specialNotes}</p>
                </div>
              </div>

              <div className="rounded-3xl border border-slate-200 bg-white/80 p-5 dark:border-slate-800 dark:bg-slate-950/60">
                <SectionTitle eyebrow="Documents" title="Supporting files and evidence" />
                <div className="mt-5 grid gap-3 sm:grid-cols-2">
                  {selectedRequest.documents.map((document) => (
                    <div
                      key={document}
                      className="rounded-2xl border border-slate-200 bg-white/85 p-4 dark:border-slate-800 dark:bg-slate-950/70"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div className="rounded-2xl bg-civic-100 p-3 text-civic-700 dark:bg-civic-500/15 dark:text-civic-100">
                            <FiFileText className="h-5 w-5" />
                          </div>
                          <div>
                            <p className="font-bold text-slate-950 dark:text-white">{document}</p>
                            <p className="text-xs text-slate-500 dark:text-slate-400">Verified upload</p>
                          </div>
                        </div>
                        <Button variant="ghost" icon={FiEye} className="rounded-full px-3 py-2 text-xs font-bold">
                          View
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              <ActionButton variant="primary" icon={FiCheckCircle} onClick={() => openApprove(selectedRequest)}>
                Approve Visit
              </ActionButton>
              <ActionButton variant="danger" icon={FiSlash} onClick={() => openReject(selectedRequest)}>
                Reject Visit
              </ActionButton>
              <ActionButton variant="secondary" icon={FiFileText} onClick={() => openDocuments(selectedRequest)}>
                Request More Documents
              </ActionButton>
              <ActionButton variant="secondary" icon={FiCalendar} onClick={() => openReschedule(selectedRequest)}>
                Reschedule
              </ActionButton>
            </div>
          </div>
        ) : null}
      </ModalShell>

      <ModalShell
        open={activeModal === "approve"}
        title="Approve Visit"
        subtitle="Confirm the visit slot, room assignment, and visitor controls."
        onClose={() => setActiveModal(null)}
        widthClass="max-w-4xl"
      >
        <div className="grid gap-4 md:grid-cols-2">
          <InputField label="Visit Date" type="date" value={approveForm.visitDate} onChange={(value) => setApproveForm((current) => ({ ...current, visitDate: value }))} />
          <InputField label="Visit Time" type="time" value={approveForm.visitTime} onChange={(value) => setApproveForm((current) => ({ ...current, visitTime: value }))} />
          <InputField
            label="Meeting Room"
            value={approveForm.meetingRoom}
            onChange={(value) => setApproveForm((current) => ({ ...current, meetingRoom: value }))}
          />
          <InputField
            label="Assign Staff Member"
            value={approveForm.staffMember}
            onChange={(value) => setApproveForm((current) => ({ ...current, staffMember: value }))}
          />
          <InputField
            label="Visitor Limit"
            type="number"
            value={approveForm.visitorLimit}
            onChange={(value) => setApproveForm((current) => ({ ...current, visitorLimit: value }))}
          />
          <TextAreaField
            label="Instructions"
            value={approveForm.instructions}
            onChange={(value) => setApproveForm((current) => ({ ...current, instructions: value }))}
            placeholder="Add entry instructions, staff reminders, or counseling notes."
          />
        </div>
        <div className="mt-4 space-y-3">
          <ToggleField label="Generate QR Pass" checked={approveForm.generateQr} onChange={(value) => setApproveForm((current) => ({ ...current, generateQr: value }))} />
          <label className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white/85 px-4 py-3 text-sm font-semibold text-slate-600 dark:border-slate-800 dark:bg-slate-950/80 dark:text-slate-300">
            <input
              type="checkbox"
              checked={approveForm.notifyParent}
              onChange={(event) => setApproveForm((current) => ({ ...current, notifyParent: event.target.checked }))}
              className="h-4 w-4 rounded border-slate-300 text-civic-600"
            />
            Notify Parent
          </label>
        </div>
        <div className="mt-6 flex flex-wrap gap-3">
          <ActionButton variant="primary" icon={FiCheckCircle} onClick={handleApprove}>
            Approve Button
          </ActionButton>
          <ActionButton variant="secondary" icon={FiX} onClick={() => setActiveModal(null)}>
            Cancel
          </ActionButton>
        </div>
      </ModalShell>

      <ModalShell
        open={activeModal === "reject"}
        title="Reject Visit"
        subtitle="Record the moderation reason and add any follow-up comments."
        onClose={() => setActiveModal(null)}
        widthClass="max-w-3xl"
      >
        <div className="grid gap-4">
          <SelectField
            label="Reason Dropdown"
            value={rejectForm.reason}
            onChange={(value) => setRejectForm((current) => ({ ...current, reason: value }))}
            options={["Incomplete Documents", "Failed Verification", "High Risk", "Suspicious Behaviour", "Other"]}
          />
          <TextAreaField
            label="Comments"
            value={rejectForm.comments}
            onChange={(value) => setRejectForm((current) => ({ ...current, comments: value }))}
            placeholder="Explain the rejection decision or next steps for the parent."
          />
        </div>
        <div className="mt-6 flex flex-wrap gap-3">
          <ActionButton variant="danger" icon={FiSlash} onClick={handleReject}>
            Reject Button
          </ActionButton>
          <ActionButton variant="secondary" icon={FiX} onClick={() => setActiveModal(null)}>
            Cancel
          </ActionButton>
        </div>
      </ModalShell>

      <ModalShell
        open={activeModal === "reschedule"}
        title="Reschedule Visit"
        subtitle="Move the request to a new date and inform the parent automatically."
        onClose={() => setActiveModal(null)}
        widthClass="max-w-3xl"
      >
        <div className="grid gap-4 md:grid-cols-2">
          <InputField
            label="New Date"
            type="date"
            value={rescheduleForm.newDate}
            onChange={(value) => setRescheduleForm((current) => ({ ...current, newDate: value }))}
          />
          <InputField
            label="New Time"
            type="time"
            value={rescheduleForm.newTime}
            onChange={(value) => setRescheduleForm((current) => ({ ...current, newTime: value }))}
          />
          <SelectField
            label="Reason"
            value={rescheduleForm.reason}
            onChange={(value) => setRescheduleForm((current) => ({ ...current, reason: value }))}
            options={["Staff availability", "Parent request", "Room maintenance", "Verification delay"]}
          />
        </div>
        <label className="mt-4 flex items-center gap-3 rounded-2xl border border-slate-200 bg-white/85 px-4 py-3 text-sm font-semibold text-slate-600 dark:border-slate-800 dark:bg-slate-950/80 dark:text-slate-300">
          <input
            type="checkbox"
            checked={rescheduleForm.notifyParent}
            onChange={(event) => setRescheduleForm((current) => ({ ...current, notifyParent: event.target.checked }))}
            className="h-4 w-4 rounded border-slate-300 text-civic-600"
          />
          Notify Parent
        </label>
        <div className="mt-6 flex flex-wrap gap-3">
          <ActionButton variant="primary" icon={FiCalendar} onClick={handleReschedule}>
            Save Button
          </ActionButton>
          <ActionButton variant="secondary" icon={FiX} onClick={() => setActiveModal(null)}>
            Cancel
          </ActionButton>
        </div>
      </ModalShell>

      <ModalShell
        open={activeModal === "documents"}
        title="Request More Documents"
        subtitle="Send a follow-up request for the missing items flagged in the review."
        onClose={() => setActiveModal(null)}
        widthClass="max-w-3xl"
      >
        <div className="grid gap-3 md:grid-cols-2">
          <label className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white/85 px-4 py-3 text-sm font-semibold text-slate-600 dark:border-slate-800 dark:bg-slate-950/80 dark:text-slate-300">
            <input
              type="checkbox"
              checked={documentsForm.aadhaar}
              onChange={(event) => setDocumentsForm((current) => ({ ...current, aadhaar: event.target.checked }))}
              className="h-4 w-4 rounded border-slate-300 text-civic-600"
            />
            Aadhaar
          </label>
          <label className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white/85 px-4 py-3 text-sm font-semibold text-slate-600 dark:border-slate-800 dark:bg-slate-950/80 dark:text-slate-300">
            <input
              type="checkbox"
              checked={documentsForm.pan}
              onChange={(event) => setDocumentsForm((current) => ({ ...current, pan: event.target.checked }))}
              className="h-4 w-4 rounded border-slate-300 text-civic-600"
            />
            PAN
          </label>
          <label className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white/85 px-4 py-3 text-sm font-semibold text-slate-600 dark:border-slate-800 dark:bg-slate-950/80 dark:text-slate-300">
            <input
              type="checkbox"
              checked={documentsForm.incomeCertificate}
              onChange={(event) => setDocumentsForm((current) => ({ ...current, incomeCertificate: event.target.checked }))}
              className="h-4 w-4 rounded border-slate-300 text-civic-600"
            />
            Income Certificate
          </label>
          <label className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white/85 px-4 py-3 text-sm font-semibold text-slate-600 dark:border-slate-800 dark:bg-slate-950/80 dark:text-slate-300">
            <input
              type="checkbox"
              checked={documentsForm.marriageCertificate}
              onChange={(event) => setDocumentsForm((current) => ({ ...current, marriageCertificate: event.target.checked }))}
              className="h-4 w-4 rounded border-slate-300 text-civic-600"
            />
            Marriage Certificate
          </label>
          <label className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white/85 px-4 py-3 text-sm font-semibold text-slate-600 dark:border-slate-800 dark:bg-slate-950/80 dark:text-slate-300">
            <input
              type="checkbox"
              checked={documentsForm.addressProof}
              onChange={(event) => setDocumentsForm((current) => ({ ...current, addressProof: event.target.checked }))}
              className="h-4 w-4 rounded border-slate-300 text-civic-600"
            />
            Address Proof
          </label>
        </div>
        <TextAreaField
          label="Notes"
          value={documentsForm.note}
          onChange={(value) => setDocumentsForm((current) => ({ ...current, note: value }))}
          placeholder="Write the follow-up note for the parent."
        />
        <div className="mt-6 flex flex-wrap gap-3">
          <ActionButton variant="primary" icon={FiMessageSquare} onClick={handleRequestDocs}>
            Request More Documents
          </ActionButton>
          <ActionButton variant="secondary" icon={FiX} onClick={() => setActiveModal(null)}>
            Cancel
          </ActionButton>
        </div>
      </ModalShell>
    </div>
  );
}
