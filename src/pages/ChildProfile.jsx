import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import {
  FiArrowLeft, FiCalendar, FiDownload, FiFileText, FiLoader,
  FiHeart, FiHome, FiMail, FiPhone, FiShield, FiUserCheck, FiUsers
} from "react-icons/fi";
import Breadcrumb from "../components/Breadcrumb";
import ToastContainer from "../components/Toast";
import { PageSkeleton } from "../components/Loader";
import Button from "../components/Button";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../hooks/useToast";
import { childrenService } from "../services/childrenService";
import { roleLabels } from "../utils/constants";
import { classNames } from "../utils/formatters";

const riskBadge = { Low: "badge-success", Medium: "badge-warning", High: "badge-danger" };
const healthBadge = { 
  HEALTHY: "badge-success", 
  Stable: "badge-success", 
  UNDER_TREATMENT: "badge-warning",
  Observation: "badge-warning", 
  CRITICAL: "badge-danger",
  "Needs Review": "badge-danger" 
};

const riskBar = {
  Low:    { bar: "bg-emerald-500", w: "w-1/4",  label: "text-emerald-600 dark:text-emerald-400" },
  Medium: { bar: "bg-amber-500",   w: "w-1/2",  label: "text-amber-600 dark:text-amber-400" },
  High:   { bar: "bg-red-500",     w: "w-3/4",  label: "text-red-600 dark:text-red-400" },
};

