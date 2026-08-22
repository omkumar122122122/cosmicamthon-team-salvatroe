import { useState, useEffect } from "react";
import {
  FiArrowLeft, FiFileText, FiHome, FiLoader, FiMail,
  FiPhone, FiShield, FiUserCheck, FiUsers
} from "react-icons/fi";
import { useNavigate, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import Breadcrumb from "../components/Breadcrumb";
import Button from "../components/Button";
import Card from "../components/Card";
import { PageSkeleton } from "../components/Loader";
import { useAuth } from "../context/AuthContext";
import { roleLabels } from "../utils/constants";
import { classNames } from "../utils/formatters";
import { parentsService } from "../services/parentsService";

export default function ParentProfile() {
  const { parentId } = useParams();
  const navigate     = useNavigate();
  const { user }     = useAuth();

  const [parent, setParent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState("");

  useEffect(() => {
    if (!parentId) return;
    setLoading(true);
    parentsService
      .getParentById(parentId)
      .then((data) => setParent(data))
      .catch((err) => setFetchError(err?.message || "Failed to load parent profile"))
      .finally(() => setLoading(false));
  }, [parentId]);

  if (loading) {
    return <PageSkeleton />;
  }

  if (!parent || fetchError) {
    return (
      <div className="space-y-5">
        <Breadcrumb items={[roleLabels[user?.role] ?? "Portal", "Parent Profile"]} />
        <Card>
          <div className="flex flex-col items-center gap-4 px-6 py-12 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gray-100 dark:bg-slate-800">
              <FiUsers className="h-6 w-6 text-slate-400" />
            </div>
            <div>
              <h1 className="text-base font-bold text-slate-900 dark:text-white">Parent Profile Not Available</h1>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                {fetchError || "This parent record could not be found."}
              </p>
            </div>
            <Button icon={FiArrowLeft} onClick={() => navigate(-1)}>Back</Button>
          </div>
        </Card>
      </div>
    );
  }

  // Normalize field names from backend ParentProfileDto
  const fullName    = `${parent.firstName ?? ""} ${parent.lastName ?? ""}`.trim();
  const initials    = fullName.split(" ").map(n => n[0]).join("").slice(0, 2) || "P";
  const address     = parent.addresses?.[0];
  const addressStr  = address
    ? `${address.addressLine1 ?? ""}, ${address.city ?? ""}, ${address.state ?? ""}`.replace(/^,\s*|,\s*$/g, "")
    : "Not provided";

  return (
    <div className="space-y-5">
      <Breadcrumb items={[roleLabels[user?.role] ?? "Portal", "Parent Profile", parent.id]} />

      {/* Page header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-emerald-100 text-xl font-bold text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300">
            {initials}
          </div>
          <div>
            <h1 className="page-title">Parent / Guardian Profile</h1>
            <p className="page-subtitle">{fullName} · {parent.email}</p>
          </div>
        </div>
        <Button icon={FiArrowLeft} variant="secondary" onClick={() => navigate(-1)}>Back</Button>
      </div>

      {/* Status strip */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: "Verification",  value: parent.verificationStatus  ?? "PENDING",  ok: parent.verificationStatus === "APPROVED" },
          { label: "KYC Status",    value: parent.kycStatus           ?? "PENDING",  ok: parent.kycStatus === "APPROVED" },
          { label: "Trust Score",   value: `${parent.trustScore ?? 0}/100`,           ok: (parent.trustScore ?? 0) >= 70 },
          { label: "Active",        value: parent.isActive ? "Yes" : "No",            ok: parent.isActive },
        ].map((b) => (
          <div
            key={b.label}
            className={`rounded-xl border px-4 py-3 ${
              b.ok
                ? "border-green-100 bg-green-50 dark:border-green-500/20 dark:bg-green-500/10"
                : "border-amber-100 bg-amber-50 dark:border-amber-500/20 dark:bg-amber-500/10"
            }`}
          >
            <p className="text-[10px] font-semibold text-slate-500 dark:text-slate-400">{b.label}</p>
            <p className={`mt-1 text-sm font-bold ${b.ok ? "text-green-700 dark:text-green-400" : "text-amber-700 dark:text-amber-400"}`}>
              {b.value}
            </p>
          </div>
        ))}
      </div>

      {/* Personal details */}
      <ProfileSection title="Personal Details" icon={FiUserCheck}>
        <Field icon={FiUserCheck} label="Full Name"        value={fullName} />
        <Field icon={FiMail}      label="Email"            value={parent.email} />
        <Field icon={FiPhone}     label="Phone"            value={parent.phone} />
        <Field icon={FiUsers}     label="Gender"           value={parent.gender} />
        <Field icon={FiShield}    label="Nationality"      value={parent.nationality} />
        <Field icon={FiUsers}     label="Marital Status"   value={parent.maritalStatus} />
        <Field icon={FiHome}      label="Address"          value={addressStr} wide />
      </ProfileSection>

      {/* Professional details */}
      <ProfileSection title="Professional & Financial" icon={FiFileText}>
        <Field icon={FiFileText}  label="Occupation"       value={parent.occupation} />
        <Field icon={FiFileText}  label="Annual Income"    value={parent.annualIncome ? `₹${Number(parent.annualIncome).toLocaleString("en-IN")}` : undefined} />
        <Field icon={FiHome}      label="House Ownership"  value={parent.houseOwnership} />
      </ProfileSection>

      {/* Documents */}
      {parent.documents?.length > 0 && (
        <ProfileSection title="Documents" icon={FiShield}>
          {parent.documents.map((doc) => (
            <Field
              key={doc.id}
              icon={FiFileText}
              label={doc.documentType}
              value={`${doc.status}${doc.fileName ? ` — ${doc.fileName}` : ""}`}
              ok={doc.status === "APPROVED"}
            />
          ))}
        </ProfileSection>
      )}
    </div>
  );
}

function ProfileSection({ title, icon: Icon, children: content }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-card dark:border-slate-800 dark:bg-slate-900"
    >
      <div className="flex items-center gap-2 border-b border-gray-100 px-5 py-4 dark:border-slate-800">
        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400">
          <Icon className="h-3.5 w-3.5" />
        </div>
        <h2 className="text-sm font-bold text-slate-900 dark:text-white">{title}</h2>
      </div>
      <dl className="grid gap-3 p-5 sm:grid-cols-2 xl:grid-cols-3">{content}</dl>
    </motion.div>
  );
}

function Field({ icon: Icon, label, value, wide = false }) {
  return (
    <div className={classNames("field-block", wide ? "sm:col-span-2 xl:col-span-3" : "")}>
      <div className="flex items-center gap-1.5">
        <Icon className="h-3.5 w-3.5 text-slate-400" />
        <span className="field-label">{label}</span>
      </div>
      <p className="field-value">{value || "Not provided"}</p>
    </div>
  );
}
