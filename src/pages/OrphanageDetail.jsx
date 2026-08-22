import { useState, useEffect } from "react";
import { FiArrowLeft, FiFileText, FiHome, FiPhone, FiShield, FiUsers, FiExternalLink } from "react-icons/fi";
import { useNavigate, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import Breadcrumb from "../components/Breadcrumb";
import { PageSkeleton } from "../components/Loader";
import Button from "../components/Button";
import Card from "../components/Card";
import { orphanagesService } from "../services/orphanagesService";
import { classNames } from "../utils/formatters";

export default function OrphanageDetail() {
  const { orphanageId } = useParams();
  const navigate = useNavigate();
  const [orphanage, setOrphanage] = useState(null);
  const [statistics, setStatistics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadData();
  }, [orphanageId]);

  async function loadData() {
    try {
      setLoading(true);
      setError(null);
      const [orphanageData, statsData] = await Promise.all([
        orphanagesService.getById(orphanageId),
        orphanagesService.getStatistics(orphanageId),
      ]);
      setOrphanage(orphanageData);
      setStatistics(statsData);
    } catch (err) {
      console.error('Failed to load orphanage:', err);
      setError(err.message || 'Failed to load orphanage');
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return <PageSkeleton />;
  }

  // Ensure orphanage has required fields with defaults
  const orphanageData = {
    name: orphanage?.name || "Unknown Orphanage",
    code: orphanage?.code || "",
    city: orphanage?.city || "",
    compliance: orphanage?.compliance ?? 0,
    capacity: orphanage?.capacity ?? 0,
    registrationNumber: orphanage?.registrationNumber || "",
    governmentLicenseNumber: orphanage?.governmentLicenseNumber || "",
    phone: orphanage?.phone || "",
    fullAddress: orphanage?.fullAddress || "",
  };

  if (error || !orphanage) {
    return (
      <div className="space-y-5">
        <Breadcrumb items={["Admin", "Orphanages", "Details"]} />
        <Card>
          <div className="flex flex-col items-center gap-4 px-6 py-12 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gray-100 dark:bg-slate-800">
              <FiHome className="h-6 w-6 text-slate-400" />
            </div>
            <div>
              <h1 className="text-base font-bold text-slate-900 dark:text-white">Orphanage Not Found</h1>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{error || 'This orphanage record is not available.'}</p>
            </div>
            <Button icon={FiArrowLeft} onClick={() => navigate(-1)}>Back</Button>
          </div>
        </Card>
      </div>
    );
  }

  const totalAdmissions = statistics?.data?.totalAdmissions || statistics?.totalAdmissions || 0;
  const adoptedChildren = statistics?.data?.adoptedChildrenCount || statistics?.adoptedChildrenCount || 0;
  const currentChildren = statistics?.data?.currentChildrenCount || statistics?.currentChildrenCount || orphanage.occupancy || 0;
  const occupancyPct = statistics?.data?.occupancyPercentage || statistics?.occupancyPercentage || 0;
  const compliance = orphanageData?.compliance ?? 0;
  const complianceColor = compliance >= 90 ? "text-green-600 dark:text-green-400" : compliance >= 75 ? "text-amber-600 dark:text-amber-400" : "text-red-600 dark:text-red-400";

  return (
    <div className="space-y-5">
      <Breadcrumb items={["Admin", "Orphanages", orphanageData.name]} />

      {/* Page header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-indigo-100 text-xl font-bold text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-300">
            {orphanageData.name.split(" ").map(w => w[0]).join("").slice(0, 2)}
          </div>
          <div>
            <h1 className="page-title">{orphanageData.name}</h1>
            <p className="page-subtitle">{orphanageData.code} · {orphanageData.city}</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button icon={FiArrowLeft} variant="secondary" onClick={() => navigate(-1)}>Back</Button>
          <Button icon={FiFileText}  onClick={() => navigate(`/admin/orphanages/${orphanageId}/profile`)}>
            Full Profile
          </Button>
        </div>
      </div>

      {/* KPI cards */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { label: "Total Admissions",    value: totalAdmissions,    icon: FiUsers,  color: "blue"  },
          { label: "Children Adopted",    value: adoptedChildren,    icon: FiShield, color: "green" },
          { label: "Currently in Care",   value: currentChildren,    icon: FiHome,   color: "amber" },
          { label: "Occupancy Rate",      value: `${occupancyPct}%`, icon: FiUsers,  color: occupancyPct >= 90 ? "red" : "blue" },
        ].map((kpi, i) => (
          <motion.div
            key={kpi.label}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className={classNames(
              "relative overflow-hidden rounded-2xl border bg-white p-5 shadow-card dark:bg-slate-900",
              kpi.color === "green" ? "border-green-100 dark:border-green-500/20" :
              kpi.color === "amber" ? "border-amber-100 dark:border-amber-500/20" :
              kpi.color === "red"   ? "border-red-100 dark:border-red-500/20" :
              "border-gray-100 dark:border-slate-800"
            )}
          >
            <div className={classNames(
              "absolute inset-y-0 left-0 w-1 rounded-l-2xl",
              kpi.color === "green" ? "bg-green-500" :
              kpi.color === "amber" ? "bg-amber-500" :
              kpi.color === "red"   ? "bg-red-500" :
              "bg-civic-500"
            )} />
            <div className="pl-3">
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">{kpi.label}</p>
              <p className="mt-2 text-3xl font-bold text-slate-900 dark:text-white">{kpi.value}</p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Compliance + occupancy visual */}
      <div className="grid gap-5 sm:grid-cols-2">
        <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-card dark:border-slate-800 dark:bg-slate-900">
          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">Compliance Score</p>
          <p className={classNames("mt-2 text-4xl font-bold", complianceColor)}>{compliance}%</p>
          <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-gray-100 dark:bg-slate-700">
            <div
              className={classNames("h-full rounded-full", compliance >= 90 ? "bg-green-500" : compliance >= 75 ? "bg-amber-500" : "bg-red-500")}
              style={{ width: `${compliance}%` }}
            />
          </div>
        </div>
        <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-card dark:border-slate-800 dark:bg-slate-900">
          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">Occupancy</p>
          <div className="mt-2 flex items-baseline gap-2">
            <p className="text-4xl font-bold text-slate-900 dark:text-white">{currentChildren}</p>
          <p className="text-lg text-slate-400">/ {orphanageData.capacity}</p>
          </div>
          <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-gray-100 dark:bg-slate-700">
            <div
              className={classNames("h-full rounded-full", occupancyPct >= 90 ? "bg-red-500" : occupancyPct >= 75 ? "bg-amber-500" : "bg-green-500")}
              style={{ width: `${occupancyPct}%` }}
            />
          </div>
        </div>
      </div>

      {/* Basic details */}
      <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-card dark:border-slate-800 dark:bg-slate-900">
        <div className="border-b border-gray-100 px-5 py-4 dark:border-slate-800">
          <h2 className="text-sm font-bold text-slate-900 dark:text-white">Basic Details</h2>
        </div>
        <div className="grid gap-3 p-5 sm:grid-cols-2 xl:grid-cols-3">
          <Field icon={FiHome}     label="Orphanage Name"          value={orphanageData.name} />
          <Field icon={FiFileText} label="Registration Number"     value={orphanageData.registrationNumber} />
          <Field icon={FiShield}   label="Govt License Number"     value={orphanageData.governmentLicenseNumber} />
          <Field icon={FiHome}     label="City"                    value={orphanageData.city} />
          <Field icon={FiUsers}    label="Capacity"                value={orphanageData.capacity} />
          <Field icon={FiShield}   label="Compliance"              value={`${compliance}%`} />
          <Field icon={FiPhone}    label="Phone Number"            value={orphanageData.phone} />
          <Field icon={FiHome}     label="Address"                 value={orphanageData.fullAddress} wide />
        </div>
      </div>

      {/* View full profile CTA */}
      <div className="rounded-2xl border border-civic-100 bg-civic-50 p-5 dark:border-civic-500/20 dark:bg-civic-500/5">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-bold text-civic-800 dark:text-civic-200">Complete Registration Profile</p>
            <p className="mt-0.5 text-xs text-civic-600 dark:text-civic-400">View KYC, staff, facilities, AI safety, and banking details.</p>
          </div>
          <Button icon={FiExternalLink} onClick={() => navigate(`/admin/orphanages/${orphanageId}/profile`)}>
            View Full Profile
          </Button>
        </div>
      </div>
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