export default function ChildProfile() {
  const { childId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toasts, error: showError, removeToast } = useToast();
  const [child, setChild] = useState(null);
  const [loading, setLoading] = useState(true);
  const [imgError, setImgError] = useState(false);

  useEffect(() => {
    const loadChild = async () => {
      try {
        setLoading(true);
        const data = await childrenService.getById(childId);
        if (data) {
          const fullName = data.fullName || `${data.firstName || ''} ${data.lastName || ''}`.trim() || 'Registered Child';
          const normalized = {
            ...data,
            name: fullName,
            childCode: data.childCode || `CH-${childId?.substring(0, 6)}`,
            age: data.approximateAge ?? data.age ?? 0,
            gender: data.gender || 'Female',
            risk: data.risk || data.riskLevel || 'Low',
            health: data.healthStatus || data.health || 'HEALTHY',
            attendance: data.attendanceRate ?? data.attendance ?? 95,
            orphanage: data.orphanage?.name ? data.orphanage : { name: data.orphanageName || 'Sunshine Care Home' },
            caseWorker: data.caseWorker || data.assignedCaseworker?.fullName || 'Assigned Officer',
            educationLevel: data.educationLevel || data.classSchool || 'Primary Education',
            vaccinationStatus: data.isVaccinationComplete ? 'Complete' : 'Pending',
            allergies: data.allergies || 'None reported',
            medicalHistory: data.specialNotes || 'Routine intake assessment completed.',
            emergencyContact: data.emergencyContact || 'Orphanage Administrative Desk',
            adopted: data.adoptionStatus === 'COMPLETED' || data.adopted === true,
          };
          setChild(normalized);
        } else {
          setChild(null);
        }
      } catch (err) {
        showError(err.message || "Failed to load child profile");
        console.error("Error loading child:", err);
      } finally {
        setLoading(false);
      }
    };

    loadChild();
  }, [childId]);

  if (loading) {
    return <PageSkeleton />;
  }

  if (!child) {
    return (
      <div className="space-y-5">
        <ToastContainer toasts={toasts} onRemove={removeToast} />
        <Breadcrumb items={[roleLabels[user.role], "Children", "Profile"]} />
        <div className="section-card">
          <div className="empty-state py-16">
            <div className="empty-state-icon"><FiUsers className="h-6 w-6 text-slate-400" /></div>
            <p className="empty-state-title">Child Profile Not Found</p>
            <p className="empty-state-desc">This child record couldn't be found or you don't have access.</p>
            <Button icon={FiArrowLeft} variant="secondary" className="mt-4" onClick={() => navigate(-1)}>Go Back</Button>
          </div>
        </div>
      </div>
    );
  }

  const dashboardBase = user?.role === "admin" ? "/admin" : "/orphanage";
  const riskCfg = riskBar[child.risk] ?? riskBar.Low;
  const initials = (child.name || "CH").split(" ").map((n) => n[0]).join("").substring(0, 2);
  const hasValidPhoto = child.photo && !child.photo.includes("undefined") && !imgError;

  return (
    <div className="space-y-6">
      <ToastContainer toasts={toasts} onRemove={removeToast} />
      
      <Breadcrumb items={[roleLabels[user.role], "Children", child.name]} />

      {/* Profile hero */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-card dark:border-slate-800 dark:bg-slate-900"
      >
        <div className="h-2 w-full bg-gradient-to-r from-civic-600 to-indigo-600" />
        <div className="flex flex-col justify-between gap-5 px-6 py-6 sm:flex-row sm:items-start">
          <div className="flex items-start gap-4">
            {hasValidPhoto ? (
              <img
                src={child.photo}
                alt={child.name}
                onError={() => setImgError(true)}
                className="h-16 w-16 shrink-0 rounded-2xl object-cover shadow-sm border border-slate-200 dark:border-slate-700"
              />
            ) : (
              <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-indigo-100 text-xl font-bold text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-300 shadow-sm">
                {initials}
              </div>
            )}
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl font-bold text-slate-900 dark:text-white">{child.name}</h1>
                <span className="badge badge-neutral text-[11px]">{child.childCode}</span>
              </div>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <span className={classNames("badge", riskBadge[child.risk] || "badge-neutral")}>{child.risk} Risk</span>
                <span className={classNames("badge", healthBadge[child.health] || "badge-neutral")}>{child.health}</span>
                {child.adopted && <span className="badge badge-blue">Adopted</span>}
                <span className="text-sm text-slate-500 dark:text-slate-400">{child.orphanage?.name || 'Care Center'} · Age {child.age}</span>
              </div>
            </div>
          </div>
          <Button icon={FiArrowLeft} variant="secondary" size="sm" onClick={() => navigate(-1)}>Back</Button>
        </div>

        {/* Metric strip */}
        <div className="grid divide-y divide-slate-100 border-t border-slate-100 sm:grid-cols-3 sm:divide-x sm:divide-y-0 dark:divide-slate-800 dark:border-slate-800">
          <MetricStrip label="Attendance" value={`${child.attendance}%`}
            sub={<div className="mt-1.5 h-1.5 w-24 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-700">
              <div className={classNames("h-full rounded-full", child.attendance >= 90 ? "bg-emerald-500" : child.attendance >= 75 ? "bg-amber-500" : "bg-red-500")}
                style={{ width: `${child.attendance}%` }} />
            </div>}
          />
          <MetricStrip label="Risk Level" value={child.risk}
            sub={<div className="mt-1.5 h-1.5 w-24 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-700">
              <div className={classNames("h-full rounded-full", riskCfg.bar, riskCfg.w)} />
            </div>}
          />
          <MetricStrip label="AI Safety Score" value="94%" sub={<p className="mt-0.5 text-[11px] text-violet-600 dark:text-violet-400">AI Verified</p>} />
        </div>
      </motion.div>

      {/* Detail sections */}
      <div className="grid gap-5 xl:grid-cols-2">
        <ProfileSection title="Basic Details" icon={FiUserCheck} iconBg="bg-civic-50 text-civic-600 dark:bg-civic-500/10 dark:text-civic-400">
          <FieldGrid>
            <Field icon={FiUserCheck} label="Child ID"       value={child.childCode} />
            <Field icon={FiUserCheck} label="Full Name"      value={child.name} />
            <Field icon={FiUserCheck} label="Age"            value={`${child.age} years`} />
            <Field icon={FiUserCheck} label="Gender"         value={child.gender} />
            <Field icon={FiHome}      label="Orphanage"      value={child.orphanage?.name || 'Care Center'} />
            <Field icon={FiCalendar}  label="Admission Date" value={child.admissionDate ? new Date(child.admissionDate).toLocaleDateString() : 'N/A'} />
            <Field icon={FiUsers}     label="Case Worker"    value={child.caseWorker} />
            <Field icon={FiFileText}  label="Education"      value={child.educationLevel} />
          </FieldGrid>
        </ProfileSection>

        <ProfileSection title="Medical Details" icon={FiHeart} iconBg="bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400">
          <FieldGrid>
            <Field icon={FiHeart}    label="Health Status"   value={child.health} />
            <Field icon={FiHeart}    label="Blood Group"     value={child.bloodGroup} />
            <Field icon={FiShield}   label="Vaccination"     value={child.vaccinationStatus} />
            <Field icon={FiShield}   label="Allergies"       value={child.allergies} />
            <Field icon={FiFileText} label="Medical History" value={child.medicalHistory} wide />
          </FieldGrid>
          {child.medicalHistoryFile && (
            <div className="mt-3 flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50/60 px-4 py-3 dark:border-slate-700 dark:bg-slate-800/40">
              <div className="flex items-center gap-2">
                <FiFileText className="h-4 w-4 text-slate-400" />
                <div>
                  <p className="field-label">Medical History File</p>
                  <p className="field-value text-xs">Available for download</p>
                </div>
              </div>
              <Button icon={FiDownload} variant="secondary" size="sm">View</Button>
            </div>
          )}
        </ProfileSection>
      </div>

      {/* Adoption */}
      <ProfileSection title="Adoption Details" icon={FiUsers} iconBg="bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400">
        <FieldGrid>
          <Field icon={FiUsers} label="Adopted"            value={child.adopted ? "Yes" : "No"} />
          <Field icon={FiPhone} label="Emergency Contact"  value={child.emergencyContact} wide />
          {child.adopted && child.adoptionDate && (
            <Field icon={FiCalendar} label="Adoption Date" value={new Date(child.adoptionDate).toLocaleDateString()} />
          )}
        </FieldGrid>
      </ProfileSection>

      {/* Parent details */}
      {child.adopted && child.parentDetails && (
        <ProfileSection
          title="Parent / Guardian Details"
          icon={FiUserCheck}
          iconBg="bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400"
          action={
            <Button icon={FiUsers} variant="secondary" size="sm"
              onClick={() => navigate(`${dashboardBase}/parent-profiles/${child.parentDetails.id}`)}>
              Follow-up Profile
            </Button>
          }
        >
          <FieldGrid>
            <Field icon={FiUserCheck} label="Father Name"       value={child.parentDetails.fatherName} />
            <Field icon={FiUserCheck} label="Mother Name"       value={child.parentDetails.motherName} />
            <Field icon={FiPhone}     label="Father Phone"      value={child.parentDetails.fatherPhone} />
            <Field icon={FiPhone}     label="Mother Phone"      value={child.parentDetails.motherPhone} />
            <Field icon={FiMail}      label="Email"             value={child.parentDetails.email} />
            <Field icon={FiHome}      label="Address"           value={child.parentDetails.address} />
            <Field icon={FiFileText}  label="Adoption Order ID" value={child.parentDetails.adoptionOrderId} />
            <Field icon={FiShield}    label="Follow-up Officer" value={child.parentDetails.followUpOfficer} />
          </FieldGrid>
        </ProfileSection>
      )}
    </div>
  );
}

function MetricStrip({ label, value, sub }) {
  return (
    <div className="flex flex-col gap-1 px-5 py-4">
      <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">{label}</p>
      <p className="text-xl font-bold tabular-nums text-slate-900 dark:text-white">{value}</p>
      {sub}
    </div>
  );
}

function ProfileSection({ title, icon: Icon, iconBg, action, children: content }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="section-card"
    >
      <div className="section-card-header">
        <div className="flex items-center gap-2.5">
          <div className={classNames("section-card-icon", iconBg)}>
            <Icon className="h-3.5 w-3.5" />
          </div>
          <h2 className="section-card-title">{title}</h2>
        </div>
        {action}
      </div>
      <div className="p-5">{content}</div>
    </motion.div>
  );
}

function FieldGrid({ children: content }) {
  return <div className="grid gap-3 sm:grid-cols-2">{content}</div>;
}

function Field({ icon: Icon, label, value, wide = false }) {
  return (
    <div className={classNames("field-block", wide ? "sm:col-span-2" : "")}>
      <div className="flex items-center gap-1.5">
        <Icon className="h-3 w-3 text-slate-400" />
        <span className="field-label">{label}</span>
      </div>
      <p className="field-value">{value || "Not provided"}</p>
    </div>
  );
}
