import {
  FiBriefcase, FiCamera, FiCreditCard, FiFileText,
  FiHome, FiLogOut, FiMail, FiPhone, FiShield,
  FiUserCheck, FiUsers, FiHeart, FiCheckCircle, FiUser
} from "react-icons/fi";
import { motion } from "framer-motion";
import { useState } from "react";
import Breadcrumb from "../components/Breadcrumb";
import Button from "../components/Button";
import ProfileActions from "../components/ProfileActions";
import { useAuth } from "../context/AuthContext";
import { changePassword, updateMe } from "../services/authService";
import { children, orphanages } from "../data/dummyData";
import { roleLabels } from "../utils/constants";
import { classNames } from "../utils/formatters";
import ChangePasswordModal from "../components/ChangePasswordModal";
import EditProfileModal from "../components/EditProfileModal";

/* ── role avatar colours ─────────────────────────────────── */
const roleAvatarBg = {
  admin:     "bg-indigo-600",
  orphanage: "bg-civic-600",
  parent:    "bg-emerald-600",
};

const roleBadge = {
  admin:     "bg-indigo-50 text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-400",
  orphanage: "bg-civic-50 text-civic-700 dark:bg-civic-500/10 dark:text-civic-400",
  parent:    "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400",
};

/* ════════════════════════════════════════════════════════════
   MAIN
═══════════════════════════════════════════════════════════ */
export default function Profile() {
  const { user, logout, updateUser } = useAuth();
  const isAdmin     = user?.role === "admin";
  const isParent    = user?.role === "parent";
  const isOrphanage = user?.role === "orphanage";
  const orphanage   = orphanages.find((o) => o.name === user.department);
  const child       = children[1]; // linked child for parent demo

  // Modal states
  const [editProfileOpen, setEditProfileOpen] = useState(false);
  const [changePasswordOpen, setChangePasswordOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [notification, setNotification] = useState(null);

  const handleEditProfile = async (data) => {
    setActionLoading(true);
    try {
      await updateUser(data);
      setNotification({ type: "success", message: "Profile updated successfully" });
      setTimeout(() => setNotification(null), 3000);
    } catch (error) {
      setNotification({ type: "error", message: error.message || "Failed to update profile" });
      setTimeout(() => setNotification(null), 3000);
      throw error;
    } finally {
      setActionLoading(false);
    }
  };

  const handleChangePassword = async (data) => {
    setActionLoading(true);
    try {
      await changePassword(data);
      setNotification({ type: "success", message: "Password changed successfully. Please log in again." });
      setTimeout(() => setNotification(null), 3000);
    } catch (error) {
      setNotification({ type: "error", message: error.message || "Failed to change password" });
      setTimeout(() => setNotification(null), 3000);
      throw error;
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="space-y-5">
      <Breadcrumb items={[roleLabels[user.role], "Profile"]} />

      {/* Notification */}
      {notification && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className={classNames(
            "rounded-xl px-4 py-3 text-sm font-medium",
            notification.type === "success"
              ? "bg-green-50 text-green-700 dark:bg-green-500/10 dark:text-green-400"
              : "bg-red-50 text-red-700 dark:bg-red-500/10 dark:text-red-400"
          )}
        >
          {notification.message}
        </motion.div>
      )}

      {/* ── Hero header card ─────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-card dark:border-slate-800 dark:bg-slate-900"
      >
        {/* top colour bar */}
        <div className={classNames("h-2 w-full", roleAvatarBg[user.role] ?? "bg-slate-600")} />

        <div className="flex flex-col gap-5 px-6 py-5 sm:flex-row sm:items-start sm:justify-between">
          {/* left: avatar + name */}
          <div className="flex items-center gap-4">
            <div className={classNames(
              "flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl text-2xl font-bold text-white shadow-sm",
              roleAvatarBg[user.role] ?? "bg-slate-600"
            )}>
              {user.avatar ?? <FiUser className="h-7 w-7" />}
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-lg font-bold text-slate-900 dark:text-white">{user.name}</h1>
                <span className="inline-flex items-center gap-1 rounded-full bg-green-50 px-2 py-0.5 text-xs font-semibold text-green-700 ring-1 ring-green-200 dark:bg-green-500/10 dark:text-green-400 dark:ring-green-500/20">
                  <FiCheckCircle className="h-3 w-3" />
                  Active
                </span>
                <span className={classNames("rounded-md px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide", roleBadge[user.role] ?? "bg-slate-100 text-slate-600")}>
                  {user.role}
                </span>
              </div>
              <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">{user.department}</p>
              {user.email && <p className="mt-0.5 text-xs text-slate-400 dark:text-slate-500">{user.email}</p>}
            </div>
          </div>

          {/* right: quick stats */}
          <div className="flex shrink-0 flex-wrap gap-3">
            {isAdmin && (
              <>
                <StatPill label="Role"       value="Administrator" />
                <StatPill label="Access"     value="Full System"   />
              </>
            )}
            {isParent && (
              <>
                <StatPill label="KYC"        value="Verified"      color="green" />
                <StatPill label="Trust Score"value="95 / 100"      color="civic" />
                <StatPill label="Risk Level" value="Low"           color="green" />
              </>
            )}
            {isOrphanage && orphanage && (
              <>
                <StatPill label="Children"   value={`${orphanage.occupancy} in care`} />
                <StatPill label="Compliance" value={`${orphanage.compliance}%`}       color="green" />
              </>
            )}
          </div>
        </div>

        {/* profile actions */}
        <div className="border-t border-gray-100 dark:border-slate-800">
          <ProfileActions 
            onEdit={() => setEditProfileOpen(true)} 
            onChangePassword={() => setChangePasswordOpen(true)} 
          />
        </div>
      </motion.div>

      {/* Edit Profile Modal */}
      <EditProfileModal
        isOpen={editProfileOpen}
        onClose={() => setEditProfileOpen(false)}
        user={user}
        onSave={handleEditProfile}
        loading={actionLoading}
      />

      {/* Change Password Modal */}
      <ChangePasswordModal
        isOpen={changePasswordOpen}
        onClose={() => setChangePasswordOpen(false)}
        onSave={handleChangePassword}
        loading={actionLoading}
      />

      {/* ── Contact & identity info ───────────────────────────── */}
      <SectionCard title="Personal Information" icon={FiUser}>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          <Field label="Full Name"    value={user.name} />
          <Field label="Email"        value={user.email} />
          <Field label="Phone"        value={user.phone} />
          <Field label="Employee ID"  value={user.employeeId} />
          <Field label="Department"   value={user.department} />
          <Field label="Designation"  value={user.designation} />
          <Field label="Joining Date" value={user.joiningDate} />
          <Field label="Role"         value={roleLabels[user.role]} />
        </div>
      </SectionCard>

      {/* ── Role-specific details ─────────────────────────────── */}
      {isParent && <ParentDetails child={child} />}
      {isOrphanage && orphanage && <OrphanageProfileDetails orphanage={orphanage} />}

      {/* ── Sign out ──────────────────────────────────────────── */}
      <LogoutSection onLogout={logout} />
    </div>
  );
}

/* ════════════════════════════════════════════════════════════
   PARENT — Linked Child & Adoption Details
═══════════════════════════════════════════════════════════ */
function ParentDetails({ child }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.08 }}
      className="space-y-5"
    >
      {/* Linked child card */}
      <SectionCard title="Linked Child Welfare Profile" icon={FiHeart} iconBg="bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400">
        {/* child avatar row */}
        <div className="mb-4 flex items-center gap-4 rounded-xl border border-gray-100 bg-gray-50 p-4 dark:border-slate-700 dark:bg-slate-800/50">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-indigo-100 text-sm font-bold text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-300">
            {child.name.split(" ").map(n => n[0]).join("")}
          </div>
          <div className="min-w-0 flex-1">
            <p className="font-bold text-slate-900 dark:text-white">{child.name}</p>
            <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
              {child.orphanage} · Age {child.age} · {child.educationLevel}
            </p>
          </div>
          <HealthBadge status={child.health} />
        </div>
        {/* fields grid */}
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          <Field label="Child ID"             value={child.id} />
          <Field label="Full Name"            value={child.name} />
          <Field label="Age"                  value={`${child.age} years`} />
          <Field label="Gender"               value={child.gender} />
          <Field label="Blood Group"          value={child.bloodGroup} />
          <Field label="Orphanage"            value={child.orphanage} />
          <Field label="Education Level"      value={child.educationLevel} />
          <Field label="Admission Date"       value={child.admissionDate} />
          <Field label="Case Worker"          value={child.caseWorker} />
          <Field label="Health Status"        value={child.health} />
          <Field label="Vaccination Status"   value={child.vaccinationStatus} />
          <Field label="Attendance"           value={`${child.attendance}%`} />
          <Field label="Allergies"            value={child.allergies} wide />
          <Field label="Medical History"      value={child.medicalHistory} wide />
          <Field label="Emergency Contact"    value={child.emergencyContact} wide />
        </div>
      </SectionCard>

      {/* Parent AI verification summary */}
      <SectionCard title="AI Verification Summary" icon={FiShield} iconBg="bg-civic-50 text-civic-600 dark:bg-civic-500/10 dark:text-civic-400">
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          <AiMetric label="KYC Status"           value="Verified"          color="green" />
          <AiMetric label="Face Match"           value="99%"               color="civic" />
          <AiMetric label="AI Trust Score"       value="95 / 100"          color="civic" />
          <AiMetric label="Document Verification"value="All Verified"      color="green" />
          <AiMetric label="Background Check"     value="Passed"            color="green" />
          <AiMetric label="Risk Level"           value="Low"               color="green" />
        </div>
      </SectionCard>
    </motion.div>
  );
}

