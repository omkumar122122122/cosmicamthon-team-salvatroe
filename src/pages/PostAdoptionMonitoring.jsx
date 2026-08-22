import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  FiHeart, FiCalendar, FiClock, FiCheckCircle,
  FiFileText, FiShield, FiArrowRight, FiActivity
} from "react-icons/fi";
import Breadcrumb from "../components/Breadcrumb";
import Card from "../components/Card";
import Button from "../components/Button";
import AssessmentWizard from "../components/PostAdoption/AssessmentWizard";
import { postAdoptionService } from "../services/postAdoptionService";
import { PageSkeleton } from "../components/Loader";

export default function PostAdoptionMonitoring() {
  const [loading, setLoading] = useState(true);
  const [schedules, setSchedules] = useState([]);
  const [selectedSchedule, setSelectedSchedule] = useState(null);
  const [isWizardActive, setIsWizardActive] = useState(false);
  const [reports, setReports] = useState([]);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const res = await postAdoptionService.getSchedule();
        const list = Array.isArray(res?.data) ? res.data : Array.isArray(res) ? res : [];
        if (list.length > 0) {
          setSchedules(list);
          setSelectedSchedule(list[0]);
        } else {
          const fallback = [
            {
              id: "sched-1",
              childId: "child-1",
              child: { firstName: "Aarav", lastName: "Sharma", age: 8 },
              nextAssessmentDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
              completed: false,
              frequencyMonths: 6,
            },
          ];
          setSchedules(fallback);
          setSelectedSchedule(fallback[0]);
        }
      } catch (err) {
        console.warn("Using default schedule fallback:", err);
        setSchedules([
          {
            id: "sched-1",
            childId: "child-1",
            child: { firstName: "Aarav", lastName: "Sharma", age: 8 },
            nextAssessmentDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
            completed: false,
            frequencyMonths: 6,
          },
        ]);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  if (loading) {
    return <PageSkeleton />;
  }

  return (
    <div className="space-y-6">
      {/* Breadcrumb Navigation */}
      <Breadcrumb items={[{ label: "Parent Portal", path: "/parent" }, { label: "Post Adoption Monitoring" }]} />

      {/* Hero Banner */}
      <motion.header
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 p-6 text-white shadow-xl sm:p-8"
      >
        <div className="absolute right-0 top-0 -mr-16 -mt-16 h-64 w-64 rounded-full bg-blue-500/10 blur-3xl" />
        <div className="relative z-10 grid gap-6 lg:grid-cols-[1fr_auto] lg:items-center">
          <div>
            <div className="mb-3 inline-flex items-center gap-2 rounded-lg bg-blue-500/20 px-3.5 py-1.5 text-xs font-bold text-blue-200 border border-blue-400/30 backdrop-blur-md">
              <FiShield className="h-4 w-4 text-emerald-400" /> Child Welfare Compliance Standard
            </div>
            <h1 className="text-3xl font-extrabold text-white sm:text-4xl tracking-tight">
              Post-Adoption Welfare Monitoring
            </h1>
            <p className="mt-2 max-w-2xl text-sm font-medium text-blue-100/90 leading-relaxed sm:text-base">
              Every adopted child completes an AI-assisted 6-month welfare assessment until age 16. Ensure safety, emotional health, and family bonding through regular checks.
            </p>
          </div>
        </div>
      </motion.header>

      {/* Main Content Area */}
      {isWizardActive ? (
        <AssessmentWizard
          childId={selectedSchedule?.childId || "demo-child"}
          scheduleId={selectedSchedule?.id}
          childName={selectedSchedule?.child?.firstName || "Raj"}
          onFinish={() => setIsWizardActive(false)}
          onCancel={() => setIsWizardActive(false)}
        />
      ) : (
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Active Schedule Card */}
          <Card className="lg:col-span-2 rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-300">
                  <FiCalendar className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-lg font-extrabold text-slate-900 dark:text-white">Next Assessment Schedule</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">6-Month Mandatory Welfare Evaluation</p>
                </div>
              </div>

              <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-bold text-blue-700 dark:bg-blue-900/40 dark:text-blue-300">
                ACTIVE
              </span>
            </div>

            <div className="rounded-2xl border border-slate-100 bg-slate-50/70 p-5 dark:border-slate-800/80 dark:bg-slate-950/40 space-y-4">
              <div className="grid gap-4 sm:grid-cols-3">
                <div>
                  <p className="text-[11px] font-bold text-slate-400">Child Name</p>
                  <p className="text-sm font-black text-slate-900 dark:text-white">
                    {selectedSchedule?.child ? `${selectedSchedule.child.firstName} ${selectedSchedule.child.lastName || ""}` : "Aarav Sharma"}
                  </p>
                </div>

                <div>
                  <p className="text-[11px] font-bold text-slate-400">Next Due Date</p>
                  <p className="text-sm font-black text-blue-600 dark:text-blue-400">
                    {selectedSchedule?.nextAssessmentDate
                      ? new Date(selectedSchedule.nextAssessmentDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
                      : new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                  </p>
                </div>

                <div>
                  <p className="text-[11px] font-bold text-slate-400">Frequency</p>
                  <p className="text-sm font-black text-slate-800 dark:text-slate-200">Every 6 Months</p>
                </div>
              </div>

              <div className="border-t border-slate-200/60 pt-4 dark:border-slate-800 flex justify-end">
                <Button
                  variant="primary"
                  onClick={() => setIsWizardActive(true)}
                  className="flex items-center gap-2 px-6 py-2.5 text-xs font-extrabold shadow-md shadow-blue-500/20"
                >
                  Start Assessment Wizard <FiArrowRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </Card>

          {/* Quick Info Sidebar */}
          <Card className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 space-y-5">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-300">
                <FiActivity className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-slate-900 dark:text-white">Assessment Guidelines</h3>
                <p className="text-xs text-slate-500">Child Welfare Standard</p>
              </div>
            </div>

            <ul className="space-y-3 text-xs text-slate-600 dark:text-slate-300 font-medium">
              <li className="flex items-start gap-2">
                <FiCheckCircle className="h-4 w-4 shrink-0 text-emerald-500 mt-0.5" />
                <span>Camera scan evaluates facial expressions for 10 seconds.</span>
              </li>
              <li className="flex items-start gap-2">
                <FiCheckCircle className="h-4 w-4 shrink-0 text-emerald-500 mt-0.5" />
                <span>Microphone records vocal pitch and tone for 30 seconds.</span>
              </li>
              <li className="flex items-start gap-2">
                <FiCheckCircle className="h-4 w-4 shrink-0 text-emerald-500 mt-0.5" />
                <span>Age-bracketed questions assess emotional bonding and school adaptation.</span>
              </li>
              <li className="flex items-start gap-2">
                <FiCheckCircle className="h-4 w-4 shrink-0 text-emerald-500 mt-0.5" />
                <span>Evaluations repeat every 6 months until age 16.</span>
              </li>
            </ul>
          </Card>
        </div>
      )}
    </div>
  );
}
