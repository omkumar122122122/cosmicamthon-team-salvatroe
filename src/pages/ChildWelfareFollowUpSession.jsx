import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useForm } from "react-hook-form";
import {
  FiCalendar,
  FiCamera,
  FiCheck,
  FiCheckCircle,
  FiClock,
  FiEye,
  FiFileText,
  FiGlobe,
  FiHeart,
  FiHome,
  FiMic,
  FiPlay,
  FiSend,
  FiUploadCloud,
  FiUser,
  FiX,
} from "react-icons/fi";
import Breadcrumb from "../components/Breadcrumb";
import Button from "../components/Button";

const childRecord = {
  photo: "AD",
  name: "Anaya Das",
  id: "CH-1034",
  age: "12 years",
  adoptionDate: "18 Feb 2025",
  assignedOfficer: "Ritika Sharma",
  monitoringCycle: "Cycle 04 / Year 02",
  nextSession: "08 Oct 2026",
  submissionDeadline: "11 Oct 2026",
  submissionWindow: "08 Oct 2026 - 11 Oct 2026",
  lastCompleted: "08 Apr 2026",
};

const questions = [
  "How are you today?",
  "Are you happy at home?",
  "Do you go to school?",
  "Who helps you when you are sick?",
  "What do you enjoy doing?",
  "Is there anything you want to tell us?",
];

const previousSessions = [
  { id: "SES-042", date: "08 Apr 2026", status: "Submitted", healthReport: "Uploaded", submissionWindow: "08 Apr 2026 - 11 Apr 2026", nextSession: "08 Oct 2026" },
  { id: "SES-031", date: "08 Oct 2025", status: "Submitted", healthReport: "Uploaded", submissionWindow: "08 Oct 2025 - 11 Oct 2025", nextSession: "08 Apr 2026" },
  { id: "SES-018", date: "18 Mar 2025", status: "Submitted", healthReport: "Uploaded", submissionWindow: "18 Mar 2025 - 21 Mar 2025", nextSession: "08 Oct 2025" },
];

const steps = ["Identity Check", "Health Report", "AI Conversation", "Session Upload", "Completed"];

function todayLabel() {
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date());
}

function Badge({ children, tone = "success" }) {
  const tones = {
    success: "badge-success",
    blue: "badge-blue",
    warning: "badge-warning",
    neutral: "badge-neutral",
  };

  return <span className={tones[tone]}>{children}</span>;
}

function Section({ title, icon: Icon, children, action }) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl border border-gray-100 bg-white shadow-card dark:border-slate-800 dark:bg-slate-900"
    >
      <div className="flex flex-col gap-3 border-b border-gray-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between dark:border-slate-800">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-civic-50 text-civic-700 ring-1 ring-civic-100 dark:bg-civic-500/10 dark:text-civic-300 dark:ring-civic-500/20">
            <Icon className="h-5 w-5" />
          </span>
          <h2 className="text-base font-bold text-slate-900 dark:text-white">{title}</h2>
        </div>
        {action}
      </div>
      <div className="p-5">{children}</div>
    </motion.section>
  );
}

