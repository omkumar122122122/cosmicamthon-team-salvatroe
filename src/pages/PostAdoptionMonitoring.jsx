import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FiHeart,
  FiCalendar,
  FiClock,
  FiCheckCircle,
  FiFileText,
  FiShield,
  FiArrowRight,
  FiActivity,
  FiAlertTriangle,
  FiUserCheck,
  FiCpu,
  FiCheck,
  FiX,
  FiEye,
  FiRefreshCw,
} from "react-icons/fi";
import Breadcrumb from "../components/Breadcrumb";
import Card from "../components/Card";
import Button from "../components/Button";
import AssessmentWizard from "../components/PostAdoption/AssessmentWizard";
import { postAdoptionService } from "../services/postAdoptionService";
import { PageSkeleton } from "../components/Loader";
import { classNames } from "../utils/formatters";

export default function PostAdoptionMonitoring() {
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("SCHEDULE"); // "SCHEDULE" | "REVIEW_QUEUE" | "DIAGNOSTICS"
  const [summary, setSummary] = useState(null);
  const [schedules, setSchedules] = useState([]);
  const [selectedSchedule, setSelectedSchedule] = useState(null);
  const [isWizardActive, setIsWizardActive] = useState(false);

  // Review Queue state
  const [reviewQueue, setReviewQueue] = useState([]);
  const [reviewFilter, setReviewFilter] = useState("ALL");
  const [selectedReviewItem, setSelectedReviewItem] = useState(null);
  const [humanDecision, setHumanDecision] = useState("REVIEWED");
  const [humanNotes, setHumanNotes] = useState("");
  const [followUpDate, setFollowUpDate] = useState("");
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);

  useEffect(() => {
    loadData();
  }, [reviewFilter]);

  async function loadData() {
    setLoading(true);
    try {
      const [schedRes, sumRes, queueRes] = await Promise.all([
        postAdoptionService.getSchedule(),
        postAdoptionService.getDashboardSummary(),
        postAdoptionService.getReviewQueue(reviewFilter),
      ]);

      const list = Array.isArray(schedRes?.data) ? schedRes.data : Array.isArray(schedRes) ? schedRes : [];
      if (list.length > 0) {
        setSchedules(list);
        setSelectedSchedule(list[0]);
      } else {
        const fallback = [
          {
            id: "sched-1",
            childId: "child-demo-aarav",
            child: { firstName: "Aarav", lastName: "Sharma", age: 8 },
            nextAssessmentDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
            completed: false,
            frequencyMonths: 6,
          },
        ];
        setSchedules(fallback);
        setSelectedSchedule(fallback[0]);
      }

      setSummary(sumRes);
      setReviewQueue(queueRes.records || []);
    } catch (err) {
      console.warn("Using default monitoring fallback:", err);
      setSummary({
        upcomingSessions: 2,
        completedSessions: 3,
        pendingReviews: 1,
        followUpsRequired: 1,
        urgentReviews: 0,
        aiServiceStatus: "ONLINE",
        modelDetails: {
          faceModel: "InsightFace (SCRFD + ArcFace 512D)",
          conversationModel: "WebSpeech NLP / Sentiment Evaluator",
          status: "OPERATIONAL",
        },
      });
    } finally {
      setLoading(false);
    }
  }

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    if (!selectedReviewItem) return;
    setIsSubmittingReview(true);
    try {
      await postAdoptionService.submitHumanReview({
        assessmentId: selectedReviewItem.id,
        decision: humanDecision,
        notes: humanNotes,
        followUpDate: humanDecision === "FOLLOW_UP_REQUIRED" ? followUpDate : undefined,
      });

      // Update local state immutably
      setReviewQueue((prev) =>
        prev.map((item) =>
          item.id === selectedReviewItem.id
            ? { ...item, reviewStatus: humanDecision, humanDecision, humanNotes }
            : item
        )
      );
      setSelectedReviewItem(null);
      setHumanNotes("");
    } catch (err) {
      console.error("Review submission error:", err);
    } finally {
      setIsSubmittingReview(false);
    }
  };

  if (loading) {
    return <PageSkeleton />;
  }

  return (
    <div className="space-y-6 pb-16">
      {/* Breadcrumb Navigation */}
      <Breadcrumb items={[{ label: "Welfare Portal", path: "/orphanage" }, { label: "AI Post-Adoption Welfare Monitoring" }]} />

      {/* Hero Banner */}
      <motion.header
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 p-6 text-white shadow-xl sm:p-8"
      >
        <div className="absolute right-0 top-0 -mr-16 -mt-16 h-64 w-64 rounded-full bg-blue-500/10 blur-3xl" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="mb-3 inline-flex items-center gap-2 rounded-lg bg-blue-500/20 px-3.5 py-1.5 text-xs font-bold text-blue-200 border border-blue-400/30 backdrop-blur-md">
              <FiShield className="h-4 w-4 text-emerald-400" /> AI Welfare Decision Support Standard
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight font-display">
              Post-Adoption AI Welfare Monitoring
            </h1>
            <p className="mt-2 max-w-2xl text-xs sm:text-sm font-medium text-blue-100/90 leading-relaxed">
              Mandatory post-adoption follow-up at 1-month and 6-month cycles. Combines InsightFace identity verification and age-appropriate dialogue to provide factual welfare observations for human caseworker review.
            </p>
          </div>

          <div className="shrink-0 flex items-center gap-3 bg-white/10 p-3 rounded-2xl border border-white/20 backdrop-blur-md">
            <span className="flex h-3 w-3 rounded-full bg-emerald-400 animate-pulse" />
            <div className="text-xs">
              <p className="font-bold text-white uppercase tracking-wider text-[10px]">AI Vision Service</p>
              <p className="text-emerald-300 font-mono font-black">{summary?.aiServiceStatus || "ONLINE"}</p>
            </div>
          </div>
        </div>
      </motion.header>

      {/* ── KPI Summary Cards ──────────────────────────────────── */}
      {summary && (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <Card className="border-slate-200/90 dark:border-slate-800 p-4">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Upcoming Sessions</span>
            <p className="mt-1 text-2xl font-black text-slate-900 dark:text-white font-display">
              {summary.upcomingSessions}
            </p>
            <span className="text-[10px] text-slate-400 mt-1 block">Scheduled evaluations due</span>
          </Card>

          <Card className="border-slate-200/90 dark:border-slate-800 p-4">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Completed Sessions</span>
            <p className="mt-1 text-2xl font-black text-emerald-600 dark:text-emerald-400 font-display">
              {summary.completedSessions}
            </p>
            <span className="text-[10px] text-slate-400 mt-1 block">Evaluations conducted</span>
          </Card>

          <Card className="border-slate-200/90 dark:border-slate-800 p-4">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Pending Reviews</span>
            <p className="mt-1 text-2xl font-black text-amber-600 dark:text-amber-400 font-display">
              {summary.pendingReviews}
            </p>
            <span className="text-[10px] text-slate-400 mt-1 block">Awaiting caseworker review</span>
          </Card>

          <Card className="border-slate-200/90 dark:border-slate-800 p-4">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Follow-ups Required</span>
            <p className="mt-1 text-2xl font-black text-indigo-600 dark:text-indigo-400 font-display">
              {summary.followUpsRequired}
            </p>
            <span className="text-[10px] text-slate-400 mt-1 block">Secondary check configured</span>
          </Card>

          <Card className="border-slate-200/90 dark:border-slate-800 p-4">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Urgent Reviews</span>
            <p className="mt-1 text-2xl font-black text-rose-600 dark:text-rose-400 font-display">
              {summary.urgentReviews}
            </p>
            <span className="text-[10px] text-slate-400 mt-1 block">Zero unresolved escalations</span>
          </Card>
        </div>
      )}

      {/* ── Sub-navigation Tabs ─────────────────────────────────── */}
      <div className="flex rounded-2xl bg-slate-100 p-1 dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 max-w-lg">
        <button
          type="button"
          onClick={() => setActiveTab("SCHEDULE")}
          className={classNames(
            "flex-1 flex items-center justify-center gap-1.5 rounded-xl py-2 text-xs font-bold font-display transition-all",
            activeTab === "SCHEDULE"
              ? "bg-white text-indigo-600 shadow-xs dark:bg-slate-800 dark:text-indigo-400"
              : "text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
          )}
        >
          <FiCalendar className="h-3.5 w-3.5" />
          <span>Welfare Schedule</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("REVIEW_QUEUE")}
          className={classNames(
            "flex-1 flex items-center justify-center gap-1.5 rounded-xl py-2 text-xs font-bold font-display transition-all",
            activeTab === "REVIEW_QUEUE"
              ? "bg-white text-amber-600 shadow-xs dark:bg-slate-800 dark:text-amber-400"
              : "text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
          )}
        >
          <FiUserCheck className="h-3.5 w-3.5" />
          <span>AI Review Queue ({reviewQueue.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("DIAGNOSTICS")}
          className={classNames(
            "flex-1 flex items-center justify-center gap-1.5 rounded-xl py-2 text-xs font-bold font-display transition-all",
            activeTab === "DIAGNOSTICS"
              ? "bg-white text-slate-900 shadow-xs dark:bg-slate-800 dark:text-white"
              : "text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
          )}
        >
          <FiCpu className="h-3.5 w-3.5" />
          <span>Model Diagnostics</span>
        </button>
      </div>

      {/* ── Tab 1: Welfare Schedule & Assessment Wizard ─────────── */}
      {activeTab === "SCHEDULE" && (
        isWizardActive ? (
          <AssessmentWizard
            childId={selectedSchedule?.childId || "child-demo-aarav"}
            scheduleId={selectedSchedule?.id}
            childName={selectedSchedule?.child?.firstName || "Aarav"}
            onFinish={() => {
              setIsWizardActive(false);
              loadData();
            }}
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
                    <h3 className="text-base font-extrabold text-slate-900 dark:text-white font-display">
                      Next Due Assessment Session
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Post-Adoption Welfare Evaluation Cycle</p>
                  </div>
                </div>

                <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300">
                  DUE FOR EVALUATION
                </span>
              </div>

              <div className="rounded-2xl border border-slate-100 bg-slate-50/70 p-5 dark:border-slate-800/80 dark:bg-slate-950/40 space-y-4">
                <div className="grid gap-4 sm:grid-cols-3">
                  <div>
                    <p className="text-[11px] font-bold text-slate-400 uppercase">Child Profile</p>
                    <p className="text-sm font-black text-slate-900 dark:text-white mt-0.5">
                      {selectedSchedule?.child ? `${selectedSchedule.child.firstName} ${selectedSchedule.child.lastName || ""}` : "Aarav Sharma"}
                    </p>
                  </div>

                  <div>
                    <p className="text-[11px] font-bold text-slate-400 uppercase">Next Assessment Due</p>
                    <p className="text-sm font-black text-blue-600 dark:text-blue-400 mt-0.5">
                      {selectedSchedule?.nextAssessmentDate
                        ? new Date(selectedSchedule.nextAssessmentDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
                        : new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                    </p>
                  </div>

                  <div>
                    <p className="text-[11px] font-bold text-slate-400 uppercase">Monitoring Cycle</p>
                    <p className="text-sm font-black text-slate-800 dark:text-slate-200 mt-0.5">1-Month & 6-Month Cadence</p>
                  </div>
                </div>

                <div className="border-t border-slate-200/60 pt-4 dark:border-slate-800 flex justify-end">
                  <Button
                    variant="primary"
                    onClick={() => setIsWizardActive(true)}
                    className="flex items-center gap-2 px-6 py-2.5 text-xs font-extrabold shadow-md shadow-blue-500/20"
                  >
                    Start AI Welfare Assessment <FiArrowRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </Card>

            {/* Decision Support Guidelines */}
            <Card className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 space-y-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-300">
                  <FiShield className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white font-display">
                    Ethical AI Guidelines
                  </h3>
                  <p className="text-[11px] text-slate-400">Child Welfare Protocol</p>
                </div>
              </div>

              <ul className="space-y-2.5 text-xs text-slate-600 dark:text-slate-300">
                <li className="flex items-start gap-2">
                  <FiCheckCircle className="h-4 w-4 shrink-0 text-emerald-500 mt-0.5" />
                  <span>AI provides factual observations, not automated accusations or abuse verdicts.</span>
                </li>
                <li className="flex items-start gap-2">
                  <FiCheckCircle className="h-4 w-4 shrink-0 text-emerald-500 mt-0.5" />
                  <span>InsightFace ArcFace verifies presented face against enrolled child baseline.</span>
                </li>
                <li className="flex items-start gap-2">
                  <FiCheckCircle className="h-4 w-4 shrink-0 text-emerald-500 mt-0.5" />
                  <span>Final case closure or escalation is exclusively decided by authorized caseworkers.</span>
                </li>
              </ul>
            </Card>
          </div>
        )
      )}

      {/* ── Tab 2: AI Review Queue ──────────────────────────────── */}
      {activeTab === "REVIEW_QUEUE" && (
        <Card className="border-slate-200/90 dark:border-slate-800 p-0 overflow-hidden shadow-card">
          <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
            <div>
              <h3 className="font-display text-sm font-bold text-slate-900 dark:text-white">
                Caseworker Decision Support Review Queue
              </h3>
              <p className="text-xs text-slate-500">
                Authorized human review of AI-assisted post-adoption assessments
              </p>
            </div>

            <div className="flex items-center gap-2">
              <select
                value={reviewFilter}
                onChange={(e) => setReviewFilter(e.target.value)}
                className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 focus:outline-none"
              >
                <option value="ALL">All Cases</option>
                <option value="PENDING">Pending Review</option>
                <option value="REVIEWED">Reviewed</option>
                <option value="FOLLOW_UP_REQUIRED">Follow-up Required</option>
                <option value="ESCALATED">Escalated</option>
              </select>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/70 text-[11px] font-bold uppercase text-slate-400 dark:border-slate-800 dark:bg-slate-900/50">
                  <th className="py-3 px-4">Child Name</th>
                  <th className="py-3 px-4">Adoptive Parents</th>
                  <th className="py-3 px-4">Evaluation Date</th>
                  <th className="py-3 px-4">Face Confidence</th>
                  <th className="py-3 px-4">AI Observation</th>
                  <th className="py-3 px-4">AI Recommendation</th>
                  <th className="py-3 px-4">Review Status</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {reviewQueue.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-10 text-center text-slate-400">
                      No review items pending in queue.
                    </td>
                  </tr>
                ) : (
                  reviewQueue.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40">
                      <td className="py-3.5 px-4 font-bold text-slate-900 dark:text-white font-display">
                        {item.childName} ({item.childAge}y)
                      </td>
                      <td className="py-3.5 px-4 text-slate-600 dark:text-slate-300">
                        {item.parentName}
                      </td>
                      <td className="py-3.5 px-4 font-mono text-[11px] text-slate-500">
                        {item.sessionDate}
                      </td>
                      <td className="py-3.5 px-4 font-bold text-emerald-600 dark:text-emerald-400 font-mono">
                        {item.faceConfidence}
                      </td>
                      <td className="py-3.5 px-4 text-slate-600 dark:text-slate-300 max-w-xs truncate">
                        {item.aiObservation}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className={classNames(
                          "rounded-md px-2 py-0.5 text-[10px] font-bold uppercase",
                          item.aiRecommendation === "NORMAL"
                            ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400"
                            : "bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400"
                        )}>
                          {item.aiRecommendation}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className={classNames(
                          "rounded-md px-2 py-0.5 text-[10px] font-bold uppercase",
                          item.reviewStatus === "REVIEWED"
                            ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-300"
                            : "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300"
                        )}>
                          {item.reviewStatus}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <button
                          type="button"
                          onClick={() => setSelectedReviewItem(item)}
                          className="inline-flex items-center gap-1 rounded-lg bg-slate-900 px-3 py-1 text-xs font-bold text-white hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900"
                        >
                          <FiEye className="h-3 w-3" />
                          <span>Review</span>
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* ── Tab 3: Model Diagnostics ────────────────────────────── */}
      {activeTab === "DIAGNOSTICS" && (
        <Card className="border-slate-200/90 dark:border-slate-800 p-6 shadow-card space-y-4 max-w-2xl">
          <h3 className="font-display text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <FiCpu className="text-indigo-500" />
            <span>AI Safety Microservice Architecture</span>
          </h3>

          <div className="space-y-3 text-xs">
            <div className="flex justify-between py-2 border-b border-slate-100 dark:border-slate-800">
              <span className="text-slate-500 font-bold uppercase text-[10px]">Service Endpoint</span>
              <span className="font-mono text-slate-800 dark:text-slate-200">http://localhost:8000 (FastAPI)</span>
            </div>
            <div className="flex justify-between py-2 border-b border-slate-100 dark:border-slate-800">
              <span className="text-slate-500 font-bold uppercase text-[10px]">Biometric Model</span>
              <span className="font-mono text-slate-800 dark:text-slate-200">InsightFace (SCRFD 10G Detection + ArcFace 512D)</span>
            </div>
            <div className="flex justify-between py-2 border-b border-slate-100 dark:border-slate-800">
              <span className="text-slate-500 font-bold uppercase text-[10px]">Dialogue Engine</span>
              <span className="font-mono text-slate-800 dark:text-slate-200">Web Speech Synthesis & SpeechRecognition (English & Hinglish)</span>
            </div>
            <div className="flex justify-between py-2">
              <span className="text-slate-500 font-bold uppercase text-[10px]">Biometric Privacy</span>
              <span className="font-bold text-emerald-600 dark:text-emerald-400">Zero Raw Embeddings Exposed to Client</span>
            </div>
          </div>
        </Card>
      )}

      {/* ── Human Decision Modal ───────────────────────────────── */}
      <AnimatePresence>
        {selectedReviewItem && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-xs" onClick={() => setSelectedReviewItem(null)} />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative z-10 w-full max-w-lg rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900 space-y-4"
            >
              <div className="flex items-center justify-between border-b border-slate-100 pb-3 dark:border-slate-800">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white font-display flex items-center gap-2">
                  <FiUserCheck className="text-indigo-500" />
                  <span>Caseworker Case Evaluation & Decision</span>
                </h3>
                <button
                  type="button"
                  onClick={() => setSelectedReviewItem(null)}
                  className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200"
                >
                  <FiX className="h-4 w-4" />
                </button>
              </div>

              <div className="rounded-2xl bg-slate-50 p-4 dark:bg-slate-800/50 space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-400">Child:</span>
                  <span className="font-bold text-slate-900 dark:text-white">{selectedReviewItem.childName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Identity Match:</span>
                  <span className="font-bold text-emerald-600">{selectedReviewItem.faceConfidence} (InsightFace Verified)</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">AI Observation:</span>
                  <span className="text-slate-700 dark:text-slate-300 font-medium">{selectedReviewItem.aiObservation}</span>
                </div>
              </div>

              <form onSubmit={handleReviewSubmit} className="space-y-3 text-xs">
                <div>
                  <label className="block text-[11px] font-bold uppercase text-slate-400 mb-1">
                    Caseworker Decision
                  </label>
                  <select
                    value={humanDecision}
                    onChange={(e) => setHumanDecision(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-white p-2.5 font-bold text-slate-800 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-200 focus:outline-none"
                  >
                    <option value="REVIEWED">✓ Mark Reviewed (Standard Routine Continue)</option>
                    <option value="FOLLOW_UP_REQUIRED">⚠️ Schedule Targeted Follow-up Check</option>
                    <option value="ESCALATED">🚨 Escalate Case to Child Welfare Committee</option>
                    <option value="FALSE_ALARM">⚪ False Positive / No Concern</option>
                  </select>
                </div>

                {humanDecision === "FOLLOW_UP_REQUIRED" && (
                  <div>
                    <label className="block text-[11px] font-bold uppercase text-slate-400 mb-1">
                      Follow-up Date
                    </label>
                    <input
                      type="date"
                      value={followUpDate}
                      onChange={(e) => setFollowUpDate(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-white p-2 text-xs font-bold text-slate-800 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-200 focus:outline-none"
                    />
                  </div>
                )}

                <div>
                  <label className="block text-[11px] font-bold uppercase text-slate-400 mb-1">
                    Review Notes / Case Remarks
                  </label>
                  <textarea
                    rows={3}
                    value={humanNotes}
                    onChange={(e) => setHumanNotes(e.target.value)}
                    placeholder="Enter authorized caseworker observations..."
                    className="w-full rounded-xl border border-slate-200 bg-white p-2.5 text-xs text-slate-800 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-200 focus:outline-none"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => setSelectedReviewItem(null)}
                    className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmittingReview}
                    className="rounded-xl bg-slate-900 px-4 py-2 text-xs font-bold text-white hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900"
                  >
                    {isSubmittingReview ? "Recording..." : "Record Human Decision"}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