/* ════════════════════════════════════════════════════════════
   ORPHANAGE — Full Profile Details
═══════════════════════════════════════════════════════════ */
function OrphanageProfileDetails({ orphanage }) {
  const sections = [
    {
      title:  "Orphanage Registration Details",
      icon:   FiHome,
      fields: [
        [FiHome,      "Orphanage Name",         orphanage.name],
        [FiFileText,  "Registration Number",    orphanage.registrationNumber],
        [FiShield,    "Govt License Number",    orphanage.governmentLicenseNumber],
        [FiFileText,  "Date of Establishment",  orphanage.establishmentDate],
        [FiBriefcase, "Type of Organization",   orphanage.organizationType],
        [FiUsers,     "Number of Children",     orphanage.numberOfChildren],
        [FiUsers,     "Capacity",               orphanage.capacity],
      ],
      cols: "sm:grid-cols-2 xl:grid-cols-3",
    },
    {
      title:  "Contact Information",
      icon:   FiMail,
      fields: [
        [FiMail,  "Official Email",      orphanage.officialEmail],
        [FiPhone, "Phone Number",        orphanage.phone],
        [FiPhone, "Alternative Contact", orphanage.alternativeContact],
        [FiHome,  "Website",             orphanage.website],
      ],
      cols: "sm:grid-cols-2 xl:grid-cols-4",
    },
    {
      title:  "Administrator Details",
      icon:   FiUserCheck,
      fields: [
        [FiUserCheck,  "Administrator Name", orphanage.administrator.name],
        [FiBriefcase,  "Designation",        orphanage.administrator.designation],
        [FiPhone,      "Mobile Number",      orphanage.administrator.mobile],
        [FiMail,       "Email",              orphanage.administrator.email],
      ],
      cols: "sm:grid-cols-2 xl:grid-cols-4",
    },
    {
      title:  "Child Information Summary",
      icon:   FiUsers,
      fields: [
        [FiUsers, "Total Boys",              orphanage.childSummary?.totalBoys],
        [FiUsers, "Total Girls",             orphanage.childSummary?.totalGirls],
        [FiUsers, "Children Below 5 Years",  orphanage.childSummary?.below5],
        [FiUsers, "Children 5–12 Years",     orphanage.childSummary?.age5To12],
        [FiUsers, "Children Above 12 Years", orphanage.childSummary?.above12],
        [FiUsers, "Special Needs Children",  orphanage.childSummary?.specialNeeds],
      ],
      cols: "sm:grid-cols-2 xl:grid-cols-3",
    },
    {
      title:  "Staff Details",
      icon:   FiBriefcase,
      fields: [
        [FiUsers,  "Total Staff",     orphanage.staff?.totalStaff],
        [FiUsers,  "Caretakers",      orphanage.staff?.caretakers],
        [FiUsers,  "Teachers",        orphanage.staff?.teachers],
        [FiUsers,  "Medical Staff",   orphanage.staff?.medicalStaff],
        [FiShield, "Security Guards", orphanage.staff?.securityGuards],
        [FiUsers,  "Volunteers",      orphanage.staff?.volunteers],
      ],
      cols: "sm:grid-cols-2 xl:grid-cols-3",
    },
    {
      title:  "AI Safety Details",
      icon:   FiCamera,
      fields: [
        [FiCamera, "Face Recognition Enabled",     orphanage.aiSafety?.faceRecognitionEnabled],
        [FiCamera, "CCTV Cameras Installed",        orphanage.aiSafety?.cctvInstalled],
        [FiCamera, "Number of Cameras",             String(orphanage.aiSafety?.numberOfCameras ?? "—")],
        [FiShield, "Visitor Face Verification",     orphanage.aiSafety?.visitorFaceVerificationEnabled],
        [FiShield, "GPS Tracking",                  orphanage.aiSafety?.gpsTrackingAvailable],
        [FiShield, "Emergency Alert System",        orphanage.aiSafety?.emergencyAlertSystemEnabled],
      ],
      cols: "sm:grid-cols-2 xl:grid-cols-3",
    },
  ];

  return (
    <div className="space-y-5">
      {sections.map((sec) => (
        <motion.div
          key={sec.title}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-card dark:border-slate-800 dark:bg-slate-900"
        >
          <div className="flex items-center gap-2.5 border-b border-gray-100 px-5 py-4 dark:border-slate-800">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-civic-50 text-civic-600 dark:bg-civic-500/10 dark:text-civic-400">
              <sec.icon className="h-3.5 w-3.5" />
            </div>
            <h2 className="text-sm font-bold text-slate-900 dark:text-white">{sec.title}</h2>
          </div>
          <dl className={`grid gap-3 p-5 ${sec.cols}`}>
            {sec.fields.map(([Icon, label, value]) => (
              <Field key={label} icon={Icon} label={label} value={value} />
            ))}
          </dl>
        </motion.div>
      ))}

      {/* Facilities */}
      <motion.div
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-card dark:border-slate-800 dark:bg-slate-900"
      >
        <div className="flex items-center gap-2.5 border-b border-gray-100 px-5 py-4 dark:border-slate-800">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-green-50 text-green-600 dark:bg-green-500/10 dark:text-green-400">
            <FiCheckCircle className="h-3.5 w-3.5" />
          </div>
          <h2 className="text-sm font-bold text-slate-900 dark:text-white">Facilities Available</h2>
        </div>
        <div className="grid gap-2 p-5 sm:grid-cols-2 xl:grid-cols-5">
          {(orphanage.facilities ?? ["Not provided"]).map((f) => (
            <div key={f} className="flex items-center gap-2 rounded-xl border border-gray-100 bg-gray-50 px-3 py-2.5 dark:border-slate-700 dark:bg-slate-800">
              <span className="h-2 w-2 shrink-0 rounded-full bg-green-500" />
              <span className="text-xs font-medium text-slate-700 dark:text-slate-200">{f}</span>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════
   SHARED SUB-COMPONENTS
═══════════════════════════════════════════════════════════ */
function SectionCard({ title, icon: Icon, iconBg = "bg-civic-50 text-civic-600 dark:bg-civic-500/10 dark:text-civic-400", children: content }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-card dark:border-slate-800 dark:bg-slate-900"
    >
      <div className="flex items-center gap-2.5 border-b border-gray-100 px-5 py-4 dark:border-slate-800">
        <div className={classNames("flex h-7 w-7 items-center justify-center rounded-lg", iconBg)}>
          <Icon className="h-3.5 w-3.5" />
        </div>
        <h2 className="text-sm font-bold text-slate-900 dark:text-white">{title}</h2>
      </div>
      <div className="p-5">{content}</div>
    </motion.div>
  );
}

function Field({ icon: Icon, label, value, wide = false }) {
  return (
    <div className={classNames("field-block min-w-0", wide ? "sm:col-span-2 xl:col-span-3" : "")}>
      {Icon ? (
        <div className="flex items-center gap-1.5">
          <Icon className="h-3.5 w-3.5 shrink-0 text-slate-400" />
          <span className="field-label">{label}</span>
        </div>
      ) : (
        <span className="field-label">{label}</span>
      )}
      <p className="field-value mt-1.5 truncate" title={String(value || "Not provided")}>
        {value || "Not provided"}
      </p>
    </div>
  );
}

function StatPill({ label, value, color = "default" }) {
  const colors = {
    default: "border-gray-100 bg-gray-50 dark:border-slate-700 dark:bg-slate-800",
    green:   "border-green-100 bg-green-50 dark:border-green-500/20 dark:bg-green-500/10",
    civic:   "border-civic-100 bg-civic-50 dark:border-civic-500/20 dark:bg-civic-500/10",
  };
  const textColors = {
    default: "text-slate-700 dark:text-slate-200",
    green:   "text-green-700 dark:text-green-400",
    civic:   "text-civic-700 dark:text-civic-400",
  };
  return (
    <div className={classNames("rounded-xl border px-3 py-2 text-center", colors[color] ?? colors.default)}>
      <p className="text-[10px] font-semibold text-slate-500 dark:text-slate-400">{label}</p>
      <p className={classNames("mt-0.5 text-sm font-bold", textColors[color] ?? textColors.default)}>{value}</p>
    </div>
  );
}

function AiMetric({ label, value, color = "civic" }) {
  const colors = {
    green: "bg-green-50 text-green-700 dark:bg-green-500/10 dark:text-green-400",
    civic: "bg-civic-50 text-civic-700 dark:bg-civic-500/10 dark:text-civic-400",
  };
  return (
    <div className="field-block">
      <span className="field-label">{label}</span>
      <p className={classNames("mt-1.5 inline-block rounded-lg px-2.5 py-1 text-xs font-bold", colors[color] ?? colors.civic)}>
        {value}
      </p>
    </div>
  );
}

function HealthBadge({ status }) {
  const cfg = {
    Stable:         "bg-green-50 text-green-700 ring-green-200 dark:bg-green-500/10 dark:text-green-400 dark:ring-green-500/20",
    Observation:    "bg-amber-50 text-amber-700 ring-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:ring-amber-500/20",
    "Needs Review": "bg-red-50 text-red-700 ring-red-200 dark:bg-red-500/10 dark:text-red-400 dark:ring-red-500/20",
  };
  return (
    <span className={classNames("inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1", cfg[status] ?? cfg["Observation"])}>
      {status}
    </span>
  );
}

function LogoutSection({ onLogout }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl border border-red-100 bg-red-50 p-5 dark:border-red-500/20 dark:bg-red-500/5"
    >
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <p className="text-sm font-bold text-red-800 dark:text-red-200">Sign Out</p>
          <p className="mt-0.5 text-xs text-red-600 dark:text-red-400">End the current secure dashboard session.</p>
        </div>
        <Button variant="danger" icon={FiLogOut} onClick={onLogout} className="shrink-0">Sign Out</Button>
      </div>
    </motion.div>
  );
}
