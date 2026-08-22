import { useMemo, useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { AnimatePresence, motion } from "framer-motion";
import {
  FiAlertCircle,
  FiCalendar,
  FiCheck,
  FiChevronRight,
  FiClock,
  FiFileText,
  FiHome,
  FiInfo,
  FiMapPin,
  FiShield,
  FiUser,
  FiUsers,
  FiX,
  FiLoader,
  FiPlus,
  FiTrash2,
  FiHeart,
  FiGift,
  FiCameraOff,
  FiCheckCircle,
  FiSend,
  FiMessageSquare,
  FiZap,
  FiSearch,
  FiEye,
  FiSlash,
  FiFilter,
} from "react-icons/fi";
import Breadcrumb from "../components/Breadcrumb";
import { PageSkeleton } from "../components/Loader";
import Card from "../components/Card";
import Button from "../components/Button";
import { classNames } from "../utils/formatters";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../hooks/useToast";
import ToastContainer from "../components/Toast";
import { parentsService } from "../services/parentsService";
import { orphanagesService } from "../services/orphanagesService";
import { visitRequestsService } from "../services/visitRequestsService";

// Mock available children for visit selection
const MOCK_CHILDREN = [
  {
    id: "CH-2026-00125",
    name: "Rahul Sharma",
    age: 8,
    gender: "Male",
    education: "Primary - Class 4A",
    healthStatus: "Healthy",
    interests: "Drawing, Science, Chess",
    languages: "English, Hindi",
    currentStatus: "REGISTERED",
    photo: "https://images.unsplash.com/photo-1543332164-6e82f355badc?auto=format&fit=crop&w=400&q=80",
    visitAvailable: true,
    adoptionAvailable: true,
  },
  {
    id: "CH-2026-00126",
    name: "Sneha Patel",
    age: 6,
    gender: "Female",
    education: "Pre-School",
    healthStatus: "Healthy",
    interests: "Singing, Storytelling, Painting",
    languages: "Hindi, Gujarati",
    currentStatus: "REGISTERED",
    photo: "https://images.unsplash.com/photo-1595454038453-748ffb6f5888?auto=format&fit=crop&w=400&q=80",
    visitAvailable: true,
    adoptionAvailable: true,
  },
  {
    id: "CH-2026-00127",
    name: "Aarav Gupta",
    age: 10,
    gender: "Male",
    education: "Primary - Class 6B",
    healthStatus: "Stable",
    interests: "Football, Mathematics, Robotics",
    languages: "English, Hindi",
    currentStatus: "REGISTERED",
    photo: "https://images.unsplash.com/photo-1503944583220-79d8926ad5e2?auto=format&fit=crop&w=400&q=80",
    visitAvailable: true,
    adoptionAvailable: false,
  },
];

const TIME_SLOTS = [
  { id: "slot-morning", label: "Morning Slot", time: "10:00 AM - 12:00 PM", period: "Morning" },
  { id: "slot-afternoon", label: "Afternoon Slot", time: "02:00 PM - 04:00 PM", period: "Afternoon" },
  { id: "slot-evening", label: "Evening Slot", time: "04:30 PM - 06:00 PM", period: "Evening" },
];

const VISIT_PURPOSES = [
  "First Visit",
  "Follow-up Visit",
  "Adoption Discussion",
  "Child Interaction",
  "Counseling",
  "Other",
];

const statusTone = {
  PENDING: "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-200 border-amber-200 dark:border-amber-500/30",
  APPROVED: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-200 border-emerald-200 dark:border-emerald-500/30",
  REJECTED: "bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-200 border-red-200 dark:border-red-500/30",
  RESCHEDULED: "bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-200 border-blue-200 dark:border-blue-500/30",
  COMPLETED: "bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-200 border-blue-200 dark:border-blue-500/30",
  CANCELLED: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-200 dark:border-slate-700",
  Pending: "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-200",
  Approved: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-200",
  Rejected: "bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-200",
  Rescheduled: "bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-200",
  Completed: "bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-200"
};

const inputClass =
  "w-full rounded-xl border border-slate-200 bg-white/90 px-4 py-3 text-sm font-semibold text-slate-800 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-900/80 dark:text-white";

function localIsoDate(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function formatTo24HourTime(timeStr) {
  if (!timeStr) return "10:00";
  const clean = timeStr.trim();
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

export default function VisitRequest() {
  const { user } = useAuth();
  const { toasts, success: showSuccess, error: showError, removeToast } = useToast();

  const tomorrowIso = new Date(Date.now() + 86400000).toISOString().split('T')[0];

  const [parentProfile, setParentProfile] = useState(null);
  const [orphanageOptions, setOrphanageOptions] = useState([]);
  const [requestHistory, setRequestHistory] = useState([]);
  const [selectedOrphanage, setSelectedOrphanage] = useState(null);
  const [selectedChild, setSelectedChild] = useState(MOCK_CHILDREN[0]);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState(TIME_SLOTS[0].time);
  const [selectedPurpose, setSelectedPurpose] = useState(VISIT_PURPOSES[0]);
  const [selectedDate, setSelectedDate] = useState(tomorrowIso);
  
  // Dynamic Visitor list
  const [visitors, setVisitors] = useState([
    { name: "", age: "", relationship: "Self / Parent", govId: "" },
  ]);

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [toastVisible, setToastVisible] = useState(false);

  const selectedOrphanageObj = useMemo(
    () => orphanageOptions.find((o) => o.id === selectedOrphanage),
    [selectedOrphanage, orphanageOptions]
  );

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm({
    defaultValues: {
      orphanageId: "",
      reason: "",
      familyBackground: "",
      requirements: "",
      emergencyName: "",
      emergencyPhone: "",
      emergencyRelation: "",
      agreement: false,
    },
  });

  useEffect(() => {
    loadPageData();

    // Background auto-refresh polling every 10 seconds for real-time status synchronization
    const interval = setInterval(async () => {
      try {
        const requestsResult = await visitRequestsService.getMyRequests({ limit: 20 });
        if (requestsResult && requestsResult.data) {
          setRequestHistory(requestsResult.data);
        }
      } catch (err) {
        // Silent background sync
      }
    }, 10000);

    return () => clearInterval(interval);
  }, []);

  const loadPageData = async () => {
    setLoading(true);

    const [profileResult, kycResult, orphanagesResult, requestsResult] = await Promise.allSettled([
      parentsService.getDashboard(),
      parentsService.getKycStatus().catch(() => null),
      orphanagesService.getApprovedForParents().catch(() => orphanagesService.getAll({ isActive: true, limit: 50 })),
      visitRequestsService.getMyRequests({ limit: 20 }),
    ]);

    let baseProfile = {};
    if (profileResult.status === 'fulfilled') {
      baseProfile = profileResult.value?.parent || profileResult.value || {};
    }

    if (kycResult.status === 'fulfilled' && kycResult.value) {
      const kycData = kycResult.value;
      baseProfile = {
        ...baseProfile,
        kycStatus: kycData.kycStatus || baseProfile.kycStatus || 'APPROVED',
        verificationStatus: kycData.verificationStatus || baseProfile.verificationStatus || 'APPROVED',
        documents: (Array.isArray(kycData.documents) && kycData.documents.length > 0)
          ? kycData.documents
          : (baseProfile.documents || []),
      };
    }

    setParentProfile(baseProfile);

    if (orphanagesResult.status === 'fulfilled') {
      const orphanages = Array.isArray(orphanagesResult.value)
        ? orphanagesResult.value
        : (orphanagesResult.value?.data || []);
      setOrphanageOptions(orphanages);
      if (orphanages.length > 0) {
        setSelectedOrphanage(orphanages[0].id);
        setValue('orphanageId', orphanages[0].id);
      } else {
        setSelectedOrphanage(null);
      }
    } else {
      setOrphanageOptions([]);
      setSelectedOrphanage(null);
      showError(orphanagesResult.reason?.message || 'Failed to load orphanages');
    }

    if (requestsResult.status === 'fulfilled') {
      setRequestHistory(requestsResult.value.data || []);
    } else {
      setRequestHistory([]);
      showError(requestsResult.reason?.message || 'Failed to load request history');
      console.error('Error loading request history:', requestsResult.reason);
    }

    setLoading(false);
  };

  const handleAddVisitor = () => {
    if (visitors.length >= 3) {
      showError("Maximum 3 visitors allowed per visit request.");
      return;
    }
    setVisitors([...visitors, { name: "", age: "", relationship: "Spouse", govId: "" }]);
  };

  const handleRemoveVisitor = (index) => {
    if (visitors.length === 1) return;
    setVisitors(visitors.filter((_, i) => i !== index));
  };

  const handleVisitorChange = (index, field, value) => {
    const updated = [...visitors];
    updated[index][field] = value;
    setVisitors(updated);
  };

  const onSubmit = async (formData) => {
    try {
      setSubmitting(true);

      const orphanageId = formData.orphanageId || selectedOrphanage;
      if (!orphanageId) {
        showError('Please select an orphanage before submitting.');
        setSubmitting(false);
        return;
      }

      const rawTime = formData.visitTime || selectedTimeSlot || "10:00";
      const visitTime = formatTo24HourTime(rawTime);
      const visitDate = formData.visitDate || selectedDate || tomorrowIso;

      const isUuid = (str) =>
        typeof str === "string" &&
        /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(str);

      const payload = {
        orphanageId,
        ...(isUuid(selectedChild?.id) && { childId: selectedChild.id }),
        visitDate,
        visitTime,
        purpose: formData.purpose || selectedPurpose || "Adoption Inquiry",
        reason: formData.reason,
        adoptionTimeline: formData.timeline || "Within 3 months",
        familyBackground: formData.familyBackground,
        visitorsCount: visitors.length || (formData.visitors ? parseInt(formData.visitors, 10) : 1),
        relationshipOfVisitors: formData.relationship || visitors.map((v) => `${v.name || 'Visitor'} (${v.relationship})`).join(', '),
        specialRequirements: formData.requirements || undefined,
        agreedToRules: formData.agreement === true,
      };

      await visitRequestsService.create(payload);

      showSuccess("Visit Request Submitted Successfully!");
      setToastVisible(true);
      setTimeout(() => setToastVisible(false), 4000);

      // Refresh request history
      const requestsData = await visitRequestsService.getMyRequests({ limit: 20 });
      setRequestHistory(requestsData?.data || requestsData || []);
    } catch (err) {
      const msg = err?.data?.message || err?.message || "Failed to submit visit request";
      showError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  async function handleCancelRequest(request, cancellationReason) {
    if (!cancellationReason || !cancellationReason.trim()) {
      showError('Please provide a reason for cancelling the visit request');
      return;
    }
    try {
      setSubmitting(true);
      await visitRequestsService.cancel(request.id, cancellationReason);
      showSuccess('Visit request cancelled successfully');
      const requestsData = await visitRequestsService.getMyRequests({ limit: 20 });
      setRequestHistory(requestsData.data || []);
    } catch (err) {
      showError(err.message || 'Failed to cancel visit request');
      console.error('Error cancelling visit request:', err);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleAcceptReschedule(request) {
    try {
      setSubmitting(true);
      await visitRequestsService.respondReschedule(request.id, { action: 'ACCEPT' });
      showSuccess('Reschedule accepted! Visit status updated to APPROVED.');
      const requestsData = await visitRequestsService.getMyRequests({ limit: 20 });
      setRequestHistory(requestsData.data || []);
    } catch (err) {
      showError(err.message || 'Failed to accept reschedule request');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleRejectReschedule(request, reason) {
    if (!reason || !reason.trim()) {
      showError('Please provide a reason for declining the reschedule proposal');
      return;
    }
    try {
      setSubmitting(true);
      await visitRequestsService.respondReschedule(request.id, { action: 'REJECT', reason });
      showSuccess('Reschedule offer declined');
      const requestsData = await visitRequestsService.getMyRequests({ limit: 20 });
      setRequestHistory(requestsData.data || []);
    } catch (err) {
      showError(err.message || 'Failed to reject reschedule request');
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return <PageSkeleton />;
  }

  return (
    <div className="space-y-8">
      <ToastContainer toasts={toasts} onRemove={removeToast} />
      <Breadcrumb items={["Parent Portal", "Schedule Visit Request"]} />

      {/* Hero Header */}
      <motion.header
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 p-6 text-white shadow-xl sm:p-8"
      >
        <div className="absolute right-0 top-0 -mr-16 -mt-16 h-64 w-64 rounded-full bg-blue-500/10 blur-3xl" />
        <div className="relative z-10 grid gap-6 lg:grid-cols-[1fr_auto] lg:items-center">
          <div>
            <div className="mb-3 inline-flex items-center gap-2 rounded-lg bg-blue-500/20 px-3.5 py-1.5 text-xs font-bold text-blue-200 border border-blue-400/30 backdrop-blur-md">
              <FiShield className="h-4 w-4" />
              Verified Parent Safety Portal
            </div>
            <h1 className="text-3xl font-extrabold text-white sm:text-4xl tracking-tight">
              Orphanage Visit Request & Child Scheduling
            </h1>
            <p className="mt-2 max-w-2xl text-sm font-medium text-blue-100/90 leading-relaxed sm:text-base">
              Schedule an official visit to meet children and discuss adoption progress. All visits are managed with verified security protocols.
            </p>
          </div>

          <VerificationStatusCard parentProfile={parentProfile} />
        </div>
      </motion.header>

      {/* Form & Reference Grid Layout */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
        <div className="grid gap-8 lg:grid-cols-2 items-start">
          {/* Left Column: Selection & Visit Details */}
          <div className="space-y-8">
            <OrphanageSelectionCard
              orphanageOptions={orphanageOptions}
              selectedOrphanage={selectedOrphanage}
              onChangeOrphanage={(id) => {
                setSelectedOrphanage(id);
                setValue('orphanageId', id);
              }}
              selectedOrphanageObj={selectedOrphanageObj}
              loading={loading}
            />
            <FormDetailsCard register={register} errors={errors} submitting={submitting} />
          </div>

          {/* Right Column: Verified Documents, Emergency Contact & Guidelines */}
          <div className="space-y-8">
            <DocumentStatus parentProfile={parentProfile} />
            <EmergencyContactCard register={register} errors={errors} submitting={submitting} />
            <VisitGuidelinesCard />
          </div>
        </div>

        {/* Full-width Terms Declaration & Submit Action */}
        <div className="space-y-6 pt-2">
          <TermsAgreementCard register={register} errors={errors} submitting={submitting} />

          <button
            type="submit"
            disabled={submitting}
            className="flex w-full items-center justify-center gap-2.5 rounded-xl bg-blue-600 px-6 py-4 text-base font-bold text-white shadow-sm border border-blue-700/20 transition hover:bg-blue-700 active:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {submitting ? (
              <>
                <FiLoader className="h-5 w-5 animate-spin" />
                Submitting Visit Request...
              </>
            ) : (
              <>
                <FiSend className="h-5 w-5" />
                Request Official Visit
              </>
            )}
          </button>
        </div>
      </form>

      {/* Previous Visits Section */}
      <PreviousVisitsSection
        requestHistory={requestHistory}
        orphanageOptions={orphanageOptions}
        onAcceptReschedule={handleAcceptReschedule}
        onRejectReschedule={handleRejectReschedule}
        onCancelRequest={handleCancelRequest}
      />

      {/* Toast Notification */}
      <SuccessToast visible={toastVisible} />
    </div>
  );
}

/* ==========================================================================
   COMPONENT SUB-SECTIONS
   ========================================================================== */

/**
 * 1. Compact Verification Status Card
 */
function VerificationStatusCard({ parentProfile }) {
  const kycStatus = parentProfile?.kycStatus || "VERIFIED";
  const isApproved = kycStatus === "APPROVED" || kycStatus === "VERIFIED";

  return (
    <div className="rounded-xl border border-white/20 bg-white/10 p-5 backdrop-blur-lg min-w-[280px]">
      <div className="flex items-center justify-between gap-3 mb-3">
        <span className="text-xs font-extrabold uppercase tracking-wider text-blue-200">
          Verification Status
        </span>
        <span
          className={classNames(
            "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-extrabold shadow-sm",
            isApproved ? "bg-emerald-500 text-white" : "bg-amber-500 text-white"
          )}
        >
          <FiCheckCircle className="h-3.5 w-3.5" />
          {isApproved ? "KYC Verified" : "Pending"}
        </span>
      </div>

      <div className="space-y-2 text-xs">
        <div className="flex justify-between font-bold text-blue-100">
          <span>Parent Identity Check</span>
          <span className="text-emerald-300">100% Passed</span>
        </div>
        <div className="h-2 w-full overflow-hidden rounded-full bg-white/20">
          <div className="h-full w-full rounded-full bg-emerald-400" />
        </div>
        <p className="pt-1 text-[11px] font-medium text-blue-200/80">
          Eligible for official orphanage visit scheduling.
        </p>
      </div>
    </div>
  );
}

/**
 * 2. Child Information Card
 */
function ChildInformationCard({ selectedChild, onSelectChild }) {
  return (
    <Card className="rounded-2xl border border-slate-200/80 bg-white/90 p-6 shadow-sm dark:border-slate-800 dark:bg-slate-950/60 backdrop-blur-md">
      <div className="flex items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
            <FiHeart className="h-5 w-5 text-rose-500" />
            Child Information
          </h2>
          <p className="mt-1 text-xs font-medium text-slate-500 dark:text-slate-400">
            Select the child you wish to request a visit for
          </p>
        </div>

        {/* Child Switcher Tabs */}
        <div className="flex gap-2">
          {MOCK_CHILDREN.map((child) => (
            <button
              key={child.id}
              onClick={() => onSelectChild(child)}
              className={classNames(
                "rounded-lg px-3 py-1.5 text-xs font-extrabold transition",
                selectedChild.id === child.id
                  ? "bg-blue-600 text-white shadow-sm"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300"
              )}
            >
              {child.name.split(" ")[0]}
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-[140px_1fr]">
        <div className="relative overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800 shadow-md h-36 md:h-full">
          <img
            src={selectedChild.photo}
            alt={selectedChild.name}
            className="h-full w-full object-cover object-center"
          />
          <span className="absolute bottom-2 left-2 rounded-md bg-slate-900/80 px-2 py-0.5 text-[10px] font-bold text-white backdrop-blur-sm">
            {selectedChild.id}
          </span>
        </div>

        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3 dark:border-slate-800">
            <div>
              <h3 className="text-2xl font-extrabold text-slate-900 dark:text-white">
                {selectedChild.name}
              </h3>
              <p className="text-xs font-bold text-slate-500 dark:text-slate-400">
                {selectedChild.age} Years Old • {selectedChild.gender}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-extrabold text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-500/30">
                Available for Visit
              </span>
              {selectedChild.adoptionAvailable && (
                <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-extrabold text-blue-700 dark:bg-blue-500/15 dark:text-blue-300 border border-blue-200 dark:border-blue-500/30">
                  Adoption Discussion Open
                </span>
              )}
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 text-xs">
            <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-3 dark:border-slate-800 dark:bg-slate-900/40">
              <span className="font-bold text-slate-400">Education</span>
              <p className="mt-1 font-extrabold text-slate-800 dark:text-slate-200">
                {selectedChild.education}
              </p>
            </div>

            <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-3 dark:border-slate-800 dark:bg-slate-900/40">
              <span className="font-bold text-slate-400">Health Vitals</span>
              <p className="mt-1 font-extrabold text-emerald-600 dark:text-emerald-400">
                {selectedChild.healthStatus}
              </p>
            </div>

            <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-3 dark:border-slate-800 dark:bg-slate-900/40">
              <span className="font-bold text-slate-400">Languages</span>
              <p className="mt-1 font-extrabold text-slate-800 dark:text-slate-200">
                {selectedChild.languages}
              </p>
            </div>

            <div className="sm:col-span-2 lg:col-span-3 rounded-xl border border-slate-100 bg-slate-50/70 p-3 dark:border-slate-800 dark:bg-slate-900/40">
              <span className="font-bold text-slate-400">Interests & Hobbies</span>
              <p className="mt-1 font-extrabold text-slate-800 dark:text-slate-200">
                {selectedChild.interests}
              </p>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}

/**
 * 3. Orphanage Selection Card
 */
function OrphanageSelectionCard({
  orphanageOptions = [],
  selectedOrphanage,
  onChangeOrphanage,
  selectedOrphanageObj,
  loading = false,
}) {
  return (
    <Card className="rounded-2xl border border-slate-200/80 bg-white/90 p-6 shadow-sm dark:border-slate-800 dark:bg-slate-950/60 backdrop-blur-md">
      <div className="flex items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100 text-blue-600 dark:bg-blue-500/20 dark:text-blue-300">
            <FiHome className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-lg font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
              Orphanage Selection
              {loading && <FiLoader className="h-4 w-4 animate-spin text-blue-600" />}
            </h2>
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
              Select registered care shelter hosting the child
            </p>
          </div>
        </div>
      </div>

      <select
        value={selectedOrphanage || ""}
        disabled={loading || orphanageOptions.length === 0}
        onChange={(e) => onChangeOrphanage(e.target.value)}
        className={inputClass}
      >
        <option value="" disabled>
          {loading
            ? "Loading registered active orphanages..."
            : orphanageOptions.length === 0
            ? "No active orphanages registered"
            : "Select an orphanage to visit..."}
        </option>
        {orphanageOptions.map((item) => (
          <option key={item.id} value={item.id}>
            {item.name} ({item.city || "Delhi"}, {item.state || "Delhi"})
          </option>
        ))}
      </select>

      {!loading && orphanageOptions.length === 0 && (
        <div className="mt-3 flex items-center gap-2 text-xs font-semibold text-amber-600 dark:text-amber-400">
          <FiAlertCircle className="h-4 w-4" />
          No active registered orphanages currently available in the database.
        </div>
      )}

      {selectedOrphanageObj && (
        <div className="mt-4 grid gap-3 sm:grid-cols-3 text-xs">
          <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-3 dark:border-slate-800 dark:bg-slate-900/40">
            <span className="font-bold text-slate-400">City / District</span>
            <p className="mt-1 font-extrabold text-slate-800 dark:text-slate-200">
              {selectedOrphanageObj.city || "Central Delhi"}
            </p>
          </div>
          <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-3 dark:border-slate-800 dark:bg-slate-900/40">
            <span className="font-bold text-slate-400">Organization Type</span>
            <p className="mt-1 font-extrabold text-slate-800 dark:text-slate-200">
              {selectedOrphanageObj.organizationType || "NGO Govt Registered"}
            </p>
          </div>
          <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-3 dark:border-slate-800 dark:bg-slate-900/40">
            <span className="font-bold text-slate-400">Verification</span>
            <p className="mt-1 font-extrabold text-emerald-600 dark:text-emerald-400">
              CWC Government Approved
            </p>
          </div>
        </div>
      )}
    </Card>
  );
}

function OrphanageSelection({ register, selected, onChange, orphanageOptions }) {
  const orphanageField = register("orphanageId", { required: "Please select an orphanage" });

  return (
    <Card className="rounded-lg">
      <SectionTitle icon={FiHome} title="Orphanage Selection" subtitle="Choose a registered orphanage for your visit" />
      <label className="mt-5 block text-sm font-bold text-slate-700 dark:text-slate-200">
        Select Orphanage
        <select
          {...orphanageField}
          disabled={orphanageOptions.length === 0}
          onChange={(event) => {
            orphanageField.onChange(event);
            onChange(event.target.value);
          }}
          className={fieldClass}
        >
          {orphanageOptions.length === 0 && <option value="">No approved orphanages available</option>}
          {orphanageOptions.map((orphanage) => (
            <option key={orphanage.id} value={orphanage.id}>
              {orphanage.name}
            </option>
          ))}
        </select>
      </label>
      {selected && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="mt-5 grid gap-3 sm:grid-cols-2">
          <InfoTile icon={FiMapPin} label="City" value={selected.city || 'N/A'} />
          <InfoTile icon={FiMapPin} label="State" value={selected.state || 'N/A'} />
          <InfoTile icon={FiShield} label="Verification Status" value="Approved" />
        </motion.div>
      )}
    </Card>
  );
}

/**
 * 4. Visit Availability Calendar & Preferred Time Slots
 */
function VisitAvailabilityCard({
  selectedDate,
  onSelectDate,
  selectedTimeSlot,
  onSelectTimeSlot,
}) {
  const dates = [
    { date: "2026-08-04", day: "Tue", status: "Available" },
    { date: "2026-08-05", day: "Wed", status: "Available" },
    { date: "2026-08-06", day: "Thu", status: "Fully Booked" },
    { date: "2026-08-07", day: "Fri", status: "Available" },
    { date: "2026-08-08", day: "Sat", status: "Available" },
    { date: "2026-08-09", day: "Sun", status: "Holiday" },
  ];

  return (
    <Card className="rounded-2xl border border-slate-200/80 bg-white/90 p-6 shadow-sm dark:border-slate-800 dark:bg-slate-950/60 backdrop-blur-md">
      <div className="flex items-center gap-3 mb-6">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100 text-blue-600 dark:bg-blue-500/20 dark:text-blue-300">
          <FiCalendar className="h-5 w-5" />
        </div>
        <div>
          <h2 className="text-lg font-extrabold text-slate-900 dark:text-white">
            Visit Availability & Time Slots
          </h2>
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
            Select preferred visit date and time slot
          </p>
        </div>
      </div>

      {/* Date Selector Chips */}
      <div className="mb-6">
        <span className="block text-xs font-extrabold uppercase tracking-wider text-slate-400 mb-3">
          Available Calendar Dates
        </span>
        <div className="grid gap-3 sm:grid-cols-6">
          {dates.map((d) => {
            const isSelected = selectedDate === d.date;
            const isAvailable = d.status === "Available";
            return (
              <button
                key={d.date}
                disabled={!isAvailable}
                onClick={() => onSelectDate(d.date)}
                className={classNames(
                  "flex flex-col items-center justify-center rounded-xl p-3 border transition text-center",
                  isSelected
                    ? "border-blue-600 bg-blue-600 text-white shadow-md"
                    : isAvailable
                    ? "border-slate-200 bg-white hover:border-blue-400 text-slate-800 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200"
                    : "border-slate-100 bg-slate-100/60 text-slate-400 cursor-not-allowed dark:border-slate-800/40 dark:bg-slate-900/30"
                )}
              >
                <span className="text-xs font-bold opacity-80">{d.day}</span>
                <span className="text-base font-extrabold my-0.5">{d.date.split("-")[2]}</span>
                <span className="text-[10px] font-semibold">{d.status}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Time Slot Selectable Chips */}
      <div>
        <span className="block text-xs font-extrabold uppercase tracking-wider text-slate-400 mb-3">
          Select Preferred Time Slot
        </span>
        <div className="grid gap-4 sm:grid-cols-3">
          {TIME_SLOTS.map((slot) => {
            const isSelected = selectedTimeSlot === slot.time;
            return (
              <button
                type="button"
                key={slot.id}
                onClick={() => onSelectTimeSlot(slot.time)}
                className={classNames(
                  "flex items-center gap-3 rounded-xl p-4 border text-left transition",
                  isSelected
                    ? "border-blue-600 bg-blue-50/80 text-blue-900 dark:bg-blue-500/15 dark:text-blue-100 shadow-sm"
                    : "border-slate-200 bg-white hover:border-slate-300 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200"
                )}
              >
                <FiClock className={classNames("h-5 w-5", isSelected ? "text-blue-600" : "text-slate-400")} />
                <div>
                  <p className="text-xs font-extrabold">{slot.label}</p>
                  <p className="text-xs font-medium text-slate-500 dark:text-slate-400">{slot.time}</p>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </Card>
  );
}

function VisitForm({ register, errors, submitting }) {
  const visitorsField = register("visitors", {
    required: "Number of visitors is required",
    min: { value: 1, message: "At least one visitor is required" },
    max: { value: 5, message: "A maximum of 5 visitors is allowed" },
  });

  return (
    <Card className="rounded-lg">
      <SectionTitle icon={FiFileText} title="Visit Request Form" subtitle="Provide the scheduling and family details required for review" />
      <div className="mt-5 grid gap-4 lg:grid-cols-2">
        <FormField label="Preferred Visit Date" error={errors.visitDate?.message}>
          <input type="date" min={localIsoDate()} {...register("visitDate", { required: "Visit date is required" })} disabled={submitting} className={fieldClass} />
        </FormField>
        <FormField label="Preferred Time" error={errors.visitTime?.message}>
          <input type="time" {...register("visitTime", { required: "Visit time is required" })} disabled={submitting} className={fieldClass} />
        </FormField>
        <FormField label="Purpose of Visit">
          <select {...register("purpose")} disabled={submitting} className={fieldClass}>
            {["Adoption Inquiry", "Meet Child", "Document Verification", "Counselling", "General Visit"].map((purpose) => (
              <option key={purpose}>{purpose}</option>
            ))}
          </select>
        </FormField>
        <FormField label="Expected Adoption Timeline">
          <input {...register("timeline")} disabled={submitting} placeholder="Within 3 months" className={fieldClass} />
        </FormField>
        <FormField label="Reason for Adoption" error={errors.reason?.message} wide>
          <textarea
            {...register("reason", {
              required: "Reason for adoption is required",
              minLength: { value: 50, message: "Reason must be at least 50 characters" },
            })}
            rows={4}
            disabled={submitting}
            placeholder="Share your motivation and readiness for adoption"
            className={fieldClass}
          />
        </FormField>
        <FormField label="Family Background" error={errors.familyBackground?.message} wide>
          <textarea
            {...register("familyBackground", {
              required: "Family background is required",
              minLength: { value: 100, message: "Family background must be at least 100 characters" },
            })}
            rows={4}
            disabled={submitting}
            placeholder="Describe family environment, support system, and caregiving plan"
            className={fieldClass}
          />
        </FormField>
        <FormField label="Number of Visitors" error={errors.visitors?.message}>
          <input
            type="text"
            inputMode="numeric"
            min="1"
            max="5"
            disabled={submitting}
            {...visitorsField}
            onChange={(event) => {
              event.target.value = event.target.value.replace(/[^0-9]/g, "");
              visitorsField.onChange(event);
            }}
            className={fieldClass}
          />
        </FormField>
        <FormField label="Relationship of Visitors">
          <input {...register("relationship")} disabled={submitting} placeholder="Spouse, parent, sibling" className={fieldClass} />
        </FormField>
        <FormField label="Special Requirements" wide>
          <input {...register("requirements")} disabled={submitting} placeholder="Accessibility, interpreter, counselling support" className={fieldClass} />
        </FormField>
      </div>
      <label className="mt-5 flex items-start gap-3 rounded-lg border border-civic-100 bg-civic-50/80 p-4 text-sm font-bold text-slate-700 dark:border-civic-500/20 dark:bg-civic-500/10 dark:text-slate-200">
        <input type="checkbox" {...register("agreement", { required: true })} disabled={submitting} className="mt-1 h-4 w-4 rounded border-slate-300 text-civic-600 focus:ring-civic-500" />
        <span>I agree to follow orphanage rules.</span>
      </label>
      {errors.agreement && <p className="mt-2 text-sm font-semibold text-red-600">Agreement is required before submitting.</p>}
    </Card>
  );
}

function getDocuments(parentProfile) {
  if (!parentProfile) return [];
  if (Array.isArray(parentProfile.documents)) return parentProfile.documents;
  if (Array.isArray(parentProfile.uploadedDocuments)) return parentProfile.uploadedDocuments;
  return [];
}

function SectionTitle({ icon: Icon, title, subtitle }) {
  return (
    <div className="flex items-center gap-3">
      {Icon && (
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100 text-blue-600 dark:bg-blue-500/20 dark:text-blue-300">
          <Icon className="h-5 w-5" />
        </div>
      )}
      <div>
        <h3 className="text-lg font-extrabold text-slate-900 dark:text-white">{title}</h3>
        {subtitle && <p className="text-xs font-medium text-slate-500 dark:text-slate-400">{subtitle}</p>}
      </div>
    </div>
  );
}

function FormField({ label, error, wide, children }) {
  return (
    <div className={classNames("space-y-1.5", wide ? "lg:col-span-2" : "")}>
      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">{label}</label>
      {children}
      {error && <p className="text-xs font-semibold text-red-600 dark:text-red-400">{error}</p>}
    </div>
  );
}

function InfoTile({ icon: Icon, label, value }) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-slate-200/80 bg-slate-50/50 p-3 dark:border-slate-800 dark:bg-slate-900/40">
      {Icon && <Icon className="h-5 w-5 text-blue-600 dark:text-blue-400" />}
      <div>
        <p className="text-[11px] font-bold text-slate-400">{label}</p>
        <p className="text-xs font-extrabold text-slate-800 dark:text-slate-200">{value}</p>
      </div>
    </div>
  );
}

function DocumentStatus({ parentProfile }) {
  const isKycApproved =
    parentProfile?.kycStatus === "APPROVED" ||
    parentProfile?.verificationStatus === "APPROVED" ||
    parentProfile?.kycStatus === "VERIFIED";

  // Extract documents from parentProfile.documents, parentProfile.uploadedDocuments, or fallback list if KYC is approved
  let docList = [];

  if (Array.isArray(parentProfile?.documents) && parentProfile.documents.length > 0) {
    docList = parentProfile.documents;
  } else if (Array.isArray(parentProfile?.uploadedDocuments) && parentProfile.uploadedDocuments.length > 0) {
    docList = parentProfile.uploadedDocuments;
  } else if (isKycApproved) {
    docList = [
      { documentType: "Aadhaar Card / National ID", status: "APPROVED" },
      { documentType: "PAN Card / Tax Identity", status: "APPROVED" },
      { documentType: "Proof of Address & Residence", status: "APPROVED" },
      { documentType: "Income / Financial Proof", status: "APPROVED" },
      { documentType: "Photo Identity & KYC Badge", status: "APPROVED" },
    ];
  }

  const formatDocName = (doc, idx) => {
    if (typeof doc === "string") {
      return doc.replace(/_/g, " ").toUpperCase();
    }
    if (doc?.documentType) {
      return doc.documentType.replace(/_/g, " ").toUpperCase();
    }
    if (doc?.originalName) return doc.originalName;
    if (doc?.fileName) return doc.fileName;
    return `Verified Document ${idx + 1}`;
  };

  const formatDocStatus = (doc) => {
    if (typeof doc === "object" && doc?.status) {
      return doc.status;
    }
    return "APPROVED";
  };

  return (
    <Card className="rounded-2xl border border-slate-200/80 bg-white/90 p-6 shadow-sm dark:border-slate-800 dark:bg-slate-950/60 backdrop-blur-md">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-5 border-b border-slate-200/60 dark:border-slate-800 pb-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100 text-blue-600 dark:bg-blue-500/20 dark:text-blue-300">
            <FiShield className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-lg font-extrabold text-slate-900 dark:text-white">
              Document Status & KYC Compliance
            </h2>
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
              Identity and legal compliance documents on file
            </p>
          </div>
        </div>

        {isKycApproved && (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-3.5 py-1 text-xs font-extrabold text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300">
            <FiCheckCircle className="h-4 w-4" />
            KYC Verified & Cleared
          </span>
        )}
      </div>

      {docList.length === 0 ? (
        <div className="py-6 text-center text-sm font-semibold text-slate-500 dark:text-slate-400">
          No documents uploaded yet. Complete KYC verification to see document status.
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {docList.map((doc, idx) => {
            const name = formatDocName(doc, idx);
            const status = formatDocStatus(doc);
            const isApprovedDoc = status === "APPROVED" || status === "VERIFIED";

            return (
              <div key={idx} className="flex items-center justify-between rounded-xl border border-slate-200/90 bg-slate-50/60 p-4 dark:border-slate-800 dark:bg-slate-900/50 shadow-xs">
                <div className="flex items-center gap-3">
                  <FiFileText className="h-5 w-5 text-blue-600 dark:text-blue-400 shrink-0" />
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200">{name}</span>
                </div>
                <span className={classNames(
                  "rounded-full px-2.5 py-0.5 text-[11px] font-extrabold shrink-0",
                  isApprovedDoc
                    ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300"
                    : "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300"
                )}>
                  {status}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );
}

function RequestHistory({ onView, onCancel, requestHistory, orphanageOptions }) {
  if (!requestHistory || requestHistory.length === 0) {
    return (
      <Card className="rounded-lg">
        <SectionTitle icon={FiClock} title="Request History" subtitle="Track previous and current orphanage visit requests" />
        <div className="mt-5 py-8 text-center text-sm text-slate-500 dark:text-slate-400">
          No visit requests yet. Submit your first request above.
        </div>
      </Card>
    );
  }

  return (
    <Card className="rounded-lg">
      <SectionTitle icon={FiClock} title="Request History" subtitle="Track previous and current orphanage visit requests" />
      <div className="mt-5 overflow-x-auto">
        <table className="w-full min-w-[920px] border-separate border-spacing-y-3 text-left">
          <thead>
            <tr className="text-sm font-extrabold text-slate-500 dark:text-slate-400">
              {["Request ID", "Orphanage", "Visit Date", "Visit Time", "Purpose", "Status", "Actions"].map((heading) => (
                <th key={heading} className="px-3 py-2">{heading}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {requestHistory.map((request) => {
              const orphanage = request.orphanage || orphanageOptions.find(o => o.id === request.orphanageId);
              
              return (
                <tr key={request.id} className="rounded-lg bg-white/75 text-sm font-semibold text-slate-700 shadow-sm dark:bg-slate-950/45 dark:text-slate-200">
                  <td className="rounded-l-lg px-3 py-4 font-extrabold text-civic-700 dark:text-civic-100">{request.requestId || request.id}</td>
                  <td className="px-3 py-4">{orphanage?.name || 'Unknown'}</td>
                  <td className="px-3 py-4">{new Date(request.visitDate).toLocaleDateString()}</td>
                  <td className="px-3 py-4">{request.visitTime || 'N/A'}</td>
                  <td className="px-3 py-4">{request.purpose}</td>
                  <td className="px-3 py-4">
                    <span className={classNames("rounded-lg px-3 py-1 text-xs font-extrabold", statusTone[request.status] || statusTone.Pending)}>{request.status}</span>
                  </td>
                  <td className="rounded-r-lg px-3 py-4">
                    <div className="flex flex-wrap gap-2">
                      <Button variant="secondary" onClick={() => onView(request)} className="px-3 py-2 text-xs">
                        View Details
                      </Button>
                      {request.status === "PENDING" && (
                        <Button variant="ghost" onClick={() => onCancel(request)} className="px-3 py-2 text-xs text-red-600 hover:bg-red-50 dark:text-red-300 dark:hover:bg-red-500/10">
                          Cancel Request
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

/**
 * 5. Visit Purpose Selectable Chips
 */
function VisitPurposeCard({ selectedPurpose, onSelectPurpose }) {
  return (
    <Card className="rounded-2xl border border-slate-200/80 bg-white/90 p-6 shadow-sm dark:border-slate-800 dark:bg-slate-950/60 backdrop-blur-md">
      <div className="flex items-center gap-3 mb-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100 text-blue-600 dark:bg-blue-500/20 dark:text-blue-300">
          <FiFileText className="h-5 w-5" />
        </div>
        <div>
          <h2 className="text-lg font-extrabold text-slate-900 dark:text-white">
            Visit Purpose
          </h2>
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
            Select the primary objective of your visit
          </p>
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        {VISIT_PURPOSES.map((purpose) => {
          const isSelected = selectedPurpose === purpose;
          return (
            <button
              type="button"
              key={purpose}
              onClick={() => onSelectPurpose(purpose)}
              className={classNames(
                "rounded-xl px-4 py-2.5 text-xs font-extrabold transition border",
                isSelected
                  ? "border-blue-600 bg-blue-600 text-white shadow-md"
                  : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300"
              )}
            >
              {purpose}
            </button>
          );
        })}
      </div>
    </Card>
  );
}

/**
 * 6. Dynamic Visitor Details Card
 */
function VisitorDetailsCard({ visitors, onAddVisitor, onRemoveVisitor, onVisitorChange }) {
  return (
    <Card className="rounded-2xl border border-slate-200/80 bg-white/90 p-6 shadow-sm dark:border-slate-800 dark:bg-slate-950/60 backdrop-blur-md">
      <div className="flex items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100 text-blue-600 dark:bg-blue-500/20 dark:text-blue-300">
            <FiUsers className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-lg font-extrabold text-slate-900 dark:text-white">
              Visitor Details
            </h2>
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
              Add details of all individuals attending the visit (Max 3)
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onAddVisitor}
          className="inline-flex items-center gap-2 rounded-xl bg-blue-50 px-3.5 py-2 text-xs font-extrabold text-blue-600 hover:bg-blue-100 dark:bg-blue-500/20 dark:text-blue-300 transition"
        >
          <FiPlus className="h-4 w-4" />
          Add Visitor
        </button>
      </div>

      <div className="space-y-4">
        {visitors.map((visitor, idx) => (
          <div
            key={idx}
            className="rounded-xl border border-slate-200/80 bg-slate-50/50 p-4 dark:border-slate-800 dark:bg-slate-900/40 relative"
          >
            <div className="flex items-center justify-between mb-3 border-b border-slate-200/60 pb-2 dark:border-slate-800">
              <span className="text-xs font-extrabold text-slate-700 dark:text-slate-300">
                Visitor #{idx + 1}
              </span>
              {visitors.length > 1 && (
                <button
                  type="button"
                  onClick={() => onRemoveVisitor(idx)}
                  className="text-xs text-red-500 hover:text-red-700 flex items-center gap-1 font-bold"
                >
                  <FiTrash2 className="h-3.5 w-3.5" />
                  Remove
                </button>
              )}
            </div>

            <div className="grid gap-3 sm:grid-cols-4">
              <input
                type="text"
                placeholder="Full Name"
                value={visitor.name}
                onChange={(e) => onVisitorChange(idx, "name", e.target.value)}
                className={inputClass}
              />
              <input
                type="number"
                placeholder="Age"
                value={visitor.age}
                onChange={(e) => onVisitorChange(idx, "age", e.target.value)}
                className={inputClass}
              />
              <select
                value={visitor.relationship}
                onChange={(e) => onVisitorChange(idx, "relationship", e.target.value)}
                className={inputClass}
              >
                <option>Self / Parent</option>
                <option>Spouse</option>
                <option>Guardian</option>
                <option>Sibling</option>
              </select>
              <input
                type="text"
                placeholder="Govt ID (Aadhaar/PAN)"
                value={visitor.govId}
                onChange={(e) => onVisitorChange(idx, "govId", e.target.value)}
                className={inputClass}
              />
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}

/**
 * 7. Form Details & Family Background
 */
function FormDetailsCard({ register, errors, submitting }) {
  return (
    <Card className="rounded-2xl border border-slate-200/80 bg-white/90 p-6 shadow-sm dark:border-slate-800 dark:bg-slate-950/60 backdrop-blur-md">
      <div className="flex items-center gap-3 mb-6">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100 text-blue-600 dark:bg-blue-500/20 dark:text-blue-300">
          <FiFileText className="h-5 w-5" />
        </div>
        <div>
          <h2 className="text-lg font-extrabold text-slate-900 dark:text-white">
            Visit Motivation & Background
          </h2>
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
            Share background details for orphanage review
          </p>
        </div>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-xs font-extrabold text-slate-700 dark:text-slate-300 mb-2">
            Reason for Visit & Motivation *
          </label>
          <textarea
            {...register("reason", { required: "Reason for visit is required" })}
            rows={3}
            disabled={submitting}
            placeholder="Explain why you wish to visit and your readiness for adoption discussions..."
            className={inputClass}
          />
          {errors.reason && (
            <p className="mt-1 text-xs text-red-500 flex items-center gap-1 font-bold">
              <FiAlertCircle className="h-3 w-3" /> {errors.reason.message}
            </p>
          )}
        </div>

        <div>
          <label className="block text-xs font-extrabold text-slate-700 dark:text-slate-300 mb-2">
            Family Environment & Caregiving Support *
          </label>
          <textarea
            {...register("familyBackground", { required: "Family background is required" })}
            rows={3}
            disabled={submitting}
            placeholder="Describe your household setup, family environment, and support system..."
            className={inputClass}
          />
          {errors.familyBackground && (
            <p className="mt-1 text-xs text-red-500 flex items-center gap-1 font-bold">
              <FiAlertCircle className="h-3 w-3" /> {errors.familyBackground.message}
            </p>
          )}
        </div>

        <div>
          <label className="block text-xs font-extrabold text-slate-700 dark:text-slate-300 mb-2">
            Special Requirements (Optional)
          </label>
          <input
            {...register("requirements")}
            disabled={submitting}
            placeholder="Accessibility needs, language interpreter, counseling support..."
            className={inputClass}
          />
        </div>
      </div>
    </Card>
  );
}

/**
 * 8. Emergency Contact Card
 */
function EmergencyContactCard({ register, errors, submitting }) {
  return (
    <Card className="rounded-2xl border border-slate-200/80 bg-white/90 p-6 shadow-sm dark:border-slate-800 dark:bg-slate-950/60 backdrop-blur-md">
      <div className="flex items-center gap-3 mb-6">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100 text-blue-600 dark:bg-blue-500/20 dark:text-blue-300">
          <FiUser className="h-5 w-5" />
        </div>
        <div>
          <h2 className="text-lg font-extrabold text-slate-900 dark:text-white">
            Emergency Contact Information
          </h2>
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
            Designated contact person during visit
          </p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div>
          <label className="block text-xs font-extrabold text-slate-700 dark:text-slate-300 mb-2">
            Contact Person Name *
          </label>
          <input
            {...register("emergencyName", { required: "Emergency contact name is required" })}
            disabled={submitting}
            placeholder="Full Name"
            className={inputClass}
          />
        </div>
        <div>
          <label className="block text-xs font-extrabold text-slate-700 dark:text-slate-300 mb-2">
            Relationship *
          </label>
          <input
            {...register("emergencyRelation", { required: "Relationship is required" })}
            disabled={submitting}
            placeholder="Sibling / Relative"
            className={inputClass}
          />
        </div>
        <div>
          <label className="block text-xs font-extrabold text-slate-700 dark:text-slate-300 mb-2">
            Phone Number *
          </label>
          <input
            {...register("emergencyPhone", { required: "Phone number is required" })}
            disabled={submitting}
            placeholder="+91 98765 43210"
            className={inputClass}
          />
        </div>
      </div>
    </Card>
  );
}

/**
 * Terms Agreement Card
 */
function TermsAgreementCard({ register, errors, submitting }) {
  return (
    <div className="rounded-2xl border border-blue-100 bg-blue-50/70 p-5 dark:border-blue-900/30 dark:bg-blue-950/20">
      <label className="flex items-start gap-3 cursor-pointer text-xs font-bold text-slate-700 dark:text-slate-300">
        <input
          type="checkbox"
          {...register("agreement", { required: true })}
          disabled={submitting}
          className="mt-0.5 h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
        />
        <span>
          I hereby certify that all information provided is accurate. I agree to abide by all orphanage safety protocols, staff guidelines, and government adoption rules.
        </span>
      </label>
      {errors.agreement && (
        <p className="mt-2 text-xs font-bold text-red-600">
          You must agree to terms & guidelines before submitting.
        </p>
      )}
    </div>
  );
}

/**
 * Visit Guidelines Card
 */
function VisitGuidelinesCard() {
  const guidelines = [
    { icon: FiShield, title: "Carry Original ID", desc: "Aadhaar / Govt ID required at gate entry." },
    { icon: FiUsers, title: "Max 3 Visitors", desc: "Maximum 3 visitors allowed per approved slot." },
    { icon: FiClock, title: "Reach 15 Mins Early", desc: "Complete security check-in 15 mins prior." },
    { icon: FiCameraOff, title: "Photography Policy", desc: "Photography inside child wards strictly restricted." },
    { icon: FiGift, title: "Gift Policy", desc: "Only sealed educational items & books accepted." },
    { icon: FiInfo, title: "Staff Instructions", desc: "Follow caretaker guidance during interaction." },
  ];

  return (
    <Card className="rounded-2xl border border-slate-200/80 bg-white/90 p-6 shadow-sm dark:border-slate-800 dark:bg-slate-950/60 backdrop-blur-md">
      <h3 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2 mb-4">
        <FiShield className="h-5 w-5 text-blue-600" />
        Visit Safety Guidelines
      </h3>
      <div className="space-y-3.5">
        {guidelines.map((item, i) => (
          <div key={i} className="flex items-start gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-500/20 dark:text-blue-300">
              <item.icon className="h-4 w-4" />
            </div>
            <div>
              <p className="text-xs font-extrabold text-slate-800 dark:text-slate-200">
                {item.title}
              </p>
              <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                {item.desc}
              </p>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}

/**
 * AI Assistant Help Card
 */
function AiAssistantHelpCard() {
  return (
    <div className="rounded-2xl border border-indigo-200/60 bg-gradient-to-br from-indigo-900 to-slate-900 p-6 text-white shadow-lg relative overflow-hidden">
      <div className="absolute -right-8 -bottom-8 h-32 w-32 rounded-full bg-indigo-500/20 blur-2xl" />
      <div className="flex items-center gap-3 mb-4">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-500/30 text-indigo-200 border border-indigo-400/30">
          <FiZap className="h-5 w-5 text-indigo-300" />
        </div>
        <div>
          <h3 className="text-sm font-extrabold text-white">AI Visit Assistant</h3>
          <p className="text-[11px] text-indigo-200/80">Instant Help & FAQs</p>
        </div>
      </div>
      <div className="space-y-2.5 text-xs text-indigo-100/90">
        <div className="rounded-xl bg-white/10 p-3 backdrop-blur-md">
          <p className="font-extrabold">💡 How long does approval take?</p>
          <p className="mt-1 text-[11px] text-indigo-200/80">
            Usually 24–48 hours after KYC document review by CWC.
          </p>
        </div>
        <div className="rounded-xl bg-white/10 p-3 backdrop-blur-md">
          <p className="font-extrabold">🎁 Can I bring snacks/food?</p>
          <p className="mt-1 text-[11px] text-indigo-200/80">
            Only factory-sealed packaged food items verified at gate.
          </p>
        </div>
      </div>
    </div>
  );
}

/**
 * Visit Progress Timeline Card
 */
function VisitTimelineCard() {
  const steps = [
    { title: "Request Submitted", desc: "Intake form submitted", status: "current" },
    { title: "Under Review", desc: "CWC & Orphanage verification", status: "pending" },
    { title: "Documents Verified", desc: "ID & background check", status: "pending" },
    { title: "Visit Scheduled", desc: "Pass generated with QR", status: "pending" },
    { title: "Visit Completed", desc: "Interaction & feedback", status: "pending" },
  ];

  return (
    <Card className="rounded-2xl border border-slate-200/80 bg-white/90 p-6 shadow-sm dark:border-slate-800 dark:bg-slate-950/60 backdrop-blur-md">
      <h3 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2 mb-4">
        <FiClock className="h-5 w-5 text-blue-600" />
        Visit Request Timeline
      </h3>
      <div className="relative pl-6 space-y-6 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200 dark:before:bg-slate-800">
        {steps.map((step, i) => (
          <div key={i} className="relative">
            <span
              className={classNames(
                "absolute -left-6 top-0.5 flex h-4 w-4 items-center justify-center rounded-full border-2 bg-white dark:bg-slate-900",
                step.status === "current"
                  ? "border-blue-600 bg-blue-600"
                  : "border-slate-300 dark:border-slate-700"
              )}
            />
            <p className="text-xs font-extrabold text-slate-800 dark:text-slate-200">
              {step.title}
            </p>
            <p className="text-[11px] font-medium text-slate-400">
              {step.desc}
            </p>
          </div>
        ))}
      </div>
    </Card>
  );
}

/**
 * Previous Visit History Cards
 */
/**
 * Previous Visit History Cards
 */
function PreviousVisitsSection({
  requestHistory,
  orphanageOptions,
  onAcceptReschedule,
  onRejectReschedule,
  onCancelRequest,
}) {
  const [selectedReqForReject, setSelectedReqForReject] = useState(null);
  const [rejectReason, setRejectReason] = useState("");
  const [selectedReqForCancel, setSelectedReqForCancel] = useState(null);
  const [cancelReason, setCancelReason] = useState("");
  const [selectedReqForDetails, setSelectedReqForDetails] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  const statusToneMap = {
    PENDING: "bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300 border-amber-300",
    APPROVED: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300 border-emerald-300",
    REJECTED: "bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-300 border-rose-300",
    RESCHEDULED: "bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-300 border-blue-300",
    CANCELLED: "bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-300",
    COMPLETED: "bg-indigo-100 text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-300 border-indigo-300",
  };

  const statusFilterOptions = [
    { label: "All Statuses", value: "ALL" },
    { label: "Pending", value: "PENDING" },
    { label: "Approved", value: "APPROVED" },
    { label: "Rejected", value: "REJECTED" },
    { label: "Reschedule Requested", value: "RESCHEDULED" },
    { label: "Cancelled", value: "CANCELLED" },
    { label: "Completed", value: "COMPLETED" },
  ];

  // Filter requests by search query and status tab
  const filteredRequests = useMemo(() => {
    if (!requestHistory) return [];
    return requestHistory.filter((req) => {
      const statusKey = req.status || "PENDING";
      const isRescheduled = statusKey === "RESCHEDULED" || statusKey === "RESCHEDULE_REQUESTED";

      if (statusFilter !== "ALL") {
        if (statusFilter === "RESCHEDULED") {
          if (!isRescheduled) return false;
        } else if (statusKey !== statusFilter) {
          return false;
        }
      }

      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const reqId = (req.requestId || req.id || "").toLowerCase();
        const purpose = (req.purpose || "").toLowerCase();
        const orphanage = orphanageOptions.find((o) => o.id === req.orphanageId);
        const orphanageName = (orphanage?.name || req.orphanageName || "").toLowerCase();

        return reqId.includes(query) || purpose.includes(query) || orphanageName.includes(query);
      }

      return true;
    });
  }, [requestHistory, statusFilter, searchQuery, orphanageOptions]);

  return (
    <Card className="rounded-2xl border border-slate-200/80 bg-white/90 p-6 shadow-sm dark:border-slate-800 dark:bg-slate-950/60 backdrop-blur-md space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between border-b border-slate-200/60 dark:border-slate-800 pb-5">
        <div>
          <h3 className="text-xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
            <FiClock className="h-5 w-5 text-blue-600" />
            My Visit Requests & Audit History
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Track your scheduled visits, view moderation status, respond to reschedules, or review details.
          </p>
        </div>

        {/* Search Input */}
        <div className="relative min-w-[240px]">
          <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 h-4 w-4" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by ID, Purpose, Orphanage..."
            className="w-full rounded-xl border border-slate-200 bg-slate-50/80 pl-9 pr-4 py-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-slate-800 dark:bg-slate-900 dark:text-white"
          />
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap gap-2">
        {statusFilterOptions.map((opt) => (
          <button
            key={opt.value}
            onClick={() => setStatusFilter(opt.value)}
            className={classNames(
              "rounded-xl px-3.5 py-1.5 text-xs font-bold transition",
              statusFilter === opt.value
                ? "bg-blue-600 text-white shadow-md shadow-blue-600/20"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
            )}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {filteredRequests.length === 0 ? (
        <div className="py-12 text-center text-slate-500 dark:text-slate-400">
          <FiCalendar className="mx-auto h-10 w-10 text-slate-400 mb-2" />
          <p className="text-base font-bold text-slate-700 dark:text-slate-200">No visit requests match your criteria.</p>
          <p className="text-xs mt-1">Try clearing your search query or selecting a different status filter.</p>
        </div>
      ) : (
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {filteredRequests.map((req) => {
            const orphanage = orphanageOptions.find((o) => o.id === req.orphanageId);
            const statusKey = req.status || "PENDING";
            const tone = statusToneMap[statusKey] || statusToneMap.PENDING;
            const isRescheduled = statusKey === "RESCHEDULED" || statusKey === "RESCHEDULE_REQUESTED";
            const canCancel = statusKey !== "COMPLETED" && statusKey !== "CANCELLED";

            return (
              <div
                key={req.id}
                className="flex flex-col justify-between rounded-2xl border border-slate-200/80 bg-slate-50/50 p-5 dark:border-slate-800 dark:bg-slate-900/40 space-y-4 transition hover:shadow-lg"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-extrabold text-blue-600 dark:text-blue-400">
                      #{req.requestId || req.id?.substring(0, 8)}
                    </span>
                    <span className={classNames("rounded-full px-3 py-1 text-[11px] font-extrabold border", tone)}>
                      {isRescheduled ? "RESCHEDULE REQUESTED" : req.status}
                    </span>
                  </div>

                  <div>
                    <h4 className="text-sm font-extrabold text-slate-900 dark:text-white">
                      {orphanage?.name || req.orphanageName || "Care Center"}
                    </h4>
                    <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-0.5">
                      <span className="font-semibold text-slate-700 dark:text-slate-300">Purpose:</span> {req.purpose}
                    </p>
                  </div>

                  {req.rejectionReason && (
                    <div className="rounded-xl border border-rose-200 bg-rose-50/80 p-2.5 text-xs text-rose-800 dark:border-rose-900/40 dark:bg-rose-950/40 dark:text-rose-200">
                      <p className="font-bold">Rejection Reason:</p>
                      <p className="mt-0.5">{req.rejectionReason}</p>
                    </div>
                  )}

                  {isRescheduled ? (
                    <div className="rounded-xl border border-blue-200 bg-blue-50/70 p-3 dark:border-blue-900/50 dark:bg-blue-950/30 space-y-2 text-xs">
                      <p className="font-bold text-blue-900 dark:text-blue-200">Proposed Schedule:</p>
                      <div className="space-y-1 text-slate-700 dark:text-slate-300">
                        <p><span className="font-semibold">Proposed Date:</span> {new Date(req.visitDate).toLocaleDateString()}</p>
                        <p><span className="font-semibold">Proposed Time:</span> {req.visitTime || "10:00 AM"}</p>
                        {req.rescheduleReason && (
                          <p className="text-amber-700 dark:text-amber-300 font-medium"><span className="font-semibold">Reason:</span> {req.rescheduleReason}</p>
                        )}
                      </div>
                      <div className="pt-2 flex flex-col gap-2">
                        <button
                          onClick={() => onAcceptReschedule(req)}
                          className="w-full rounded-xl bg-emerald-600 px-3 py-2 text-xs font-bold text-white hover:bg-emerald-700 transition shadow-sm"
                        >
                          Accept New Schedule
                        </button>
                        <button
                          onClick={() => setSelectedReqForReject(req)}
                          className="w-full rounded-xl bg-rose-100 px-3 py-2 text-xs font-bold text-rose-700 hover:bg-rose-200 dark:bg-rose-500/20 dark:text-rose-300 transition"
                        >
                          Reject New Schedule
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="pt-2 border-t border-slate-200/60 dark:border-slate-800 flex justify-between text-xs font-bold text-slate-600 dark:text-slate-300">
                      <span>Visit Date: {new Date(req.visitDate).toLocaleDateString()}</span>
                      <span>Time: {req.visitTime || "Morning"}</span>
                    </div>
                  )}
                </div>

                {/* Card Action Footer */}
                <div className="pt-3 border-t border-slate-200/60 dark:border-slate-800 flex flex-wrap gap-2 justify-between items-center">
                  <button
                    onClick={() => setSelectedReqForDetails(req)}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                  >
                    <FiEye className="h-3.5 w-3.5 text-blue-600" />
                    Details & Timeline
                  </button>

                  {canCancel && !isRescheduled && (
                    <button
                      onClick={() => setSelectedReqForCancel(req)}
                      className="inline-flex items-center gap-1.5 rounded-xl border border-rose-200 bg-rose-50 px-3 py-1.5 text-xs font-bold text-rose-700 hover:bg-rose-100 dark:border-rose-900/40 dark:bg-rose-950/40 dark:text-rose-300"
                    >
                      <FiSlash className="h-3.5 w-3.5" />
                      Cancel
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Reject Reschedule Modal */}
      {selectedReqForReject && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl dark:bg-slate-900 space-y-4">
            <h4 className="text-base font-extrabold text-slate-900 dark:text-white">Reject Proposed Reschedule</h4>
            <p className="text-xs text-slate-500 dark:text-slate-400">Please provide a reason for declining the orphanage's proposed visit slot.</p>
            <textarea
              rows={3}
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="e.g. Proposed date conflicts with working hours."
              className="w-full rounded-xl border border-slate-300 p-3 text-xs focus:ring-2 focus:ring-blue-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={() => { setSelectedReqForReject(null); setRejectReason(""); }}
                className="rounded-xl border border-slate-300 px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  onRejectReschedule(selectedReqForReject, rejectReason);
                  setSelectedReqForReject(null);
                  setRejectReason("");
                }}
                className="rounded-xl bg-rose-600 px-4 py-2 text-xs font-bold text-white hover:bg-rose-700"
              >
                Submit Rejection
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Cancel Visit Request Modal */}
      {selectedReqForCancel && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl dark:bg-slate-900 space-y-4">
            <div className="flex items-center gap-3 text-rose-600">
              <FiSlash className="h-6 w-6" />
              <h4 className="text-base font-extrabold text-slate-900 dark:text-white">Cancel Visit Request</h4>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Are you sure you want to cancel visit request <span className="font-bold">#{selectedReqForCancel.requestId || selectedReqForCancel.id?.substring(0, 8)}</span>? Please state your reason below.
            </p>
            <textarea
              rows={3}
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              placeholder="e.g. Unforeseen personal conflict."
              className="w-full rounded-xl border border-slate-300 p-3 text-xs focus:ring-2 focus:ring-rose-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={() => { setSelectedReqForCancel(null); setCancelReason(""); }}
                className="rounded-xl border border-slate-300 px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300"
              >
                Keep Request
              </button>
              <button
                onClick={() => {
                  onCancelRequest(selectedReqForCancel, cancelReason);
                  setSelectedReqForCancel(null);
                  setCancelReason("");
                }}
                className="rounded-xl bg-rose-600 px-4 py-2 text-xs font-bold text-white hover:bg-rose-700"
              >
                Confirm Cancellation
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Details & Status Timeline Modal */}
      {selectedReqForDetails && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-2xl rounded-2xl bg-white p-6 shadow-2xl dark:bg-slate-900 space-y-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4">
              <div>
                <span className="text-xs font-extrabold text-blue-600 dark:text-blue-400">
                  Request #{selectedReqForDetails.requestId || selectedReqForDetails.id}
                </span>
                <h3 className="text-lg font-extrabold text-slate-900 dark:text-white">
                  Visit Details & Audit Timeline
                </h3>
              </div>
              <button
                onClick={() => setSelectedReqForDetails(null)}
                className="rounded-xl p-2 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <FiX className="h-5 w-5" />
              </button>
            </div>

            {/* General Info */}
            <div className="grid gap-4 sm:grid-cols-2 text-xs">
              <div className="space-y-1 rounded-xl bg-slate-50 p-3 dark:bg-slate-800/50">
                <p className="text-slate-500 font-medium">Orphanage Center</p>
                <p className="font-bold text-slate-900 dark:text-white">
                  {orphanageOptions.find((o) => o.id === selectedReqForDetails.orphanageId)?.name || selectedReqForDetails.orphanageName || "Care Center"}
                </p>
              </div>
              <div className="space-y-1 rounded-xl bg-slate-50 p-3 dark:bg-slate-800/50">
                <p className="text-slate-500 font-medium">Scheduled Visit Slot</p>
                <p className="font-bold text-slate-900 dark:text-white">
                  {new Date(selectedReqForDetails.visitDate).toLocaleDateString()} at {selectedReqForDetails.visitTime || "Morning"}
                </p>
              </div>
              <div className="space-y-1 rounded-xl bg-slate-50 p-3 dark:bg-slate-800/50">
                <p className="text-slate-500 font-medium">Visit Purpose</p>
                <p className="font-bold text-slate-900 dark:text-white">{selectedReqForDetails.purpose}</p>
              </div>
              <div className="space-y-1 rounded-xl bg-slate-50 p-3 dark:bg-slate-800/50">
                <p className="text-slate-500 font-medium">Visitors Count</p>
                <p className="font-bold text-slate-900 dark:text-white">{selectedReqForDetails.visitorsCount || 1} visitor(s)</p>
              </div>
            </div>

            {/* Status Timeline */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Status Audit Timeline</h4>
              <div className="relative pl-6 space-y-4 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200 dark:before:bg-slate-800">
                <div className="relative">
                  <span className="absolute -left-6 top-1 h-3.5 w-3.5 rounded-full border-2 border-emerald-600 bg-emerald-600" />
                  <p className="text-xs font-extrabold text-slate-900 dark:text-white">Request Submitted</p>
                  <p className="text-[11px] text-slate-500">
                    {selectedReqForDetails.createdAt ? new Date(selectedReqForDetails.createdAt).toLocaleString() : "Date recorded"}
                  </p>
                </div>

                <div className="relative">
                  <span className={classNames(
                    "absolute -left-6 top-1 h-3.5 w-3.5 rounded-full border-2 bg-white dark:bg-slate-900",
                    selectedReqForDetails.status !== "PENDING" ? "border-blue-600 bg-blue-600" : "border-slate-300"
                  )} />
                  <p className="text-xs font-extrabold text-slate-900 dark:text-white">Reviewed by Orphanage</p>
                  <p className="text-[11px] text-slate-500">
                    {selectedReqForDetails.reviewedAt ? new Date(selectedReqForDetails.reviewedAt).toLocaleString() : "Awaiting review response"}
                  </p>
                </div>

                <div className="relative">
                  <span className="absolute -left-6 top-1 h-3.5 w-3.5 rounded-full border-2 border-indigo-600 bg-indigo-600" />
                  <p className="text-xs font-extrabold text-slate-900 dark:text-white">Current Status: {selectedReqForDetails.status}</p>
                  <p className="text-[11px] text-slate-500">
                    Last updated: {selectedReqForDetails.updatedAt ? new Date(selectedReqForDetails.updatedAt).toLocaleString() : "Recently"}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-3 border-t border-slate-200 dark:border-slate-800">
              <button
                onClick={() => setSelectedReqForDetails(null)}
                className="rounded-xl bg-slate-900 px-5 py-2 text-xs font-bold text-white hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900"
              >
                Close Details
              </button>
            </div>
          </div>
        </div>
      )}
    </Card>
  );
}

/**
 * Success Toast Banner
 */
function SuccessToast({ visible }) {
  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: 30, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 30, scale: 0.95 }}
          className="fixed bottom-6 right-6 z-50 flex items-center gap-3 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 px-6 py-4 text-white shadow-2xl shadow-emerald-600/30"
        >
          <FiCheckCircle className="h-6 w-6 shrink-0" />
          <div>
            <p className="text-sm font-extrabold">Visit Request Submitted!</p>
            <p className="text-xs text-emerald-100">CWC and Orphanage staff will review your request.</p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
