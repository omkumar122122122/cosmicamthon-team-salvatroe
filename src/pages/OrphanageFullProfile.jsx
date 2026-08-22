import { useState, useEffect } from "react";
import {
  FiArrowLeft, FiBriefcase, FiCamera, FiCreditCard,
  FiFileText, FiHome, FiMail, FiPhone, FiShield, FiUserCheck, FiUsers
} from "react-icons/fi";
import { useNavigate, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import Breadcrumb from "../components/Breadcrumb";
import { PageSkeleton } from "../components/Loader";
import Button from "../components/Button";
import { orphanagesService } from "../services/orphanagesService";
import { classNames } from "../utils/formatters";

export default function OrphanageFullProfile() {
  const { orphanageId } = useParams();
  const navigate = useNavigate();
  const [orphanage, setOrphanage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadProfile();
  }, [orphanageId]);

  async function loadProfile() {
    try {
      setLoading(true);
      setError(null);
      const data = await orphanagesService.getProfile(orphanageId);
      setOrphanage(data);
    } catch (err) {
      console.error('Failed to load profile:', err);
      setError(err.message || 'Failed to load profile');
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return <PageSkeleton />;
  }

  if (error || !orphanage) {
    return (
      <div className="space-y-5">
        <Breadcrumb items={["Admin", "Orphanages", "Full Profile"]} />
        <div className="flex flex-col items-center gap-4 rounded-2xl border border-gray-100 bg-white px-6 py-12 text-center shadow-card dark:border-slate-800 dark:bg-slate-900">
          <h1 className="text-base font-bold text-slate-900 dark:text-white">Orphanage Profile Not Found</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">{error || 'This detailed orphanage profile is not available.'}</p>
          <Button icon={FiArrowLeft} onClick={() => navigate(-1)}>Back</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <Breadcrumb items={["Admin", "Orphanages", orphanage.name, "Full Profile"]} />

      {/* Page header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-indigo-100 text-xl font-bold text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-300">
            {orphanage.name.split(" ").map(w => w[0]).join("").slice(0, 2)}
          </div>
          <div>
            <h1 className="page-title">{orphanage.name}</h1>
            <p className="page-subtitle">Full orphanage registration and safety profile</p>
          </div>
        </div>
        <Button icon={FiArrowLeft} variant="secondary" onClick={() => navigate(-1)}>Back</Button>
      </div>

      <div className="grid gap-5 xl:grid-cols-[1fr_300px] xl:items-start">

        {/* Left — all detail sections */}
        <div className="space-y-5">
          <Section title="Organization Details">
            <Field icon={FiHome}      label="Orphanage Name"         value={orphanage.name} />
            <Field icon={FiFileText}  label="Registration Number"    value={orphanage.registrationNumber} />
            <Field icon={FiShield}    label="Govt License Number"    value={orphanage.governmentLicenseNumber} />
            <Field icon={FiFileText}  label="Date of Establishment"  value={orphanage.establishmentDate} />
            <Field icon={FiBriefcase} label="Type of Organization"   value={orphanage.organizationType} />
            <Field icon={FiUsers}     label="Number of Children"     value={orphanage.numberOfChildren} />
            <Field icon={FiUsers}     label="Capacity"               value={orphanage.capacity} />
          </Section>

          <Section title="Contact Information" cols="xl:grid-cols-4">
            <Field icon={FiMail}  label="Official Email"      value={orphanage.officialEmail} />
            <Field icon={FiPhone} label="Phone Number"        value={orphanage.phone} />
            <Field icon={FiPhone} label="Alternative Contact" value={orphanage.alternativeContact} />
            <Field icon={FiHome}  label="Website"             value={orphanage.website} />
          </Section>

          <Section title="Address">
            <Field icon={FiHome} label="Country"      value={orphanage.country} />
            <Field icon={FiHome} label="State"        value={orphanage.state} />
            <Field icon={FiHome} label="District"     value={orphanage.district} />
            <Field icon={FiHome} label="City"         value={orphanage.city} />
            <Field icon={FiHome} label="PIN Code"     value={orphanage.pinCode} />
            <Field icon={FiHome} label="Full Address" value={orphanage.fullAddress} wide />
          </Section>

          <Section title="Administrator Details">
            <Field icon={FiUserCheck}  label="Administrator Name" value={orphanage.administrator?.name} />
            <Field icon={FiBriefcase}  label="Designation"        value={orphanage.administrator?.designation} />
            <Field icon={FiPhone}      label="Mobile Number"      value={orphanage.administrator?.mobile} />
            <Field icon={FiMail}       label="Email"              value={orphanage.administrator?.email} />
            <Field icon={FiFileText}   label="Profile Photo"      value={orphanage.administrator?.profilePhoto} />
          </Section>

          <Section title="Identity Verification (KYC)">
            <Field icon={FiFileText}  label="Registration Certificate"  value={orphanage.kyc?.registrationCertificate} />
            <Field icon={FiFileText}  label="NGO Certificate"           value={orphanage.kyc?.ngoCertificate} />
            <Field icon={FiFileText}  label="Government License"        value={orphanage.kyc?.governmentLicense} />
            <Field icon={FiFileText}  label="Administrator ID Proof"    value={orphanage.kyc?.administratorIdProof} />
            <Field icon={FiCreditCard} label="PAN Card"                 value={orphanage.kyc?.panCard} />
            <Field icon={FiCreditCard} label="GST Number"               value={orphanage.kyc?.gstNumber} />
            <Field icon={FiHome}       label="Address Proof"            value={orphanage.kyc?.addressProof} />
          </Section>

          <Section title="Child Information Summary">
            <Field icon={FiUsers} label="Total Boys"                value={orphanage.childSummary?.totalBoys} />
            <Field icon={FiUsers} label="Total Girls"               value={orphanage.childSummary?.totalGirls} />
            <Field icon={FiUsers} label="Children Below 5 Years"   value={orphanage.childSummary?.below5} />
            <Field icon={FiUsers} label="Children 5–12 Years"      value={orphanage.childSummary?.age5To12} />
            <Field icon={FiUsers} label="Children Above 12 Years"  value={orphanage.childSummary?.above12} />
            <Field icon={FiUsers} label="Special Needs Children"   value={orphanage.childSummary?.specialNeeds} />
          </Section>

          <Section title="Staff Details">
            <Field icon={FiUsers}  label="Total Staff"      value={orphanage.staff?.totalStaff} />
            <Field icon={FiUsers}  label="Caretakers"       value={orphanage.staff?.caretakers} />
            <Field icon={FiUsers}  label="Teachers"         value={orphanage.staff?.teachers} />
            <Field icon={FiUsers}  label="Medical Staff"    value={orphanage.staff?.medicalStaff} />
            <Field icon={FiShield} label="Security Guards"  value={orphanage.staff?.securityGuards} />
            <Field icon={FiUsers}  label="Volunteers"       value={orphanage.staff?.volunteers} />
          </Section>

          {/* Facilities */}
          <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-card dark:border-slate-800 dark:bg-slate-900">
            <SectionHeader title="Facilities Available" />
            <div className="grid gap-2 p-5 sm:grid-cols-2 xl:grid-cols-5">
              {(orphanage.facilities?.length ? orphanage.facilities : ["Not provided"]).map((f, idx) => (
                <div key={idx} className="flex items-center gap-2 rounded-xl border border-gray-100 bg-gray-50 px-3 py-2.5 dark:border-slate-700 dark:bg-slate-800">
                  <div className="h-2 w-2 rounded-full bg-green-500" />
                  <span className="text-xs font-medium text-slate-700 dark:text-slate-200">{f}</span>
                </div>
              ))}
            </div>
          </div>

          <Section title="Emergency Contact" cols="xl:grid-cols-4">
            <Field icon={FiUserCheck}  label="Contact Person"    value={orphanage.emergencyContact?.contactPerson} />
            <Field icon={FiPhone}      label="Mobile Number"     value={orphanage.emergencyContact?.mobile} />
            <Field icon={FiMail}       label="Email"             value={orphanage.emergencyContact?.email} />
            <Field icon={FiBriefcase}  label="Relationship/Role" value={orphanage.emergencyContact?.relationship} />
          </Section>

          <Section title="AI Safety Details">
            <Field icon={FiCamera}  label="Face Recognition Enabled"       value={orphanage.aiSafety?.faceRecognitionEnabled} />
            <Field icon={FiCamera}  label="CCTV Cameras Installed"          value={orphanage.aiSafety?.cctvInstalled} />
            <Field icon={FiCamera}  label="Number of Cameras"               value={orphanage.aiSafety?.numberOfCameras} />
            <Field icon={FiShield}  label="Visitor Face Verification"        value={orphanage.aiSafety?.visitorFaceVerificationEnabled} />
            <Field icon={FiUsers}   label="Child Attendance System"          value={orphanage.aiSafety?.childAttendanceSystem} />
            <Field icon={FiShield}  label="GPS Tracking"                     value={orphanage.aiSafety?.gpsTrackingAvailable} />
            <Field icon={FiShield}  label="Emergency Alert System"           value={orphanage.aiSafety?.emergencyAlertSystemEnabled} />
          </Section>

          <Section title="Bank Details" cols="xl:grid-cols-4">
            <Field icon={FiCreditCard}  label="Bank Name"            value={orphanage.bankDetails?.bankName} />
            <Field icon={FiUserCheck}   label="Account Holder Name"  value={orphanage.bankDetails?.accountHolderName} />
            <Field icon={FiCreditCard}  label="Account Number"       value={orphanage.bankDetails?.accountNumber} />
            <Field icon={FiCreditCard}  label="IFSC Code"            value={orphanage.bankDetails?.ifscCode} />
          </Section>
        </div>

        {/* Right — sticky summary sidebar */}
        <div className="space-y-4 xl:sticky xl:top-20">
          <SnapshotCard title="Quick Overview">
            <Field icon={FiHome}   label="Name"                value={orphanage.name} />
            <Field icon={FiUsers}  label="Children / Capacity" value={`${orphanage.numberOfChildren} / ${orphanage.capacity}`} />
            <Field icon={FiShield} label="Compliance"          value={`${orphanage.compliance}%`} />
            <Field icon={FiBriefcase} label="Org Type"         value={orphanage.organizationType} />
          </SnapshotCard>

          <SnapshotCard title="Contact Snapshot">
            <Field icon={FiMail}  label="Official Email" value={orphanage.officialEmail} />
            <Field icon={FiPhone} label="Phone"          value={orphanage.phone} />
            <Field icon={FiHome}  label="City"           value={orphanage.city} />
            <Field icon={FiHome}  label="District"       value={orphanage.district} />
          </SnapshotCard>

          <SnapshotCard title="AI Safety Snapshot">
            <Field icon={FiCamera}  label="Face Recognition"   value={orphanage.aiSafety?.faceRecognitionEnabled} />
            <Field icon={FiCamera}  label="CCTV Installed"     value={orphanage.aiSafety?.cctvInstalled} />
            <Field icon={FiShield}  label="Emergency Alerts"   value={orphanage.aiSafety?.emergencyAlertSystemEnabled} />
          </SnapshotCard>
        </div>
      </div>
    </div>
  );
}

/* ── Sub-components ───────────────────────────────────────── */
function SectionHeader({ title }) {
  return (
    <div className="border-b border-gray-100 px-5 py-4 dark:border-slate-800">
      <h2 className="text-sm font-bold text-slate-900 dark:text-white">{title}</h2>
    </div>
  );
}

function Section({ title, cols = "xl:grid-cols-3", children: content }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-card dark:border-slate-800 dark:bg-slate-900"
    >
      <SectionHeader title={title} />
      <dl className={`grid gap-3 p-5 sm:grid-cols-2 ${cols}`}>{content}</dl>
    </motion.div>
  );
}

function SnapshotCard({ title, children: content }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-card dark:border-slate-800 dark:bg-slate-900">
      <SectionHeader title={title} />
      <div className="grid gap-3 p-4">{content}</div>
    </div>
  );
}

function Field({ icon: Icon, label, value, wide = false }) {
  return (
    <div className={classNames("field-block", wide ? "sm:col-span-2" : "")}>
      <div className="flex items-center gap-1.5">
        <Icon className="h-3.5 w-3.5 text-slate-400" />
        <span className="field-label">{label}</span>
      </div>
      <p className="field-value">{value || "Not provided"}</p>
    </div>
  );
}