function Toasts({ items }) {
  return (
    <div className="fixed right-4 top-20 z-50 space-y-2">
      <AnimatePresence>
        {items.map((toast) => (
          <motion.div
            key={toast.id}
            initial={{ opacity: 0, x: 28, scale: 0.98 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 28, scale: 0.98 }}
            className="flex min-w-[260px] items-center gap-3 rounded-2xl border border-green-200 bg-white px-4 py-3 text-sm font-semibold text-slate-800 shadow-modal dark:border-green-500/20 dark:bg-slate-900 dark:text-slate-100"
          >
            <FiCheckCircle className="h-5 w-5 shrink-0 text-green-600" />
            {toast.message}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}

function SuccessModal({ open, onClose }) {
  if (!open) return null;

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <motion.div
          initial={{ opacity: 0, y: 18, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 18, scale: 0.98 }}
          className="w-full max-w-xl rounded-2xl border border-gray-100 bg-white shadow-modal dark:border-slate-800 dark:bg-slate-900"
        >
          <div className="flex items-start justify-between border-b border-gray-100 p-6 dark:border-slate-800">
            <div>
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-green-50 text-green-700 ring-1 ring-green-200 dark:bg-green-500/10 dark:text-green-300 dark:ring-green-500/20">
                <FiCheckCircle className="h-7 w-7" />
              </div>
              <h2 className="mt-4 text-2xl font-black text-slate-900 dark:text-white">Session Submitted Successfully</h2>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                Your scheduled welfare check has been securely submitted for authorized review.
              </p>
            </div>
            <button
              onClick={onClose}
              className="flex h-9 w-9 items-center justify-center rounded-xl text-slate-500 transition hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
              aria-label="Close success modal"
            >
              <FiX className="h-5 w-5" />
            </button>
          </div>

          <div className="space-y-3 p-6">
            {[
              "Health Report Uploaded",
              "Welfare Officer Notified",
              "Next Session Will Be Scheduled Automatically",
            ].map((item) => (
              <div key={item} className="flex items-center gap-3 rounded-2xl border border-green-100 bg-green-50 p-4 text-sm font-bold text-green-800 dark:border-green-500/20 dark:bg-green-500/10 dark:text-green-200">
                <FiCheck className="h-5 w-5 shrink-0" />
                {item}
              </div>
            ))}
            <div className="flex justify-end pt-2">
              <Button icon={FiCheckCircle} onClick={onClose}>Done</Button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

function CameraSection({ sessionStatus, identityVerified, timer, onStart }) {
  const active = sessionStatus === "In Progress";

  return (
    <Section title="Camera Session" icon={FiCamera}>
      <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-slate-950 shadow-card dark:border-slate-700">
        <div className="aspect-video min-h-[300px] bg-[radial-gradient(circle_at_center,#1e3a8a_0,#0f172a_45%,#020617_100%)]">
          <div className="absolute left-4 top-4 flex flex-wrap gap-2">
            <Badge tone={active ? "success" : "neutral"}>Camera {active ? "Connected" : "Standby"}</Badge>
            <Badge tone={active ? "success" : "neutral"}>Mic {active ? "Active" : "Muted"}</Badge>
          </div>

          {active && (
            <>
              <motion.div
                className="absolute inset-x-8 top-0 h-0.5 bg-cyan-300/90 shadow-[0_0_24px_rgba(103,232,249,0.9)]"
                animate={{ y: [22, 270, 22] }}
                transition={{ duration: 2.8, repeat: Infinity, ease: "easeInOut" }}
              />
              <motion.div
                className={`absolute left-1/2 top-1/2 h-44 w-36 -translate-x-1/2 -translate-y-1/2 rounded-2xl border-4 ${identityVerified ? "border-green-400" : "border-cyan-300"} bg-white/5`}
                animate={{ boxShadow: identityVerified ? "0 0 0 8px rgba(34,197,94,0.12)" : "0 0 0 8px rgba(6,182,212,0.12)" }}
              >
                <div className="absolute -top-9 left-0 rounded-xl bg-slate-900/90 px-3 py-1 text-xs font-bold text-white">
                  Face Detection Overlay
                </div>
              </motion.div>
            </>
          )}

          <div className="absolute inset-x-4 bottom-4 grid gap-3 sm:grid-cols-3">
            <div className="rounded-2xl bg-white/10 p-3 backdrop-blur">
              <p className="text-xs font-bold uppercase tracking-widest text-slate-300">Session Timer</p>
              <p className="mt-1 text-xl font-black text-white">{timer}</p>
            </div>
            <div className="rounded-2xl bg-white/10 p-3 backdrop-blur">
              <p className="text-xs font-bold uppercase tracking-widest text-slate-300">Face Check</p>
              <p className="mt-1 text-xl font-black text-white">{identityVerified ? "Verified" : "Pending"}</p>
            </div>
            <div className="rounded-2xl bg-white/10 p-3 backdrop-blur">
              <p className="text-xs font-bold uppercase tracking-widest text-slate-300">Recording</p>
              <p className="mt-1 text-xl font-black text-white">{active ? "Active" : "Off"}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-4 flex flex-col gap-3 sm:flex-row">
        <Button icon={FiPlay} onClick={onStart}>Start Session</Button>
      </div>
    </Section>
  );
}

function ConversationPanel({ sessionStatus, questionIndex, language, setLanguage }) {
  const active = sessionStatus === "In Progress" || sessionStatus === "Completed";

  return (
    <Section title="AI Conversation" icon={FiMic}>
      <div className="flex items-start gap-4">
        <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-civic-600 to-cyan-600 text-lg font-black text-white shadow-card">
          AI
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <Badge tone={active ? "blue" : "neutral"}>Question {active ? questionIndex + 1 : 0} / {questions.length}</Badge>
            <label className="flex items-center gap-2 text-sm font-semibold text-slate-600 dark:text-slate-300">
              <FiGlobe className="h-4 w-4" />
              <select
                value={language}
                onChange={(event) => setLanguage(event.target.value)}
                className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm font-semibold text-slate-900 outline-none focus:border-civic-500 focus:ring-2 focus:ring-civic-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              >
                <option>English</option>
                <option>Hindi</option>
                <option>Bengali</option>
                <option>Tamil</option>
              </select>
            </label>
          </div>

          <p className="mt-4 text-lg font-bold leading-7 text-slate-900 dark:text-white">
            {active ? questions[questionIndex] : "Start the session to begin the guided welfare conversation."}
          </p>
          <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
            <motion.div
              className="h-full rounded-full bg-civic-600"
              animate={{ width: `${active ? ((questionIndex + 1) / questions.length) * 100 : 0}%` }}
            />
          </div>
        </div>
      </div>

      <div className="mt-5 rounded-2xl border border-gray-100 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950/40">
        <div className="flex items-center justify-between gap-3">
          <p className="text-sm font-bold text-slate-900 dark:text-white">Live Transcript</p>
          <span className="flex items-center gap-2 text-xs font-bold text-green-700 dark:text-green-300">
            <span className={`h-2 w-2 rounded-full ${active ? "animate-pulse bg-green-500" : "bg-slate-300"}`} />
            Voice Activity
          </span>
        </div>
        <p className="mt-3 text-sm leading-6 text-slate-600 dark:text-slate-300">
          {active
            ? "Transcript preview will appear here while the child answers the current question."
            : "Transcript placeholder: audio and text records are prepared only after the session starts."}
        </p>
      </div>

      <div className="mt-5 grid gap-2">
        {questions.map((question, index) => (
          <div key={question} className="flex items-center gap-3 rounded-xl border border-gray-100 bg-white px-3 py-2 dark:border-slate-800 dark:bg-slate-900">
            <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-xs font-bold ${active && index <= questionIndex ? "bg-civic-600 text-white" : "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-300"}`}>
              {index + 1}
            </span>
            <p className="text-sm font-medium text-slate-700 dark:text-slate-200">{question}</p>
          </div>
        ))}
      </div>
    </Section>
  );
}

function HealthReport({ report, onUpload }) {
  const { register, handleSubmit } = useForm({
    defaultValues: { doctorHospital: "City Child Health Centre - Dr. Priya Menon" },
  });

  return (
    <Section title="Health Report" icon={FiFileText}>
      <form onSubmit={handleSubmit(onUpload)} className="grid gap-4 lg:grid-cols-[1fr_auto] lg:items-end">
        <label>
          <span className="field-label">Doctor / Hospital</span>
          <input className="input-field" {...register("doctorHospital", { required: true })} />
        </label>
        <Button type="submit" icon={FiUploadCloud}>{report ? "Replace File" : "Upload Report"}</Button>
      </form>
      <p className="mt-3 text-xs font-semibold text-slate-500 dark:text-slate-400">Accepted files: PDF, JPG, PNG</p>

      {report ? (
        <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-5">
          {[
            ["File Name", report.fileName],
            ["Upload Date", report.uploadDate],
            ["Doctor/Hospital", report.doctorHospital],
            ["File Type", "PDF"],
          ].map(([label, value]) => (
            <div key={label} className="field-block">
              <p className="field-label">{label}</p>
              <p className="field-value">{value}</p>
            </div>
          ))}
          <div className="flex items-end">
            <Button variant="secondary" icon={FiEye} className="w-full">Preview</Button>
          </div>
        </div>
      ) : (
        <div className="mt-5 rounded-2xl border border-dashed border-gray-200 bg-slate-50 p-8 text-center dark:border-slate-700 dark:bg-slate-950/40">
          <FiUploadCloud className="mx-auto h-8 w-8 text-slate-400" />
          <p className="mt-3 text-sm font-bold text-slate-900 dark:text-white">No health report uploaded</p>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Upload the latest report before submitting this welfare session.</p>
        </div>
      )}
    </Section>
  );
}

export default function ChildWelfareFollowUpSession() {
  const [sessionStatus, setSessionStatus] = useState("Pending");
  const [identityVerified, setIdentityVerified] = useState(false);
  const [timer, setTimer] = useState("00:00:00");
  const [questionIndex, setQuestionIndex] = useState(0);
  const [language, setLanguage] = useState("English");
  const [healthReport, setHealthReport] = useState(null);
  const [submitted, setSubmitted] = useState(false);
  const [successOpen, setSuccessOpen] = useState(false);
  const [toasts, setToasts] = useState([]);

  const pushToast = (message) => {
    const id = `${Date.now()}-${message}`;
    setToasts((current) => [...current, { id, message }]);
    window.setTimeout(() => {
      setToasts((current) => current.filter((toast) => toast.id !== id));
    }, 2600);
  };

  const progressStep = submitted ? 5 : healthReport && questionIndex >= questions.length - 1 ? 4 : sessionStatus !== "Pending" ? 3 : identityVerified ? 1 : 0;

  const childCards = useMemo(
    () => [
      ["Child Photo", childRecord.photo, FiUser],
      ["Child Name", childRecord.name, FiHeart],
      ["Child ID", childRecord.id, FiFileText],
      ["Age", childRecord.age, FiCalendar],
      ["Adoption Date", childRecord.adoptionDate, FiHome],
      ["Assigned Welfare Officer", childRecord.assignedOfficer, FiUser],
      ["Current Monitoring Cycle", childRecord.monitoringCycle, FiClock],
    ],
    []
  );

  const startSession = () => {
    setSessionStatus("In Progress");
    setTimer("00:07:18");
    setIdentityVerified(true);
    setQuestionIndex(3);
    pushToast("Session Started");
    window.setTimeout(() => pushToast("Identity Verified"), 350);
  };

  const uploadReport = (values) => {
    setHealthReport({
      fileName: `latest-health-report-${childRecord.id}.pdf`,
      uploadDate: todayLabel(),
      doctorHospital: values.doctorHospital,
    });
    pushToast("Health Report Uploaded");
    window.setTimeout(() => pushToast("Upload Successful"), 300);
  };

  const submitSession = () => {
    setSubmitted(true);
    setSessionStatus("Completed");
    setQuestionIndex(questions.length - 1);
    setSuccessOpen(true);
    pushToast("Session Submitted");
  };

  const sessionInfo = [
    ["Identity Verified", identityVerified],
    ["Camera Connected", sessionStatus === "In Progress" || sessionStatus === "Completed" || submitted],
    ["Microphone Active", sessionStatus === "In Progress"],
    ["Health Report Uploaded", Boolean(healthReport)],
    ["Questions Completed", questionIndex >= questions.length - 1 || submitted],
    ["Session Uploaded", submitted],
  ];

  return (
    <div className="space-y-6">
      <Toasts items={toasts} />
      <SuccessModal open={successOpen} onClose={() => setSuccessOpen(false)} />
      <Breadcrumb items={["Parent", "Child Welfare Follow-up Session"]} />

      <motion.header
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl border border-gray-100 bg-white p-5 shadow-card dark:border-slate-800 dark:bg-slate-900"
      >
        <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <p className="section-eyebrow">Child Welfare Follow-up Session</p>
            <h1 className="mt-1 text-2xl font-black tracking-tight text-slate-900 dark:text-white">Scheduled AI Child Welfare Check</h1>
            <p className="mt-1 max-w-3xl text-sm leading-6 text-slate-500 dark:text-slate-400">
              Complete the scheduled AI-assisted welfare session by verifying identity, uploading the latest health report, and submitting the guided conversation for welfare officer review.
            </p>
          </div>
          <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4 xl:min-w-[720px]">
            {[
              ["Next Scheduled Session", childRecord.nextSession],
              ["Submit Within", "3 days"],
              ["Submission Deadline", childRecord.submissionDeadline],
              ["Last Completed Session", childRecord.lastCompleted],
              ["Session Status", submitted ? "Completed" : sessionStatus],
            ].map(([label, value]) => (
              <div key={label} className="rounded-2xl border border-gray-100 bg-slate-50 px-4 py-3 dark:border-slate-700 dark:bg-slate-800">
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">{label}</p>
                <p className="mt-1 text-sm font-bold text-slate-900 dark:text-white">{value}</p>
              </div>
            ))}
          </div>
        </div>
      </motion.header>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-7">
        {childCards.map(([label, value, Icon]) => (
          <motion.div key={label} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="rounded-2xl border border-gray-100 bg-white p-4 shadow-card dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="field-label">{label}</p>
                {label === "Child Photo" ? (
                  <div className="mt-2 flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-civic-600 to-cyan-600 text-sm font-black text-white">
                    {value}
                  </div>
                ) : (
                  <p className="mt-2 break-words text-base font-black text-slate-900 dark:text-white">{value}</p>
                )}
              </div>
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-civic-50 text-civic-700 dark:bg-civic-500/10 dark:text-civic-300">
                <Icon className="h-5 w-5" />
              </span>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-card dark:border-slate-800 dark:bg-slate-900">
        <div className="grid gap-3 md:grid-cols-5">
          {steps.map((step, index) => {
            const done = index < progressStep;
            return (
              <div key={step} className="flex items-center gap-3 rounded-2xl border border-gray-100 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-950/40">
                <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl text-xs font-black ${done ? "bg-civic-600 text-white" : "bg-white text-slate-400 ring-1 ring-gray-200 dark:bg-slate-900 dark:ring-slate-700"}`}>
                  {done ? <FiCheck className="h-4 w-4" /> : index + 1}
                </span>
                <p className="text-sm font-bold text-slate-800 dark:text-slate-100">{step}</p>
              </div>
            );
          })}
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <CameraSection
          sessionStatus={sessionStatus}
          identityVerified={identityVerified}
          timer={timer}
          onStart={startSession}
        />
        <ConversationPanel
          sessionStatus={sessionStatus}
          questionIndex={questionIndex}
          language={language}
          setLanguage={setLanguage}
        />
      </div>

      <HealthReport report={healthReport} onUpload={uploadReport} />

      <Section title="Session Information" icon={FiCheckCircle}>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {sessionInfo.map(([label, complete]) => (
            <div key={label} className="flex items-center gap-3 rounded-2xl border border-gray-100 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950/40">
              <span className={`flex h-9 w-9 items-center justify-center rounded-xl ${complete ? "bg-green-600 text-white" : "bg-white text-slate-400 dark:bg-slate-900"}`}>
                {complete ? <FiCheck className="h-4 w-4" /> : <FiClock className="h-4 w-4" />}
              </span>
              <div>
                <p className="text-sm font-bold text-slate-900 dark:text-white">{label}</p>
                <Badge tone={complete ? "success" : "neutral"}>{complete ? "Complete" : "Pending"}</Badge>
              </div>
            </div>
          ))}
        </div>
      </Section>

      <Section title="Previous Sessions" icon={FiClock}>
        <div className="table-wrapper overflow-x-auto">
          <table className="min-w-[720px] w-full">
            <thead className="table-header">
              <tr>
                {["Date", "Status", "Health Report", "Submission Window", "Next Session", "Action"].map((heading) => (
                  <th key={heading} className="table-th">{heading}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 bg-white dark:divide-slate-800 dark:bg-slate-900">
              {previousSessions.map((row) => (
                <tr key={row.id} className="table-row">
                  <td className="table-td font-bold text-civic-700 dark:text-civic-300">{row.date}</td>
                  <td className="table-td"><Badge>{row.status}</Badge></td>
                  <td className="table-td">{row.healthReport}</td>
                  <td className="table-td">{row.submissionWindow}</td>
                  <td className="table-td">{row.nextSession}</td>
                  <td className="table-td">
                    <Button variant="ghost" icon={FiEye} className="min-h-[32px] px-3 py-1.5">View Submission Details</Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>

      <Section
        title="Submit Session"
        icon={FiSend}
        action={<Badge tone={submitted ? "success" : "warning"}>{submitted ? "Submitted" : `Submit by ${childRecord.submissionDeadline}`}</Badge>}
      >
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-sm font-bold text-slate-900 dark:text-white">Submission window: {childRecord.submissionWindow}</p>
            <p className="mt-1 text-sm leading-6 text-slate-500 dark:text-slate-400">
              Submit this completed session within 3 days of the scheduled date. The recording, transcript, and health report will be sent to the assigned welfare officer.
            </p>
          </div>
          <Button icon={FiSend} onClick={submitSession} disabled={!identityVerified || !healthReport || submitted}>
            {submitted ? "Session Submitted" : "Submit Session"}
          </Button>
        </div>
      </Section>
    </div>
  );
}
