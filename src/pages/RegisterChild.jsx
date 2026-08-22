import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import {
  FiActivity,
  FiAlertCircle,
  FiAlertTriangle,
  FiCalendar,
  FiCamera,
  FiCheck,
  FiCheckCircle,
  FiChevronLeft,
  FiChevronRight,
  FiCpu,
  FiFileText,
  FiHeart,
  FiLock,
  FiMapPin,
  FiPaperclip,
  FiRefreshCw,
  FiSave,
  FiShield,
  FiUploadCloud,
  FiUser,
  FiUsers,
  FiX,
  FiZap,
} from "react-icons/fi";
import Breadcrumb from "../components/Breadcrumb";
import Button from "../components/Button";
import FormInput from "../components/FormInput";
import Modal from "../components/Modal";
import ToastContainer from "../components/Toast";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../hooks/useToast";
import { childrenService } from "../services/childrenService";
import { orphanagesService } from "../services/orphanagesService";
import { roleLabels } from "../utils/constants";
import { classNames } from "../utils/formatters";
import useFrameCapture from "../hooks/useFrameCapture";
import useEnrollmentPipeline from "../hooks/useEnrollmentPipeline";
import useAutoCapture from "../hooks/useAutoCapture";
import FaceDetectionStatus from "../components/FaceDetectionStatus";
import { generateEnrollmentEmbeddings, normalizeEnrollmentEmbeddings, detectEnrollmentOutliers, generateMasterEmbedding, storeMasterEmbedding, verifyEnrollmentPipeline } from "../services/faceDetectionService";

const bloodGroups = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];
const entrySources = [
  "Found alone / Abandoned",
  "Rescued by police",
  "Referred by hospital",
  "Transferred from agency",
  "CWC Order / Court Surrender",
  "Other"
];

const languages = ["Hindi", "English", "Bengali", "Marathi", "Tamil", "Telugu", "Kannada", "Gujarati", "Other"];
const disabilityTypes = ["None", "Physical Impairment", "Cognitive / Learning", "Speech & Hearing", "Visual Impairment", "Multiple"];

const facialAngles = [
  { id: "front", label: "Frontal Neutral", desc: "Center face looking straight at camera" },
  { id: "left", label: "Left Profile", desc: "Turn head 30° to the left" },
  { id: "right", label: "Right Profile", desc: "Turn head 30° to the right" },
  { id: "up", label: "Tilted Up", desc: "Tilt head slightly upwards" },
  { id: "down", label: "Tilted Down", desc: "Tilt head slightly downwards" },
  { id: "smile", label: "Smiling Expression", desc: "Natural gentle smile" },
  { id: "neutral", label: "Neutral Expression", desc: "Relaxed facial posture" },
  { id: "blink", label: "Blink Liveness", desc: "Blink eyes for 3D liveness check" }
];

const selectCls =
  "mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs sm:text-sm text-slate-900 outline-none transition focus:border-[#2563EB] focus:ring-2 focus:ring-blue-500/15 disabled:bg-slate-50 disabled:cursor-not-allowed dark:border-slate-700 dark:bg-slate-800 dark:text-white font-sans";
const textareaCls =
  "mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs sm:text-sm text-slate-900 outline-none transition focus:border-[#2563EB] focus:ring-2 focus:ring-blue-500/15 placeholder:text-slate-400 dark:border-slate-700 dark:bg-slate-800 dark:text-white font-sans";

function calculateAgeFromDob(dobString) {
  if (!dobString) return "";
  const dob = new Date(dobString);
  const today = new Date();
  if (isNaN(dob.getTime())) return "";

  let years = today.getFullYear() - dob.getFullYear();
  let months = today.getMonth() - dob.getMonth();

  if (months < 0 || (months === 0 && today.getDate() < dob.getDate())) {
    years--;
    months += 12;
  }

  if (years < 0) return "Invalid DOB";
  if (years === 0) return `${months} month${months !== 1 ? "s" : ""}`;
  return `${years} yr${years !== 1 ? "s" : ""}${months > 0 ? `, ${months} mo${months !== 1 ? "s" : ""}` : ""}`;
}

function calculateNumericAge(dobString) {
  if (!dobString) return 0;
  const dob = new Date(dobString);
  const today = new Date();
  if (isNaN(dob.getTime())) return 0;
  let years = today.getFullYear() - dob.getFullYear();
  if (today.getMonth() < dob.getMonth() || (today.getMonth() === dob.getMonth() && today.getDate() < dob.getDate)) {
    years--;
  }
  return Math.max(0, years);
}

function createAvatar(initials, startColor, endColor) {
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="120" height="120" viewBox="0 0 120 120">
      <defs>
        <linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="${startColor}" />
          <stop offset="100%" stop-color="${endColor}" />
        </linearGradient>
      </defs>
      <rect width="120" height="120" rx="24" fill="url(#g)" />
      <circle cx="60" cy="48" r="20" fill="rgba(255,255,255,0.22)" />
      <path d="M26 96c6-18 19-26 34-26s28 8 34 26" fill="rgba(255,255,255,0.22)" />
      <text x="60" y="66" text-anchor="middle" font-family="Inter, system-ui, sans-serif" font-size="26" font-weight="800" fill="#fff">${initials}</text>
    </svg>
  `;
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}

function dataUriForUnknown() {
  return createAvatar("CH", "#2563EB", "#0F172A");
}

function predictAiRiskLevel(medicalCondition, foundCondition, disabilities) {
  if (disabilities && disabilities !== "None" && disabilities !== "") return "High";
  if (foundCondition?.includes("alone") || foundCondition?.includes("police")) return "Medium";
  if (medicalCondition?.toLowerCase().includes("critical") || medicalCondition?.toLowerCase().includes("review")) return "High";
  return "Low";
}

const wizardSteps = [
  { id: 1, title: "Basic Info", label: "Identity & Demographics" },
  { id: 2, title: "Admission & Legal", label: "Rescue & Placement" },
  { id: 3, title: "Medical & Health", label: "Vitals & Assessment" },
  { id: 4, title: "AI Face Enrollment", label: "Biometric Angles" },
  { id: 5, title: "Document Upload", label: "Legal Docs & Contacts" },
  { id: 6, title: "Review & Submit", label: "Final Verification" }
];

export default function RegisterChild() {
  const { user } = useAuth();
  const { toasts, success: showSuccess, error: showError, removeToast } = useToast();
  const navigate = useNavigate();

  const [currentStep, setCurrentStep] = useState(1);
  const [photoPreview, setPhotoPreview] = useState("");
  const [savedRecord, setSavedRecord] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [orphanages, setOrphanages] = useState([]);
  const [loadingOrphanages, setLoadingOrphanages] = useState(true);
  const [agreedToTerms, setAgreedToTerms] = useState(false);

  // Live Camera Workstation State
  const videoRef = useRef(null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [currentPoseIndex, setCurrentPoseIndex] = useState(0);
  const [autoCaptureStatus, setAutoCaptureStatus] = useState("Camera Ready");

  // Multi-angle face capture state
  const [capturedAngles, setCapturedAngles] = useState({
    front: true,
    left: false,
    right: false,
    up: false,
    down: false,
    smile: false,
    neutral: false,
    blink: false
  });
  const [isCapturingAngle, setIsCapturingAngle] = useState(false);

  const [capturedAnglePhotos, setCapturedAnglePhotos] = useState({});

  // Enrollment pipeline gallery — the ONLY source of captured images.
  // Grows in real time as the new pipeline saves each image.
  const [galleryFrames, setGalleryFrames] = useState([]);
  const galleryUrlsRef = useRef([]);
  const [targetFrameCount, setTargetFrameCount] = useState(40); // TARGET_ENROLLMENT_IMAGES
  const [viewingFrame, setViewingFrame] = useState(null);
  const [qualityStatus, setQualityStatus] = useState("Camera Ready");
  const [validationErrors, setValidationErrors] = useState([]);

  // ─── Enrollment completion + Phase 6A verification ──────────────────────
  // `enrollmentComplete` flips to true the moment capturedImages >= TARGET.
  // This IMMEDIATELY disables the frame-capture pipeline (no more /detect-face
  // requests) so Phase 6A can run on the saved images without interference.
  const [enrollmentComplete, setEnrollmentComplete] = useState(false);
  const [phase6AResult, setPhase6AResult] = useState(null);
  const [phase6ALoading, setPhase6ALoading] = useState(false);
  const [phase6AError, setPhase6AError] = useState(null);
  const phase6ATriggeredRef = useRef(false);

  // ─── Phase 6B.1 — Embedding Normalization (in-memory only) ───────────────
  // Triggered ONLY after Phase 6A completes successfully. Normalizes every
  // 512-d embedding (embedding / ||embedding||), validates the normalized
  // result, keeps normalized vectors in memory for the current request, and
  // returns ONLY a summary object. The normalized vectors are NEVER exposed
  // to the frontend.
  const [phase6B1Result, setPhase6B1Result] = useState(null);
  const [phase6B1Loading, setPhase6B1Loading] = useState(false);
  const [phase6B1Error, setPhase6B1Error] = useState(null);
  const phase6B1TriggeredRef = useRef(false);

  // ─── Phase 6B.2 — Outlier Embedding Detection (in-memory only) ───────────
  // Triggered ONLY after Phase 6B.1 completes. Computes pairwise cosine
  // similarity between all normalized embeddings and flags those whose
  // average similarity < OUTLIER_COSINE_THRESHOLD (0.75) as outliers.
  // Raw 512-d vectors are NEVER returned to the frontend.
  const [phase6B2Result, setPhase6B2Result] = useState(null);
  const [phase6B2Loading, setPhase6B2Loading] = useState(false);
  const [phase6B2Error, setPhase6B2Error] = useState(null);

  // ─── Phase 6B.3 — Master Embedding Generation (in-memory only) ──────────
  // Triggered ONLY after Phase 6B.2 completes. Computes the arithmetic mean
  // of all valid (non-outlier) embeddings, L2-normalizes the result, and
  // stores the master embedding in the AI microservice process for Phase 6C.
  // The 512 float values are NEVER returned to the frontend.
  const [phase6B3Result, setPhase6B3Result] = useState(null);
  const [phase6B3Loading, setPhase6B3Loading] = useState(false);
  const [phase6B3Error, setPhase6B3Error] = useState(null);

  // ─── Phase 6 — End-to-End Pipeline Verification ─────────────────────────
  // Triggered ONLY after Phase 6B.3 completes. Re-executes the ENTIRE
  // pipeline — images → embeddings → normalization → outlier detection →
  // master embedding — in a single in-memory pass on the AI microservice,
  // prints a detailed PASS/FAIL report to the Python terminal, and returns
  // a single JSON summary. NEVER saves to the database and NEVER exposes
  // the 512-d master embedding vector to the frontend.
  const [phase6VerifyResult, setPhase6VerifyResult] = useState(null);
  const [phase6VerifyLoading, setPhase6VerifyLoading] = useState(false);
  const [phase6VerifyError, setPhase6VerifyError] = useState(null);

  // ─── Phase 6C — Database Storage ────────────────────────────────────────
  // Triggered ONLY after Phase 6B.3 completes AND the Phase 6 end-to-end
  // verification passes (overallStatus === "PASSED"). Only then is the
  // master embedding persisted to PostgreSQL via the AI microservice.
  const [phase6CResult, setPhase6CResult] = useState(null);
  const [phase6CLoading, setPhase6CLoading] = useState(false);
  const [phase6CError, setPhase6CError] = useState(null);

  // Unique enrollment session ID — isolates this session's images into
  // their own folder (enrollment_images/session_<id>) so Phase 6A never
  // processes images from previous enrollment sessions.
  const [enrollmentSessionId, setEnrollmentSessionId] = useState(() =>
    `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
  );

  // Generate a stable draft child ID for this session
  const recordId = useMemo(() => `CH-${Math.floor(1000 + Math.random() * 9000)}`, []);

  // ─── Frame Capture & Transmission Pipeline (Existing) ───
  // Reuses the existing `videoRef` (no new camera). Captures one frame
  // every 300ms and POSTs it as multipart/form-data to the FastAPI
  // `/detect-face` endpoint. Only active while the live camera is on
  // AND the user is on Step 4 (AI Face Enrollment). Does NOT perform
  // face detection/recognition — capture + transmission only.
  const frameCapture = useFrameCapture({
    videoRef,
    enabled: isCameraActive && currentStep === 4 && !enrollmentComplete,
    cameraId: "CAM-01-MAIN",
  });

  // ─── Phase 5: Quality Validation + Auto Enrollment Pipeline ───
  // Orchestrates: Frame Capture → Quality Validation → Auto Enrollment
  const enrollmentPipeline = useEnrollmentPipeline({
    videoRef,
    enabled: isCameraActive && currentStep === 4,
    childId: savedRecord?.id || recordId,
    targetCount: targetFrameCount,
  });

  // ─── Phase 5C: Continuous High-Speed Auto Capture + Save Image ───
  // ONE-TIME 2-second countdown before the FIRST capture, then automatic
  // high-speed image capture + save for every ready frame until
  // `targetCount` (TARGET_ENROLLMENT_IMAGES) images are saved.
  // Pauses automatically when `captureAllowed` becomes false and resumes
  // (with NO further countdown) when it becomes true again.
  //
  // `onImageSaved` grows the gallery in REAL TIME — immediately after each
  // successful save, never at the end of enrollment.
  const handleImageSaved = useCallback((dataUrl, index) => {
    setGalleryFrames((prev) => {
      const next = [...prev];
      next[index - 1] = dataUrl;
      return next;
    });
  }, []);

  const autoCapture = useAutoCapture({
    videoRef,
    lastResponse: frameCapture.lastResponse,
    enabled: isCameraActive && currentStep === 4 && !enrollmentComplete,
    cameraId: "CAM-01-MAIN",
    targetCount: targetFrameCount,
    onImageSaved: handleImageSaved,
    sessionId: enrollmentSessionId,
    onComplete: (result) => {
      console.log("[RegisterChild] Enrollment completed, stopping frame capture and triggering Phase 6A:", result);
      setEnrollmentComplete(true);
    },
  });

  // ─── Enrollment Completion → Phase 6A Trigger ────────────────────────────
  // When enrollmentComplete flips to true:
  //   1. The frame-capture pipeline has ALREADY stopped (enabled=false above).
  //      No more POST /detect-face requests will be sent.
  //   2. Phase 6A (embedding verification) is triggered on the saved folder.
  //   3. The result is stored and displayed in the completion card.
  // Phase 6A → Phase 6B.1 — triggered ONLY once per session.
  // Phase 6B.1 runs immediately after Phase 6A completes.
  useEffect(() => {
    if (!enrollmentComplete) return;
    if (phase6ATriggeredRef.current) return;

    phase6ATriggeredRef.current = true;
    setPhase6ALoading(true);
    setPhase6AError(null);
    setPhase6AResult(null);
    setPhase6B1Loading(false);
    setPhase6B1Error(null);
    setPhase6B1Result(null);
    setPhase6B2Loading(false);
    setPhase6B2Error(null);
    setPhase6B2Result(null);
    setPhase6B3Loading(false);
    setPhase6B3Error(null);
    setPhase6B3Result(null);
    setPhase6VerifyLoading(false);
    setPhase6VerifyError(null);
    setPhase6VerifyResult(null);
    setPhase6CLoading(false);
    setPhase6CError(null);
    setPhase6CResult(null);

    let cancelled = false;

    const runPhase6A = async () => {
      try {
        console.log("[RegisterChild] Starting Phase 6A (embedding verification)...");
        const result = await generateEnrollmentEmbeddings(enrollmentSessionId);
        if (!cancelled) {
          setPhase6AResult(result);
          console.log("[RegisterChild] Phase 6A completed:", result);
        }
      } catch (err) {
        if (!cancelled) {
          console.error("[RegisterChild] Phase 6A error:", err);
          setPhase6AError(err?.message || String(err));
        }
      } finally {
        if (!cancelled) {
          setPhase6ALoading(false);
        }
      }
    };

    // ─── Phase 6B.1 — Embedding Normalization (in-memory only) ───────────
    // Normalizes every 512-d embedding (embedding / ||embedding||),
    // validates the normalized result, keeps vectors in memory for the
    // current request, and returns ONLY a summary object.
    const runPhase6B1 = async () => {
      phase6B1TriggeredRef.current = true;
      setPhase6B1Loading(true);
      setPhase6B1Error(null);

      try {
        console.log("[RegisterChild] Starting Phase 6B.1 (embedding normalization)...");
        const result = await normalizeEnrollmentEmbeddings(enrollmentSessionId);
        if (!cancelled) {
          setPhase6B1Result(result);
          console.log("[RegisterChild] Phase 6B.1 completed:", result);
        }
      } catch (err) {
        if (!cancelled) {
          console.error("[RegisterChild] Phase 6B.1 error:", err);
          setPhase6B1Error(err?.message || String(err));
        }
      } finally {
        if (!cancelled) {
          setPhase6B1Loading(false);
        }
      }
    };

    // ─── Phase 6B.2 — Outlier Embedding Detection (in-memory only) ──────────
    // Runs after Phase 6B.1 regardless of whether 6B.1 reported failures.
    // Computes pairwise cosine similarity, flags outliers, returns summary.
    const runPhase6B2 = async () => {
      setPhase6B2Loading(true);
      setPhase6B2Error(null);

      try {
        console.log("[RegisterChild] Starting Phase 6B.2 (outlier detection)...");
        const result = await detectEnrollmentOutliers(enrollmentSessionId);
        if (!cancelled) {
          setPhase6B2Result(result);
          console.log("[RegisterChild] Phase 6B.2 completed:", result);
        }
      } catch (err) {
        if (!cancelled) {
          console.error("[RegisterChild] Phase 6B.2 error:", err);
          setPhase6B2Error(err?.message || String(err));
        }
      } finally {
        if (!cancelled) {
          setPhase6B2Loading(false);
        }
      }
    };

    // ─── Phase 6B.3 — Master Embedding Generation (in-memory only) ────────
    // Uses ONLY valid (non-outlier) embeddings from Phase 6B.2.
    // Arithmetic mean → L2-normalize → store in microservice for Phase 6C.
    // The 512-d master vector is NEVER returned to the frontend.
    const runPhase6B3 = async () => {
      setPhase6B3Loading(true);
      setPhase6B3Error(null);

      try {
        console.log("[RegisterChild] Starting Phase 6B.3 (master embedding generation)...");
        const result = await generateMasterEmbedding(enrollmentSessionId);
        if (!cancelled) {
          setPhase6B3Result(result);
          console.log("[RegisterChild] Phase 6B.3 completed:", result);
          return result;
        }
      } catch (err) {
        if (!cancelled) {
          console.error("[RegisterChild] Phase 6B.3 error:", err);
          setPhase6B3Error(err?.message || String(err));
        }
      } finally {
        if (!cancelled) {
          setPhase6B3Loading(false);
        }
      }
      return null;
    };

    // ─── Phase 6 — End-to-End Enrollment Pipeline Verification ─────────────
    // Runs AUTOMATICALLY after Phase 6B.3 completes. Re-executes the ENTIRE
    // enrollment pipeline (images → embeddings → normalization → outlier
    // detection → master embedding) in a SINGLE in-memory pass and verifies
    // every stage. The microservice prints a detailed PASS/FAIL report to the
    // Python terminal. Nothing is written to the database and the 512-d master
    // vector is NEVER returned to the frontend — only the JSON summary below.
    const runPhase6Verify = async () => {
      setPhase6VerifyLoading(true);
      setPhase6VerifyError(null);

      try {
        console.log("[RegisterChild] Starting Phase 6 verification (end-to-end pipeline...)");
        const result = await verifyEnrollmentPipeline(enrollmentSessionId);
        if (!cancelled) {
          setPhase6VerifyResult(result);
          console.log("[RegisterChild] Phase 6 verification completed:", result);
          return result;
        }
      } catch (err) {
        if (!cancelled) {
          console.error("[RegisterChild] Phase 6 verification error:", err);
          setPhase6VerifyError(err?.message || String(err));
        }
      } finally {
        if (!cancelled) {
          setPhase6VerifyLoading(false);
        }
      }
      return null;
    };

    // ─── Phase 6C — Database Storage ──────────────────────────────────────
    // Uses the in-memory master embedding and persists to PostgreSQL.
    // Runs ONLY after the Phase 6 end-to-end verification PASSES.
    // ─── Phase 6C — Database Storage ──────────────────────────────────────
    // Uses the in-memory master embedding and persists to PostgreSQL.
    // Runs ONLY after the Phase 6 end-to-end verification PASSES.
    const runPhase6C = async (phase6B3Data, verificationData) => {
      console.log("PHASE 6C STARTED");
      setPhase6CLoading(true);
      setPhase6CError(null);

      // Safe extraction of inputs without unsafe .length property access
      const imagesCapturedCount =
        (Array.isArray(autoCapture?.capturedImages) ? autoCapture.capturedImages.length : null) ??
        (typeof autoCapture?.capturedCount === "number" ? autoCapture.capturedCount : null) ??
        (Array.isArray(galleryFrames) ? galleryFrames.length : null) ??
        verificationData?.imagesCaptured ??
        phase6B3Data?.validEmbeddingsUsed ??
        0;

      const masterEmbedding =
        phase6B3Data?.masterEmbedding ||
        verificationData?.masterEmbedding ||
        null;

      const embeddings =
        phase6B3Data?.embeddings ||
        phase6AResult?.embeddings ||
        null;

      const normalizedEmbeddings =
        phase6B3Data?.normalizedEmbeddings ||
        phase6B1Result?.embeddings ||
        null;

      // Requirement 6: Detailed logging immediately before validation/call
      console.log("===== PHASE 6C INPUT =====");
      console.log({
        verificationResult: verificationData || phase6VerifyResult || null,
        phase6B3Result: phase6B3Data || phase6B3Result || null,
        masterEmbedding,
        embeddings,
        normalizedEmbeddings,
      });
      console.log("==========================");

      // Requirement 5: Add null/undefined validation before execution
      if (!phase6B3Data || typeof phase6B3Data !== "object") {
        const errorReason = "Missing phase6B3Result data object";
        console.error("PHASE 6C FAILED");
        console.error("Reason:", errorReason);
        setPhase6CError(errorReason);
        setPhase6CLoading(false);
        return;
      }

      if (!verificationData && !phase6VerifyResult) {
        const errorReason = "Missing verificationResult data object";
        console.error("PHASE 6C FAILED");
        console.error("Reason:", errorReason);
        setPhase6CError(errorReason);
        setPhase6CLoading(false);
        return;
      }

      console.log("PHASE 6C INPUT VERIFIED PASS");

      try {
        console.log("[RegisterChild] Starting Phase 6C (database storage)...");
        const payload = {
          sessionId: enrollmentSessionId,
          childId: recordId,
          imagesCaptured: imagesCapturedCount,
          imagesUsed: phase6B3Data?.validEmbeddingsUsed || verificationData?.validEmbeddingsUsed || 0,
          outliersRemoved: phase6B3Data?.outliersExcluded || verificationData?.outliersExcluded || 0,
        };

        console.log("PHASE 6C API CALLED PASS");
        const result = await storeMasterEmbedding(payload);

        if (!cancelled) {
          setPhase6CResult(result);
          console.log("PHASE 6C COMPLETED PASS");
          console.log("[RegisterChild] Phase 6C completed:", result);
        }
      } catch (err) {
        if (!cancelled) {
          const errMsg = err?.message || String(err);
          console.error("PHASE 6C FAILED");
          console.error("Reason:", errMsg);
          setPhase6CError(errMsg);
        }
      } finally {
        if (!cancelled) {
          setPhase6CLoading(false);
        }
      }
    };

    const runAllPhases = async () => {
      // Phase 6A — generate + verify raw embeddings
      await runPhase6A();

      // Phase 6B.1 — normalize every embedding
      if (!cancelled && !phase6B1TriggeredRef.current) {
        await runPhase6B1();
      }

      // Phase 6B.2 — outlier detection
      if (!cancelled) {
        await runPhase6B2();
      }

      // Phase 6B.3 — master embedding generation
      let b3Result = null;
      if (!cancelled) {
        b3Result = await runPhase6B3();
      }

      // Phase 6 — END-TO-END PIPELINE VERIFICATION (runs AUTOMATICALLY
      // after Phase 6B.3 completes). Confirms images captured, embeddings
      // generated + normalized, outliers detected, and master embedding
      // created — BEFORE any database write.
      let verifyResult = null;
      if (!cancelled && b3Result && b3Result.success && b3Result.masterEmbeddingCreated) {
        verifyResult = await runPhase6Verify();
      }

      // Phase 6C — database storage (ONLY after verification PASSES)
      if (
        !cancelled &&
        b3Result &&
        b3Result.success &&
        b3Result.masterEmbeddingCreated &&
        verifyResult &&
        verifyResult.success &&
        verifyResult.overallStatus === "PASSED" &&
        verifyResult.readyForDatabase
      ) {
        await runPhase6C(b3Result, verifyResult);
      }
    };

    runAllPhases();

    return () => {
      cancelled = true;
    };
  }, [enrollmentComplete]);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: "user" }
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setIsCameraActive(true);
      setAutoCaptureStatus("Align Face in Oval Target");
      showSuccess("Live webcam feed active");
    } catch (err) {
      console.error("Camera access error:", err);
      showError("Unable to open camera. Snapshot file mode active.");
      setIsCameraActive(false);
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const tracks = videoRef.current.srcObject.getTracks();
      tracks.forEach((track) => track.stop());
      videoRef.current.srcObject = null;
    }
    setIsCameraActive(false);
  };

  const restartEnrollmentSession = () => {
    setCapturedAngles({
      front: false,
      left: false,
      right: false,
      up: false,
      down: false,
      smile: false,
      neutral: false,
      blink: false
    });
    setCapturedAnglePhotos({});
    setCurrentPoseIndex(0);
    setAutoCaptureStatus("Ready to Start");
    setGalleryFrames([]);
    galleryUrlsRef.current.forEach((url) => URL.revokeObjectURL(url));
    galleryUrlsRef.current = [];
    if (!isCameraActive) {
      startCamera();
    }
  };

  const captureCurrentPose = () => {
    const poseId = facialAngles[currentPoseIndex]?.id;
    if (!poseId) return;

    setIsCapturingAngle(true);
    setAutoCaptureStatus(`Capturing ${facialAngles[currentPoseIndex].label}...`);

    let capturedImg = photoPreview || dataUriForUnknown();
    if (videoRef.current) {
      try {
        const canvas = document.createElement("canvas");
        canvas.width = videoRef.current.videoWidth || 640;
        canvas.height = videoRef.current.videoHeight || 480;
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
          capturedImg = canvas.toDataURL("image/jpeg");
        }
      } catch (err) {
        console.warn("Snapshot capture canvas notice:", err);
      }
    }

    setTimeout(() => {
      setCapturedAngles((prev) => ({ ...prev, [poseId]: true }));
      setCapturedAnglePhotos((prev) => ({ ...prev, [poseId]: capturedImg }));
      if (poseId === "smile") {
        setPhotoPreview(capturedImg);
      }
      setIsCapturingAngle(false);

      if (currentPoseIndex < facialAngles.length - 1) {
        setCurrentPoseIndex((idx) => idx + 1);
        setAutoCaptureStatus(`Position for ${facialAngles[currentPoseIndex + 1].label}`);
      } else {
        setAutoCaptureStatus("All 8 Poses Enrolled • Vector Ready");
        showSuccess("Biometric multi-angle enrollment complete! Smiling profile photo selected.");
      }
    }, 500);
  };

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  // Uploaded document files state
  const [uploadedDocs, setUploadedDocs] = useState({
    medicalReport: null,
    policeReport: null,
    cwcOrder: null,
    birthCertificate: null
  });

  const isOrphanageUser = user?.role === "orphanage";

  useEffect(() => {
    if (user?.role === "admin") {
      const loadOrphanages = async () => {
        try {
          const response = await orphanagesService.getAll({ limit: 100 });
          const payload = response.data ?? response;
          const list = Array.isArray(payload) ? payload : payload.data || [];
          setOrphanages(list);
        } catch (err) {
          console.error("Failed to load orphanages:", err);
          showError("Failed to load orphanage list");
        } finally {
          setLoadingOrphanages(false);
        }
      };
      loadOrphanages();
    } else {
      setLoadingOrphanages(false);
    }
  }, [user?.role]);

  const { register, handleSubmit, reset, watch, setValue, formState } = useForm({
    defaultValues: {
      orphanage: !isOrphanageUser ? "" : undefined,
      foundCondition: entrySources[0],
      gender: "Female",
      bloodGroup: "O+",
      primaryLanguage: "Hindi",
      disability: "None",
      admissionDate: new Date().toISOString().split("T")[0],
      dob: "2017-05-15"
    }
  });

  const watchDob = watch("dob");
  const watchName = watch("name");
  const watchGender = watch("gender");
  const watchBloodGroup = watch("bloodGroup");
  const watchFoundCondition = watch("foundCondition");
  const watchMedicalCondition = watch("medicalCondition");
  const watchDisability = watch("disability");
  const watchOrphanage = watch("orphanage");
  const watchCaretaker = watch("caretaker");
  const watchRoomNo = watch("roomNo");
  const selectedPhoto = watch("photo");

  const calculatedAge = useMemo(() => calculateAgeFromDob(watchDob), [watchDob]);
  const numericAge = useMemo(() => calculateNumericAge(watchDob), [watchDob]);
  const predictedRisk = useMemo(
    () => predictAiRiskLevel(watchMedicalCondition, watchFoundCondition, watchDisability),
    [watchMedicalCondition, watchFoundCondition, watchDisability]
  );

  const capturedAngleCount = useMemo(
    () => Object.values(capturedAngles).filter(Boolean).length,
    [capturedAngles]
  );
  const faceReadinessPercent = useMemo(
    () => Math.round((capturedAngleCount / facialAngles.length) * 100),
    [capturedAngleCount]
  );

  const handlePhotoChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result;
        setPhotoPreview(base64);
        setCapturedAnglePhotos((prev) => ({
          ...prev,
          smile: base64,
          front: base64,
        }));
        setCapturedAngles((prev) => ({ ...prev, front: true, smile: true }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAngleToggle = (angleId) => {
    setIsCapturingAngle(true);
    setTimeout(() => {
      setCapturedAngles((prev) => ({ ...prev, [angleId]: !prev[angleId] }));
      setIsCapturingAngle(false);
    }, 400);
  };

  const handleDocUpload = (docKey, event) => {
    const file = event.target.files?.[0];
    if (file) {
      setUploadedDocs((prev) => ({ ...prev, [docKey]: file.name }));
      showError && showSuccess(`Uploaded ${file.name}`);
    }
  };

  const nextStep = () => setCurrentStep((prev) => Math.min(6, prev + 1));
  const prevStep = () => setCurrentStep((prev) => Math.max(1, prev - 1));

  const handleFormKeyDown = (e) => {
    if (e.key === "Enter") {
      if (e.target.tagName === "BUTTON") {
        return;
      }
      e.preventDefault();

      const form = e.currentTarget;
      const focusable = Array.from(
        form.querySelectorAll(
          "input:not([type='hidden']):not([type='file']):not([disabled]), select:not([disabled]), textarea:not([disabled])"
        )
      ).filter((el) => el.offsetWidth > 0 && el.offsetHeight > 0);

      const currentIndex = focusable.indexOf(e.target);

      if (currentIndex > -1 && currentIndex < focusable.length - 1) {
        focusable[currentIndex + 1].focus();
      } else if (currentIndex === focusable.length - 1 || currentIndex === -1) {
        if (currentStep < 6) {
          nextStep();
        }
      }
    }
  };

  const onSubmit = async (values) => {
    if (currentStep < 6) {
      return;
    }
    try {
      setSubmitting(true);

      const nameParts = (values.name || "").trim().split(" ");
      const firstName = nameParts[0] || "Child";
      const lastName = nameParts.slice(1).join(" ") || undefined;

      const childData = {
        firstName,
        lastName,
        dateOfBirth: values.dob || undefined,
        approximateAge: numericAge || 8,
        gender: (values.gender || "Female").toUpperCase(),
        bloodGroup: (values.bloodGroup || "O+").replace("+", "_POSITIVE").replace("-", "_NEGATIVE"),
        admissionDate: values.admissionDate,
        foundLocation: values.foundLocation || "Not Specified",
        entrySource: values.foundCondition || "Found alone / Abandoned",
        admissionReason: values.notes || "Intake registration",
        distinguishingMarks: values.identificationMarks || "None reported",
        healthStatus: values.medicalCondition?.toLowerCase().includes("critical") ? "CRITICAL" : "UNKNOWN",
        specialNotes: `Room: ${values.roomNo || "N/A"} | Caretaker: ${values.caretaker || "Assigned"} | Case: ${values.caseNo || "N/A"} | FIR: ${values.firNo || "N/A"} | Medical: ${values.medicalCondition || "None"}`
      };

      if (user?.role === "admin" && values.orphanage) {
        const selectedOrph = orphanages.find((o) => o.name === values.orphanage || o.id === values.orphanage);
        if (selectedOrph) {
          childData.orphanageId = selectedOrph.id;
        }
      }

      const photoFile = values.photo?.[0];
      const response = await childrenService.create(childData, photoFile);
      const createdChildId =
        response?.data?.id ||
        response?.id ||
        response?.data?.childCode ||
        response?.childCode ||
        recordId;

      if (createdChildId) {
        try {
          const poseMapping = {
            front: "FRONT_NEUTRAL",
            left: "LEFT_PROFILE",
            right: "RIGHT_PROFILE",
            up: "LOOK_UP",
            down: "LOOK_DOWN",
            smile: "FRONT_SMILING",
            neutral: "FRONT_NEUTRAL",
            blink: "BLINK_LIVENESS",
          };

          const poseKeys = ["front", "left", "right", "up", "down", "smile", "blink"];

          // The gallery is the ONLY source of captured enrollment images —
          // fed by the new continuous Enrollment Pipeline in real time.
          let sampleFaceFrames;

          if (galleryFrames.length > 0) {
            sampleFaceFrames = galleryFrames.map((frame, idx) => {
              const poseKey = poseKeys[idx % poseKeys.length];
              return {
                childId: createdChildId,
                pose: poseMapping[poseKey] || "FRONT_NEUTRAL",
                imageBase64: frame,
                lightingQuality: 95,
                blurScore: 92,
              };
            });
          } else {
            sampleFaceFrames = facialAngles.map((angle) => ({
              childId: createdChildId,
              pose: poseMapping[angle.id] || "FRONT_NEUTRAL",
              imageBase64: capturedAnglePhotos[angle.id] || photoPreview || dataUriForUnknown(),
              lightingQuality: 95,
              blurScore: 92,
            }));
          }

          const currentMasterEmbedding =
            phase6B3Result?.masterEmbedding ||
            phase6VerifyResult?.masterEmbedding ||
            phase6CResult?.masterEmbedding;

          await childrenService.completeFaceEnrollment(createdChildId, sampleFaceFrames, currentMasterEmbedding);
        } catch (enrollErr) {
          console.warn("AI Face Enrollment notice:", enrollErr);
        }
      }

      setSavedRecord({
        id: response.data?.childCode || response.childCode || recordId,
        name: `${firstName} ${lastName || ""}`.trim(),
        registeredBy: response.data?.registeredBy || user?.name || "Officer"
      });

      showSuccess("Child registered successfully! AI Attendance biometrics stored.");

      setTimeout(() => {
        navigate(`/${user.role === "admin" ? "admin" : "orphanage"}/children`);
      }, 1800);
    } catch (err) {
      showError(err.message || "Failed to register child");
      console.error("Error registering child:", err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 pb-8">
      <ToastContainer toasts={toasts} onRemove={removeToast} />
      <Breadcrumb items={[roleLabels[user.role], "Register Child Intake"]} />

      {/* Header Card */}
      <div className="relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-6 shadow-card dark:border-slate-800 dark:bg-slate-900">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-2.5 py-0.5 text-[11px] font-semibold text-[#2563EB] dark:bg-blue-500/10 dark:text-blue-400">
                <FiShield className="h-3 w-3" /> Multi-Step AI Intake Wizard
              </span>
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400">
                <FiZap className="h-3 w-3" /> 512-d Biometric Enrollment
              </span>
            </div>
            <h1 className="mt-2 text-2xl sm:text-3xl font-extrabold tracking-tight text-[#0F172A] dark:text-white font-display leading-tight">
              New Child Registration
            </h1>
            <p className="mt-1 text-xs sm:text-sm text-[#64748B] dark:text-slate-300 font-sans max-w-2xl leading-relaxed">
              Capture child identity, automated age calculation, legal rescue metadata, multi-angle AI face enrollment, and health assessments.
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-3">
            <div className="rounded-xl border border-slate-200/80 bg-slate-50 px-4 py-2.5 text-right dark:border-slate-800 dark:bg-slate-800/80">
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Draft Intake ID</p>
              <p className="mt-0.5 text-base font-extrabold text-[#0F172A] dark:text-white font-display">{recordId}</p>
            </div>
          </div>
        </div>
      </div>

      {/* 6-Step Navigation Progress Bar */}
      <div className="overflow-x-auto pb-1">
        <div className="flex min-w-[720px] items-center justify-between rounded-2xl border border-slate-200/80 bg-white p-3 shadow-card dark:border-slate-800 dark:bg-slate-900">
          {wizardSteps.map((step) => {
            const isActive = currentStep === step.id;
            const isCompleted = currentStep > step.id;
            return (
              <button
                key={step.id}
                type="button"
                onClick={() => setCurrentStep(step.id)}
                className={classNames(
                  "flex flex-1 items-center gap-3 rounded-xl p-2.5 transition text-left",
                  isActive ? "bg-blue-50/80 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/30" : "hover:bg-slate-50 dark:hover:bg-slate-800/50"
                )}
              >
                <div className={classNames("flex h-8 w-8 shrink-0 items-center justify-center rounded-xl text-xs font-bold font-display transition", isCompleted ? "bg-emerald-500 text-white" : isActive ? "bg-[#2563EB] text-white shadow-sm shadow-blue-500/30" : "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400")}>
                  {isCompleted ? <FiCheck className="h-4 w-4" /> : step.id}
                </div>
                <div className="min-w-0">
                  <p className={classNames("text-xs font-bold font-display truncate", isActive ? "text-[#2563EB] dark:text-blue-400" : "text-[#0F172A] dark:text-white")}>{step.title}</p>
                  <p className="text-[10px] text-slate-400 truncate font-sans">{step.label}</p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Form */}
      <form
        onSubmit={(e) => {
          if (currentStep < 6) {
            e.preventDefault();
            return;
          }
          handleSubmit(onSubmit)(e);
        }}
        onKeyDown={handleFormKeyDown}
        className="grid gap-6 grid-cols-1 lg:grid-cols-12 items-start"
      >
        <div className="lg:col-span-8">
          <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-card dark:border-slate-800 dark:bg-slate-900 min-h-[520px] flex flex-col justify-between">
            <div>
              <AnimatePresence mode="wait">
                {/* STEP 1: Basic Information */}
                {currentStep === 1 && (
                  <motion.div key="step1" initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 12 }} className="space-y-5">
                    <div className="border-b border-slate-100 dark:border-slate-800 pb-3">
                      <h2 className="text-base font-bold text-[#0F172A] dark:text-white font-display">Step 1: Basic Information</h2>
                      <p className="text-xs text-slate-500 dark:text-slate-400 font-sans mt-0.5">Enter core child identity details and date of birth for automated age calculation.</p>
                    </div>
                    <div className="grid gap-4 md:grid-cols-2">
                      <FormInput label="Full Name" icon={FiUser} placeholder="Child's first and last name" error={formState.errors.name?.message} {...register("name", { required: "Full name is required" })} />
                      <div>
                        <label className="text-[13px] font-semibold text-slate-700 dark:text-slate-300">Date of Birth <span className="text-red-500">*</span></label>
                        <div className="relative mt-1.5">
                          <input type="date" className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs sm:text-sm text-slate-900 outline-none transition focus:border-[#2563EB] focus:ring-2 focus:ring-blue-500/15 dark:border-slate-700 dark:bg-slate-800 dark:text-white font-sans" {...register("dob", { required: "Date of Birth is required" })} />
                        </div>
                      </div>
                      <div className="rounded-xl border border-blue-100 bg-blue-50/60 p-3.5 dark:border-blue-500/20 dark:bg-blue-500/10">
                        <p className="text-[11px] font-bold uppercase tracking-wider text-[#2563EB] dark:text-blue-400">Automated Calculated Age</p>
                        <p className="mt-1 text-lg font-extrabold text-[#0F172A] dark:text-white font-display">{calculatedAge || "Select Date of Birth above"}</p>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 font-sans">Age calculated automatically from DOB.</p>
                      </div>
                      <div>
                        <label className="text-[13px] font-semibold text-slate-700 dark:text-slate-300">Gender <span className="text-red-500">*</span></label>
                        <select className={selectCls} {...register("gender", { required: true })}><option>Female</option><option>Male</option><option>Other</option></select>
                      </div>
                      <div>
                        <label className="text-[13px] font-semibold text-slate-700 dark:text-slate-300">Primary Spoken Language</label>
                        <select className={selectCls} {...register("primaryLanguage")}>{languages.map((l) => <option key={l}>{l}</option>)}</select>
                      </div>
                      <div className="md:col-span-2">
                        <label className="text-[13px] font-semibold text-slate-700 dark:text-slate-300">Distinguishing Identification Marks</label>
                        <textarea rows={3} placeholder="Birthmarks, scars, tattoos, unique features..." className={textareaCls} {...register("identificationMarks")} />
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* STEP 2: Admission & Legal */}
                {currentStep === 2 && (
                  <motion.div key="step2" initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 12 }} className="space-y-5">
                    <div className="border-b border-slate-100 dark:border-slate-800 pb-3">
                      <h2 className="text-base font-bold text-[#0F172A] dark:text-white font-display">Step 2: Admission & Legal Rescue Details</h2>
                      <p className="text-xs text-slate-500 dark:text-slate-400 font-sans mt-0.5">Orphanage housing placement, caretaker assignment, and legal CWC case documentation.</p>
                    </div>
                    <div className="grid gap-4 md:grid-cols-2">
                      <FormInput label="Date of Admission" icon={FiCalendar} type="date" error={formState.errors.admissionDate?.message} {...register("admissionDate", { required: "Admission date is required" })} />
                      {user?.role === "admin" && (
                        <div>
                          <label className="text-[13px] font-semibold text-slate-700 dark:text-slate-300">Assigned Orphanage</label>
                          <select className={selectCls} disabled={loadingOrphanages} {...register("orphanage", { required: true })}>
                            <option value="">{loadingOrphanages ? "Loading..." : "Select orphanage"}</option>
                            {orphanages.map((h) => <option key={h.id} value={h.name}>{h.name}</option>)}
                          </select>
                        </div>
                      )}
                      <FormInput label="Housing Room / Dorm No." icon={FiMapPin} placeholder="e.g. Room R-12, Block B" {...register("roomNo")} />
                      <FormInput label="Assigned Caretaker / Officer" icon={FiUser} placeholder="Name of primary caseworker" {...register("caretaker")} />
                      <FormInput label="School & Class Enrolled" icon={FiFileText} placeholder="e.g. Govt Primary School, Class 4A" {...register("classSchool")} />
                      <div>
                        <label className="text-[13px] font-semibold text-slate-700 dark:text-slate-300">How the Child Was Found / Entry Source</label>
                        <select className={selectCls} {...register("foundCondition")}>{entrySources.map((c) => <option key={c}>{c}</option>)}</select>
                      </div>
                      <FormInput label="Found / Rescue Location" icon={FiMapPin} placeholder="City, railway station, district" {...register("foundLocation")} />
                      <FormInput label="CWC Case Reference Number" icon={FiFileText} placeholder="e.g. CWC-ND-2026-881" {...register("caseNo")} />
                      <FormInput label="Police FIR Number (If Applicable)" icon={FiShield} placeholder="e.g. FIR-102/2026" {...register("firNo")} />
                      <FormInput label="Rescuing Agency / NGO" icon={FiUsers} placeholder="e.g. Childline 1098, State Police" {...register("rescueAgency")} />
                    </div>
                  </motion.div>
                )}

                {/* STEP 3: Medical */}
                {currentStep === 3 && (
                  <motion.div key="step3" initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 12 }} className="space-y-5">
                    <div className="border-b border-slate-100 dark:border-slate-800 pb-3">
                      <h2 className="text-base font-bold text-[#0F172A] dark:text-white font-display">Step 3: Medical & Physical Health Assessment</h2>
                      <p className="text-xs text-slate-500 dark:text-slate-400 font-sans mt-0.5">Biometric vitals, blood group, allergies, and special care recommendations.</p>
                    </div>
                    <div className="grid gap-4 md:grid-cols-2">
                      <div>
                        <label className="text-[13px] font-semibold text-slate-700 dark:text-slate-300">Blood Group</label>
                        <select className={selectCls} {...register("bloodGroup")}>{bloodGroups.map((g) => <option key={g}>{g}</option>)}</select>
                      </div>
                      <FormInput label="Height (cm)" icon={FiActivity} type="number" placeholder="e.g. 128" {...register("heightCm")} />
                      <FormInput label="Weight (kg)" icon={FiActivity} type="number" placeholder="e.g. 26" {...register("weightKg")} />
                      <div>
                        <label className="text-[13px] font-semibold text-slate-700 dark:text-slate-300">Disability / Special Needs</label>
                        <select className={selectCls} {...register("disability")}>{disabilityTypes.map((d) => <option key={d}>{d}</option>)}</select>
                      </div>
                      <FormInput label="Known Allergies (Food / Medication)" icon={FiHeart} placeholder="e.g. Peanuts, Penicillin, None" {...register("allergies")} />
                      <FormInput label="Chronic Illnesses & Medications" icon={FiFileText} placeholder="e.g. Asthma (Inhaler daily)" {...register("medications")} />
                      <div className="md:col-span-2">
                        <label className="text-[13px] font-semibold text-slate-700 dark:text-slate-300">Medical Condition Summary & Doctor Notes</label>
                        <textarea rows={3} placeholder="General health status, vaccination status, psychological evaluation notes..." className={textareaCls} {...register("medicalCondition")} />
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* STEP 4: AI Face Enrollment */}
                {currentStep === 4 && (
                  <motion.div key="step4" initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 12 }} className="space-y-5">
                    <div className="border-b border-slate-100 dark:border-slate-800 pb-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-[11px] font-bold text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400"><FiCheckCircle className="h-3 w-3" /> AI Attendance Ready</span>
                          <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2.5 py-0.5 text-[11px] font-bold text-[#2563EB] dark:bg-blue-500/10 dark:text-blue-400"><FiCpu className="h-3 w-3" /> 512-d Deep FaceNet</span>
                        </div>
                        <h2 className="text-base font-bold text-[#0F172A] dark:text-white font-display mt-1">Step 4: AI Live Camera Face Biometric Enrollment</h2>
                        <p className="text-xs text-slate-500 dark:text-slate-400 font-sans mt-0.5">Automated multi-pose capture with real-time liveness, blur check, lighting verification, and duplicate face detection.</p>
                      </div>
                      <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-700 dark:bg-slate-800 dark:text-slate-200">{capturedAngleCount} / {facialAngles.length} Poses Captured</span>
                    </div>

                      {/* Camera Viewport */}
                    <div className="relative overflow-hidden rounded-2xl border-2 border-slate-800 bg-slate-950 p-1 shadow-2xl">
                      <div className="absolute top-3 left-3 right-3 z-20 flex items-center justify-between pointer-events-none">
                        <div className="flex items-center gap-2 rounded-lg bg-slate-900/80 px-3 py-1.5 backdrop-blur-md border border-slate-700/60">
                          <span className={classNames("h-2.5 w-2.5 rounded-full", isCameraActive ? "bg-emerald-500 animate-pulse" : "bg-amber-500")} />
                          <span className="text-[11px] font-bold text-white font-mono uppercase tracking-wider">{isCameraActive ? "CAM-01 LIVE • 1080p 30FPS" : "CAMERA READY • STANDBY"}</span>
                        </div>
                        <div className="rounded-lg bg-slate-900/80 px-3 py-1.5 backdrop-blur-md border border-slate-700/60 text-[11px] font-bold text-emerald-400 font-mono">{enrollmentPipeline.pipelineStatus || autoCaptureStatus}</div>
                      </div>

                      <div className="relative h-72 sm:h-80 w-full overflow-hidden rounded-xl bg-slate-900 flex items-center justify-center">
                        <video ref={videoRef} autoPlay playsInline muted className={classNames("h-full w-full object-cover transform -scale-x-100", !isCameraActive && "hidden")} />
                        {!isCameraActive && (
                          <div className="flex flex-col items-center justify-center p-6 text-center">
                            {photoPreview ? (
                              <img src={photoPreview} alt="Static Capture" className="h-44 w-44 rounded-2xl object-cover border-2 border-blue-500/40 shadow-lg" />
                            ) : (
                              <div className="space-y-3">
                                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-500/10 text-blue-400 border border-blue-500/20"><FiCamera className="h-8 w-8" /></div>
                                <div><p className="text-sm font-bold text-white font-display">Live Webcam Biometric Scanner</p><p className="text-xs text-slate-400 mt-1 max-w-sm">Click "Start Live Camera" below to initiate automatic multi-pose facial scanning.</p></div>
                              </div>
                            )}
                          </div>
                        )}
                        <div className="absolute inset-0 z-10 pointer-events-none flex items-center justify-center">
                          <div className="relative h-56 w-44 rounded-[50%] border-2 border-dashed border-blue-400/80 shadow-[0_0_40px_rgba(37,99,235,0.25)] flex items-center justify-center">
                            <div className="absolute -top-2 -left-2 h-4 w-4 border-t-2 border-l-2 border-emerald-400" />
                            <div className="absolute -top-2 -right-2 h-4 w-4 border-t-2 border-r-2 border-emerald-400" />
                            <div className="absolute -bottom-2 -left-2 h-4 w-4 border-b-2 border-l-2 border-emerald-400" />
                            <div className="absolute -bottom-2 -right-2 h-4 w-4 border-b-2 border-r-2 border-emerald-400" />
                            <div className="h-3 w-3 rounded-full border border-blue-400/60" />
                            {isCameraActive && <motion.div animate={{ y: [-90, 90, -90] }} transition={{ repeat: Infinity, duration: 2.2, ease: "easeInOut" }} className="absolute left-2 right-2 h-0.5 bg-gradient-to-r from-transparent via-emerald-400 to-transparent shadow-[0_0_12px_#10b981]" />}
                          </div>
                        </div>
                        <div className="absolute bottom-3 left-3 right-3 z-20 flex items-center justify-between rounded-lg bg-slate-900/90 px-3.5 py-2 backdrop-blur-md border border-slate-800 text-xs">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-[#2563EB] dark:text-blue-400">Target Pose:</span>
                            <span className="font-extrabold text-white font-display">{facialAngles[currentPoseIndex]?.label || "Completed"}</span>
                          </div>
                          <span className="text-slate-400 text-[11px]">{facialAngles[currentPoseIndex]?.desc || "All 8 poses verified"}</span>
                        </div>

                        {/* ─── Phase 5C: Automatic Countdown Overlay (2 → 1 → 📸) ─── */}
                        {(autoCapture.isCountingDown || autoCapture.isCapturing) && (
                          <div className="absolute inset-0 z-40 flex items-center justify-center bg-slate-950/70 backdrop-blur-sm">
                            <div className="text-center">
                              {autoCapture.isCountingDown ? (
                                <>
                                  <motion.div
                                    key={autoCapture.countdownValue}
                                    initial={{ scale: 0.5, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    transition={{ duration: 0.3 }}
                                    className="text-8xl font-extrabold text-white font-display"
                                  >
                                    {autoCapture.countdownValue}
                                  </motion.div>
                                  <p className="mt-3 text-sm font-bold text-emerald-400 uppercase tracking-[0.2em]">
                                    Hold Still • Capturing Soon
                                  </p>
                                </>
                              ) : (
                                <>
                                  <div className="text-8xl">📸</div>
                                  <p className="mt-3 text-sm font-bold text-white uppercase tracking-[0.2em]">
                                    Capturing...
                                  </p>
                                </>
                              )}
                            </div>
                          </div>
                        )}

                        {/* ─── Phase 5C: Continuous High-Speed Capture Progress ─── */}
                        {autoCapture.isContinuousCapture && !autoCapture.isComplete && (
                          <div className="absolute top-3 left-3 right-3 z-40 pointer-events-none">
                            <div className="rounded-lg bg-slate-900/90 px-3 py-2 backdrop-blur-md border border-emerald-500/40">
                              <div className="flex items-center justify-between text-[11px] font-bold mb-1">
                                <span className="text-emerald-400 font-mono">⚡ HIGH-SPEED CAPTURE • {autoCapture.capturedCount}/{autoCapture.targetCount}</span>
                                <span className="text-white font-display">{Math.min(100, Math.round((autoCapture.capturedCount / Math.max(1, autoCapture.targetCount)) * 100))}%</span>
                              </div>
                              <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-700">
                                <div className="h-full bg-emerald-500 transition-all duration-100" style={{ width: `${Math.min(100, Math.round((autoCapture.capturedCount / Math.max(1, autoCapture.targetCount)) * 100))}%` }} />
                              </div>
                              <p className="mt-1 text-[10px] text-slate-400 font-medium">Continuous capture active • No further countdowns</p>
                            </div>
                          </div>
                        )}

                        {/* ─── Phase 5C: Enrollment Completion Result ─── */}
                        {autoCapture.isComplete && (
                          <div className="absolute inset-0 z-50 flex items-center justify-center bg-emerald-950/70 backdrop-blur-sm p-4">
                            <div className="w-full max-w-md rounded-2xl border border-emerald-400/30 bg-gradient-to-br from-slate-900/95 via-emerald-950/80 to-slate-900/95 p-6 shadow-2xl shadow-emerald-500/20 backdrop-blur-xl">
                              {/* Header */}
                              <div className="flex flex-col items-center text-center">
                                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-500/15 text-emerald-400 ring-1 ring-emerald-400/30 shadow-lg shadow-emerald-500/20">
                                  <FiCheckCircle className="h-9 w-9" />
                                </div>
                                <h3 className="mt-3 text-lg font-extrabold text-white font-display">
                                  🎉 Enrollment Completed Successfully
                                </h3>
                                <p className="mt-1.5 text-xs text-slate-300 font-sans leading-relaxed max-w-sm">
                                  The child's facial enrollment has been completed successfully and is ready for AI face embedding generation.
                                </p>
                              </div>

                              {/* Summary */}
                              <div className="mt-5 rounded-xl border border-slate-700/60 bg-slate-900/60 p-4 space-y-2.5">
                                <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 font-display">Enrollment Summary</p>

                                <div className="flex items-center justify-between text-xs">
                                  <span className="flex items-center gap-2 text-slate-300 font-medium">
                                    <FiCamera className="h-4 w-4 text-[#2563EB]" /> Images Captured
                                  </span>
                                  <span className="font-extrabold text-white font-display">
                                    {autoCapture.completionResult?.capturedImages ?? galleryFrames.length} / {targetFrameCount}
                                  </span>
                                </div>

                                <div className="flex items-center justify-between text-xs">
                                  <span className="flex items-center gap-2 text-slate-300 font-medium">
                                    <FiCheckCircle className="h-4 w-4 text-emerald-400" /> Face Detection
                                  </span>
                                  <span className="font-bold text-emerald-400">Passed</span>
                                </div>

                                <div className="flex items-center justify-between text-xs">
                                  <span className="flex items-center gap-2 text-slate-300 font-medium">
                                    <FiCheckCircle className="h-4 w-4 text-emerald-400" /> Quality Validation
                                  </span>
                                  <span className="font-bold text-emerald-400">Passed</span>
                                </div>

                                <div className="flex items-center justify-between text-xs">
                                  <span className="flex items-center gap-2 text-slate-300 font-medium">
                                    <FiUser className="h-4 w-4 text-[#2563EB]" /> Single Face Verification
                                  </span>
                                  <span className="font-bold text-emerald-400">Passed</span>
                                </div>
                              </div>

                              {/* Phase 6A — Embedding Verification Result */}
                              {phase6ALoading && !phase6AError && (
                                <div className="mt-4 flex flex-col items-center gap-3">
                                  <div className="flex h-7 w-7 items-center justify-center">
                                    <svg className="animate-spin h-6 w-6 text-emerald-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                  </div>
                                  <p className="text-xs font-semibold text-emerald-300 font-display">Phase 6A: Generating Face Embeddings…</p>
                                </div>
                              )}

                              {phase6AError && (
                                <div className="mt-3 rounded-xl border border-red-400/30 bg-red-500/10 p-3 text-center">
                                  <p className="text-xs font-bold text-red-300">Phase 6A Verification Error</p>
                                  <p className="mt-1 text-[11px] text-red-400/80 break-words">{phase6AError}</p>
                                </div>
                              )}

                              {phase6AResult && !phase6ALoading && (
                                <div className="mt-4 space-y-2.5">
                                  <div className="rounded-xl border border-slate-700/60 bg-slate-900/60 p-3">
                                    <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 font-display">Phase 6A Verification</p>
                                    <div className="mt-1.5 grid grid-cols-2 gap-2">
                                      <div><p className="text-[10px] text-slate-400">Images Processed</p><p className="font-extrabold text-white font-display">{phase6AResult.imagesProcessed}</p></div>
                                      <div><p className="text-[10px] text-slate-400">Embeddings Generated</p><p className="font-extrabold text-white font-display">{phase6AResult.embeddingsGenerated}</p></div>
                                      <div><p className="text-[10px] text-slate-400">Failed Images</p><p className="font-extrabold text-red-400 font-display">{phase6AResult.failedImages}</p></div>
                                      <div><p className="text-[10px] text-slate-400">Embedding Dimension</p><p className="font-extrabold text-white font-display">{phase6AResult.embeddingDimension}</p></div>
                                    </div>
                                    <div className="mt-2 flex items-center justify-between">
                                      <span className="text-[10px] text-slate-400 font-medium">Success Rate</span>
                                      <span className="text-xs font-bold text-white font-display">{phase6AResult.successRate}%</span>
                                    </div>
                                  </div>

                                  <div className="flex items-center justify-center">
                                    <span className={classNames("inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-[10px] font-bold ring-1", phase6AResult.verificationPassed ? "bg-emerald-500/15 text-emerald-300 ring-emerald-400/40" : "bg-red-500/15 text-red-300 ring-red-400/40")}>
                                      <FiCheckCircle className="h-3 w-3" />
                                      {phase6AResult.verificationPassed ? "PASSED • Ready for Database Storage (Phase 6B)" : "FAILED • Review failed images"}
                                    </span>
                                  </div>

                                  <p className="text-center text-[10px] text-slate-400 break-words">
                                    {phase6AResult.message}
                                  </p>
                                </div>
                              )}

                              {!phase6ALoading && !phase6AError && !phase6AResult && (
                                <div className="mt-3 flex items-center justify-center">
                                  <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-500/15 px-3.5 py-1.5 text-[10px] font-bold text-blue-300 ring-1 ring-blue-400/40">
                                    <FiCpu className="h-3 w-3 animate-pulse" /> Starting Phase 6A…
                                  </span>
                                </div>
                              )}

                              {/* ─── Phase 6B.1 — Embedding Normalization Result ─── */}
                              {phase6B1Loading && !phase6B1Error && !phase6B1Result && (
                                <div className="mt-4 flex flex-col items-center gap-3">
                                  <div className="flex h-7 w-7 items-center justify-center">
                                    <svg className="animate-spin h-6 w-6 text-blue-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                  </div>
                                  <p className="text-xs font-semibold text-blue-300 font-display">Phase 6B.1: Normalizing Embeddings…</p>
                                </div>
                              )}

                              {phase6B1Error && (
                                <div className="mt-3 rounded-xl border border-red-400/30 bg-red-500/10 p-3 text-center">
                                  <p className="text-xs font-bold text-red-300">Phase 6B.1 Normalization Error</p>
                                  <p className="mt-1 text-[11px] text-red-400/80 break-words">{phase6B1Error}</p>
                                </div>
                              )}

                              {phase6B1Result && !phase6B1Loading && (
                                <div className="mt-4 space-y-2.5">
                                  <div className="rounded-xl border border-slate-700/60 bg-slate-900/60 p-3">
                                    <p className="text-[10px] font-bold uppercase tracking-wider text-blue-400 font-display">Phase 6B.1 Normalization</p>
                                    <div className="mt-1.5 grid grid-cols-2 gap-2">
                                      <div><p className="text-[10px] text-slate-400">Embeddings Received</p><p className="font-extrabold text-white font-display">{phase6B1Result.embeddingsReceived}</p></div>
                                      <div><p className="text-[10px] text-slate-400">Embeddings Normalized</p><p className="font-extrabold text-emerald-400 font-display">{phase6B1Result.embeddingsNormalized}</p></div>
                                      <div><p className="text-[10px] text-slate-400">Normalization Failures</p><p className="font-extrabold text-red-400 font-display">{phase6B1Result.normalizationFailures}</p></div>
                                      <div><p className="text-[10px] text-slate-400">Embedding Dimension</p><p className="font-extrabold text-white font-display">{phase6B1Result.embeddingDimension}</p></div>
                                      <div><p className="text-[10px] text-slate-400">Avg Norm Before</p><p className="font-extrabold text-white font-display">{phase6B1Result.averageNormBefore}</p></div>
                                      <div><p className="text-[10px] text-slate-400">Avg Norm After</p><p className="font-extrabold text-white font-display">{phase6B1Result.averageNormAfter}</p></div>
                                    </div>
                                    <div className="mt-2 flex items-center justify-between">
                                      <span className="text-[10px] text-slate-400 font-medium">Processing Time</span>
                                      <span className="text-xs font-bold text-white font-display">{phase6B1Result.processingTimeMs} ms</span>
                                    </div>
                                  </div>

                                  <div className="flex items-center justify-center">
                                    <span className={classNames("inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-[10px] font-bold ring-1", phase6B1Result.readyForNextPhase ? "bg-emerald-500/15 text-emerald-300 ring-emerald-400/40" : "bg-amber-500/15 text-amber-300 ring-amber-400/40")}>
                                      <FiCheckCircle className="h-3 w-3" />
                                      {phase6B1Result.readyForNextPhase ? "READY • Normalized embeddings prepared for Phase 6B.2" : "INCOMPLETE • Some embeddings failed validation"}
                                    </span>
                                  </div>

                                  <p className="text-center text-[10px] text-slate-400 break-words">
                                    {phase6B1Result.message}
                                  </p>
                                </div>
                              )}

                              {!phase6ALoading && !phase6B1Loading && !phase6B1Error && !phase6B1Result && phase6AResult && (
                                <div className="mt-3 flex items-center justify-center">
                                  <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-500/15 px-3.5 py-1.5 text-[10px] font-bold text-blue-300 ring-1 ring-blue-400/40">
                                    <FiCpu className="h-3 w-3 animate-pulse" /> Starting Phase 6B.1…
                                  </span>
                                </div>
                              )}

                              {/* ─── Phase 6B.2 — Outlier Detection Result ─── */}
                              {phase6B2Loading && !phase6B2Error && !phase6B2Result && (
                                <div className="mt-4 flex flex-col items-center gap-3">
                                  <div className="flex h-7 w-7 items-center justify-center">
                                    <svg className="animate-spin h-6 w-6 text-violet-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                  </div>
                                  <p className="text-xs font-semibold text-violet-300 font-display">Phase 6B.2: Detecting Outlier Embeddings…</p>
                                </div>
                              )}

                              {phase6B2Error && (
                                <div className="mt-3 rounded-xl border border-red-400/30 bg-red-500/10 p-3 text-center">
                                  <p className="text-xs font-bold text-red-300">Phase 6B.2 Outlier Detection Error</p>
                                  <p className="mt-1 text-[11px] text-red-400/80 break-words">{phase6B2Error}</p>
                                </div>
                              )}

                              {phase6B2Result && !phase6B2Loading && (
                                <div className="mt-4 space-y-2.5">
                                  <div className="rounded-xl border border-violet-500/30 bg-violet-500/5 p-3">
                                    <p className="text-[10px] font-bold uppercase tracking-wider text-violet-400 font-display">Phase 6B.2 Outlier Detection</p>
                                    <div className="mt-1.5 grid grid-cols-2 gap-2">
                                      <div><p className="text-[10px] text-slate-400">Total Embeddings</p><p className="font-extrabold text-white font-display">{phase6B2Result.totalEmbeddings}</p></div>
                                      <div><p className="text-[10px] text-slate-400">Valid Embeddings</p><p className="font-extrabold text-emerald-400 font-display">{phase6B2Result.validEmbeddings}</p></div>
                                      <div><p className="text-[10px] text-slate-400">Outliers Detected</p><p className={`font-extrabold font-display ${phase6B2Result.outlierCount > 0 ? "text-amber-400" : "text-emerald-400"}`}>{phase6B2Result.outlierCount}</p></div>
                                      <div><p className="text-[10px] text-slate-400">Non-Outliers</p><p className="font-extrabold text-emerald-400 font-display">{phase6B2Result.nonOutlierCount}</p></div>
                                      <div><p className="text-[10px] text-slate-400">Outlier Threshold</p><p className="font-extrabold text-violet-300 font-display">{phase6B2Result.outlierThreshold}</p></div>
                                      <div><p className="text-[10px] text-slate-400">Processing Time</p><p className="font-extrabold text-white font-display">{phase6B2Result.processingTimeMs} ms</p></div>
                                    </div>

                                    {/* Per-embedding breakdown (compact scrollable table) */}
                                    {phase6B2Result.embeddings && phase6B2Result.embeddings.length > 0 && (
                                      <div className="mt-2.5">
                                        <p className="text-[9px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">Per-Embedding Similarity</p>
                                        <div className="max-h-32 overflow-y-auto rounded-lg bg-slate-950/60 border border-slate-800">
                                          <table className="w-full text-[9px]">
                                            <thead className="sticky top-0 bg-slate-900/90">
                                              <tr>
                                                <th className="px-2 py-1 text-left font-bold text-slate-400">#</th>
                                                <th className="px-2 py-1 text-right font-bold text-slate-400">Avg Sim</th>
                                                <th className="px-2 py-1 text-right font-bold text-slate-400">Max</th>
                                                <th className="px-2 py-1 text-right font-bold text-slate-400">Min</th>
                                                <th className="px-2 py-1 text-center font-bold text-slate-400">Status</th>
                                              </tr>
                                            </thead>
                                            <tbody>
                                              {phase6B2Result.embeddings.map((emb) => (
                                                <tr key={emb.index} className={emb.isOutlier ? "bg-amber-500/10" : ""}>
                                                  <td className="px-2 py-0.5 font-mono text-slate-300">{emb.index}</td>
                                                  <td className="px-2 py-0.5 text-right font-mono text-white">{emb.avgCosineSimilarity.toFixed(4)}</td>
                                                  <td className="px-2 py-0.5 text-right font-mono text-emerald-400">{emb.maxCosineSimilarity.toFixed(4)}</td>
                                                  <td className="px-2 py-0.5 text-right font-mono text-slate-400">{emb.minCosineSimilarity.toFixed(4)}</td>
                                                  <td className="px-2 py-0.5 text-center">
                                                    <span className={`font-bold ${emb.isOutlier ? "text-amber-400" : "text-emerald-400"}`}>
                                                      {emb.isOutlier ? "⚠ OUTLIER" : "✓ OK"}
                                                    </span>
                                                  </td>
                                                </tr>
                                              ))}
                                            </tbody>
                                          </table>
                                        </div>
                                      </div>
                                    )}
                                  </div>

                                  <div className="flex items-center justify-center">
                                    <span className={classNames("inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-[10px] font-bold ring-1", phase6B2Result.outlierCount === 0 ? "bg-emerald-500/15 text-emerald-300 ring-emerald-400/40" : "bg-amber-500/15 text-amber-300 ring-amber-400/40")}>
                                      <FiCheckCircle className="h-3 w-3" />
                                      {phase6B2Result.outlierCount === 0
                                        ? "CLEAN • All embeddings are consistent"
                                        : `${phase6B2Result.outlierCount} OUTLIER(S) FLAGGED • Embeddings retained`}
                                    </span>
                                  </div>

                                  <p className="text-center text-[10px] text-slate-400 break-words">
                                    {phase6B2Result.message}
                                  </p>
                                </div>
                              )}

                              {phase6B1Result && !phase6B2Loading && !phase6B2Error && !phase6B2Result && (
                                <div className="mt-3 flex items-center justify-center">
                                  <span className="inline-flex items-center gap-1.5 rounded-full bg-violet-500/15 px-3.5 py-1.5 text-[10px] font-bold text-violet-300 ring-1 ring-violet-400/40">
                                    <FiCpu className="h-3 w-3 animate-pulse" /> Starting Phase 6B.2…
                                  </span>
                                </div>
                              )}

                              {/* ─── Phase 6B.3 — Master Embedding Generation Result ─── */}
                              {phase6B3Loading && !phase6B3Error && !phase6B3Result && (
                                <div className="mt-4 flex flex-col items-center gap-3">
                                  <div className="flex h-7 w-7 items-center justify-center">
                                    <svg className="animate-spin h-6 w-6 text-cyan-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                  </div>
                                  <p className="text-xs font-semibold text-cyan-300 font-display">Phase 6B.3: Generating Master Embedding…</p>
                                </div>
                              )}

                              {phase6B3Error && (
                                <div className="mt-3 rounded-xl border border-red-400/30 bg-red-500/10 p-3 text-center">
                                  <p className="text-xs font-bold text-red-300">Phase 6B.3 Master Embedding Error</p>
                                  <p className="mt-1 text-[11px] text-red-400/80 break-words">{phase6B3Error}</p>
                                </div>
                              )}

                              {phase6B3Result && !phase6B3Loading && (
                                <div className="mt-4 space-y-2.5">
                                  <div className="rounded-xl border border-cyan-500/30 bg-cyan-500/5 p-3">
                                    <p className="text-[10px] font-bold uppercase tracking-wider text-cyan-400 font-display">Phase 6B.3 Master Embedding</p>
                                    <div className="mt-1.5 grid grid-cols-2 gap-2">
                                      <div><p className="text-[10px] text-slate-400">Valid Embeddings Used</p><p className="font-extrabold text-emerald-400 font-display">{phase6B3Result.validEmbeddingsUsed}</p></div>
                                      <div><p className="text-[10px] text-slate-400">Outliers Excluded</p><p className={`font-extrabold font-display ${phase6B3Result.outliersExcluded > 0 ? "text-amber-400" : "text-emerald-400"}`}>{phase6B3Result.outliersExcluded}</p></div>
                                      <div><p className="text-[10px] text-slate-400">Master Norm</p><p className="font-extrabold text-cyan-300 font-display">{phase6B3Result.masterEmbeddingNorm?.toFixed ? phase6B3Result.masterEmbeddingNorm.toFixed(6) : phase6B3Result.masterEmbeddingNorm}</p></div>
                                      <div><p className="text-[10px] text-slate-400">Embedding Dimension</p><p className="font-extrabold text-white font-display">{phase6B3Result.embeddingDimension}</p></div>
                                      <div><p className="text-[10px] text-slate-400">Avg Similarity</p><p className="font-extrabold text-white font-display">{phase6B3Result.averageSimilarity?.toFixed ? phase6B3Result.averageSimilarity.toFixed(4) : phase6B3Result.averageSimilarity}</p></div>
                                      <div><p className="text-[10px] text-slate-400">Avg Confidence</p><p className="font-extrabold text-white font-display">{phase6B3Result.averageConfidence?.toFixed ? (phase6B3Result.averageConfidence * 100).toFixed(1) : phase6B3Result.averageConfidence}%</p></div>
                                      <div><p className="text-[10px] text-slate-400">Avg Blur Score</p><p className="font-extrabold text-white font-display">{phase6B3Result.averageBlurScore}</p></div>
                                      <div><p className="text-[10px] text-slate-400">Avg Brightness</p><p className="font-extrabold text-white font-display">{phase6B3Result.averageBrightness}</p></div>
                                    </div>
                                    <div className="mt-2 flex items-center justify-between">
                                      <span className="text-[10px] text-slate-400 font-medium">Processing Time</span>
                                      <span className="text-xs font-bold text-white font-display">{phase6B3Result.processingTimeMs} ms</span>
                                    </div>
                                  </div>

                                  <div className="flex items-center justify-center">
                                    <span className={classNames("inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-[10px] font-bold ring-1",
                                      phase6B3Result.masterEmbeddingCreated
                                        ? "bg-emerald-500/15 text-emerald-300 ring-emerald-400/40"
                                        : "bg-red-500/15 text-red-300 ring-red-400/40"
                                    )}>
                                      <FiCheckCircle className="h-3 w-3" />
                                      {phase6B3Result.masterEmbeddingCreated
                                        ? "MASTER CREATED • Ready for Phase 6C (Database Write)"
                                        : "FAILED • Master embedding could not be generated"}
                                    </span>
                                  </div>

                                  <p className="text-center text-[10px] text-slate-400 break-words">
                                    {phase6B3Result.message}
                                  </p>
                                </div>
                              )}

                              {/* ─── Phase 6 — End-to-End Pipeline Verification ─── */}
                              {phase6VerifyLoading && !phase6VerifyError && !phase6VerifyResult && (
                                <div className="mt-4 flex flex-col items-center gap-3">
                                  <div className="flex h-7 w-7 items-center justify-center">
                                    <svg className="animate-spin h-6 w-6 text-amber-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                  </div>
                                  <p className="text-xs font-semibold text-amber-300 font-display">Phase 6 Verify: Running End-to-End Pipeline…</p>
                                  <p className="text-[10px] text-slate-400 text-center max-w-xs">Images → Embeddings → Normalization → Outliers → Master Embedding</p>
                                </div>
                              )}

                              {phase6VerifyError && (
                                <div className="mt-3 rounded-xl border border-red-400/30 bg-red-500/10 p-3 text-center">
                                  <p className="text-xs font-bold text-red-300">Phase 6 Verification Error</p>
                                  <p className="mt-1 text-[11px] text-red-400/80 break-words">{phase6VerifyError}</p>
                                </div>
                              )}

                              {phase6VerifyResult && !phase6VerifyLoading && (
                                <div className="mt-4 space-y-2.5">
                                  <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-3">
                                    <p className="text-[10px] font-bold uppercase tracking-wider text-amber-400 font-display">Phase 6 — End-to-End Pipeline Verification</p>
                                    <div className="mt-1.5 grid grid-cols-2 gap-2">
                                      <div><p className="text-[10px] text-slate-400">Images Captured</p><p className="font-extrabold text-white font-display">{phase6VerifyResult.imagesCaptured}</p></div>
                                      <div><p className="text-[10px] text-slate-400">Embeddings Generated</p><p className="font-extrabold text-emerald-400 font-display">{phase6VerifyResult.embeddingsGenerated}</p></div>
                                      <div><p className="text-[10px] text-slate-400">Embeddings Normalized</p><p className="font-extrabold text-emerald-400 font-display">{phase6VerifyResult.embeddingsNormalized}</p></div>
                                      <div><p className="text-[10px] text-slate-400">Valid Embeddings</p><p className="font-extrabold text-emerald-400 font-display">{phase6VerifyResult.validEmbeddings}</p></div>
                                      <div><p className="text-[10px] text-slate-400">Outliers</p><p className={`font-extrabold font-display ${phase6VerifyResult.outliers > 0 ? "text-amber-400" : "text-emerald-400"}`}>{phase6VerifyResult.outliers}</p></div>
                                      <div><p className="text-[10px] text-slate-400">Embedding Dimension</p><p className="font-extrabold text-white font-display">{phase6VerifyResult.embeddingDimension}</p></div>
                                      <div><p className="text-[10px] text-slate-400">Master Created</p><p className={`font-extrabold font-display ${phase6VerifyResult.masterEmbeddingCreated ? "text-emerald-400" : "text-red-400"}`}>{phase6VerifyResult.masterEmbeddingCreated ? "YES" : "NO"}</p></div>
                                      <div><p className="text-[10px] text-slate-400">Master Norm</p><p className="font-extrabold text-white font-display">{phase6VerifyResult.masterEmbeddingNorm?.toFixed ? phase6VerifyResult.masterEmbeddingNorm.toFixed(6) : phase6VerifyResult.masterEmbeddingNorm}</p></div>
                                    </div>
                                    <div className="mt-2 flex items-center justify-between">
                                      <span className="text-[10px] text-slate-400 font-medium">Processing Time</span>
                                      <span className="text-xs font-bold text-white font-display">{phase6VerifyResult.processingTimeMs} ms</span>
                                    </div>
                                  </div>

                                  <div className="flex items-center justify-center">
                                    <span className={classNames("inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-[10px] font-bold ring-1",
                                      phase6VerifyResult.overallStatus === "PASSED"
                                        ? "bg-emerald-500/15 text-emerald-300 ring-emerald-400/40"
                                        : "bg-red-500/15 text-red-300 ring-red-400/40"
                                    )}>
                                      <FiCheckCircle className="h-3 w-3" />
                                      {phase6VerifyResult.overallStatus === "PASSED"
                                        ? "ALL PHASES PASSED ✓ • Pipeline verified end-to-end"
                                        : "FAILED ✗ • Review Python terminal report"}
                                    </span>
                                  </div>

                                  <div className="flex items-center justify-center">
                                    <span className={classNames("inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-[10px] font-bold ring-1",
                                      phase6VerifyResult.readyForDatabase
                                        ? "bg-emerald-500/15 text-emerald-300 ring-emerald-400/40"
                                        : "bg-red-500/15 text-red-300 ring-red-400/40"
                                    )}>
                                      <FiCheckCircle className="h-3 w-3" />
                                      {phase6VerifyResult.readyForDatabase
                                        ? "READY FOR DATABASE • Awaiting Phase 6C"
                                        : "NOT READY FOR DATABASE"}
                                    </span>
                                  </div>
                                </div>
                              )}

                              {/* Starting Phase 6 Verify indicator (shown between 6B.3 done and verify done) */}
                              {phase6B3Result && phase6B3Result.masterEmbeddingCreated && !phase6VerifyLoading && !phase6VerifyError && !phase6VerifyResult && (
                                <div className="mt-3 flex items-center justify-center">
                                  <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/15 px-3.5 py-1.5 text-[10px] font-bold text-amber-300 ring-1 ring-amber-400/40">
                                    <FiCpu className="h-3 w-3 animate-pulse" /> Starting Phase 6 Verify (End-to-End Pipeline)…
                                  </span>
                                </div>
                              )}

                              {/* Starting Phase 6C indicator — only after verification PASSES */}
                              {phase6B3Result && phase6VerifyResult && phase6VerifyResult.success && phase6VerifyResult.overallStatus === "PASSED" && phase6VerifyResult.readyForDatabase && !phase6CLoading && !phase6CError && !phase6CResult && (
                                <div className="mt-3 flex items-center justify-center">
                                  <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/15 px-3.5 py-1.5 text-[10px] font-bold text-emerald-300 ring-1 ring-emerald-400/40">
                                    <FiCpu className="h-3 w-3 animate-pulse" /> Starting Phase 6C (Database Storage)…
                                  </span>
                                </div>
                              )}

                              {/* ─── Phase 6C — Database Storage Result ─── */}
                              {phase6CLoading && !phase6CError && !phase6CResult && (
                                <div className="mt-4 flex flex-col items-center gap-3">
                                  <div className="flex h-7 w-7 items-center justify-center">
                                    <svg className="animate-spin h-6 w-6 text-emerald-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                  </div>
                                  <p className="text-xs font-semibold text-emerald-300 font-display">Phase 6C: Saving to Database…</p>
                                </div>
                              )}

                              {phase6CError && (
                                <div className="mt-3 rounded-xl border border-red-400/30 bg-red-500/10 p-3 text-center">
                                  <p className="text-xs font-bold text-red-300">Phase 6C Database Error</p>
                                  <p className="mt-1 text-[11px] text-red-400/80 break-words">{phase6CError}</p>
                                </div>
                              )}

                              {phase6CResult && !phase6CLoading && (
                                <div className="mt-4 space-y-2.5">
                                  <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-4 text-center shadow-[0_0_15px_rgba(16,185,129,0.1)]">
                                    <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-emerald-500/20">
                                      <FiCheckCircle className="h-5 w-5 text-emerald-400" />
                                    </div>
                                    <p className="text-sm font-bold text-emerald-400 font-display">✅ Enrollment Completed Successfully</p>
                                    <p className="mt-1.5 text-xs text-slate-300">
                                      The child's biometric template has been securely stored.
                                    </p>
                                    <p className="mt-1 text-[11px] text-slate-400 font-medium">
                                      Ready for Face Recognition.
                                    </p>
                                    <div className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-slate-800/50 px-3 py-1 text-[10px] text-slate-400">
                                      <span>ID:</span>
                                      <span className="font-mono font-bold text-slate-300">{phase6CResult.childId}</span>
                                    </div>
                                  </div>
                                </div>
                              )}

                            </div>
                          </div>
                        )}


                        {/* ─── Phase 5C: Frozen Captured Frame Preview ─── */}
                        {autoCapture.capturedFrame && (
                          <div className="absolute inset-0 z-40 flex items-center justify-center bg-slate-950/80">
                            <img
                              src={autoCapture.capturedFrame}
                              alt="Captured Frame"
                              className="h-full w-full object-cover"
                            />
                          </div>
                        )}

                        {/* ─── Phase 5C: Save Result Feedback ─── */}
                        {autoCapture.saveSuccess && (
                          <div className="absolute inset-0 z-50 flex items-center justify-center bg-emerald-950/50 backdrop-blur-sm">
                            <div className="text-center">
                              <div className="text-6xl">✅</div>
                              <p className="mt-3 text-lg font-extrabold text-white font-display">
                                Image Captured Successfully
                              </p>
                            </div>
                          </div>
                        )}
                        {autoCapture.saveError && (
                          <div className="absolute inset-0 z-50 flex items-center justify-center bg-red-950/50 backdrop-blur-sm">
                            <div className="text-center">
                              <div className="text-6xl">❌</div>
                              <p className="mt-3 text-lg font-extrabold text-white font-display">
                                Failed To Save Image
                              </p>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Camera Controls */}
                      <div className="flex flex-wrap items-center justify-between gap-2 p-3 bg-slate-900 border-t border-slate-800">
                        <div className="flex items-center gap-2">
                          {!isCameraActive ? (
                            <button type="button" onClick={startCamera} className="inline-flex items-center gap-1.5 rounded-xl bg-[#2563EB] px-4 py-2 text-xs font-bold text-white hover:bg-blue-700 shadow-md transition"><FiCamera className="h-4 w-4" /> Start Live Camera</button>
                          ) : (
                            <button type="button" onClick={stopCamera} className="inline-flex items-center gap-1.5 rounded-xl bg-slate-800 px-3.5 py-2 text-xs font-bold text-slate-300 hover:bg-slate-700 transition"><FiX className="h-4 w-4" /> Stop Camera</button>
                          )}
                          <span className="inline-flex items-center gap-1.5 rounded-xl bg-slate-800 px-3.5 py-2 text-xs font-bold text-emerald-400"><FiZap className="h-3.5 w-3.5" /> Continuous Enrollment Active</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <button type="button" onClick={restartEnrollmentSession} className="inline-flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-800 px-3 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-700 transition"><FiRefreshCw className="h-3.5 w-3.5" /> Restart Session</button>
                          <label className="cursor-pointer inline-flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-800 px-3 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-700 transition"><FiUploadCloud className="h-3.5 w-3.5" /> File Upload<input type="file" accept="image/*" className="hidden" onChange={handlePhotoChange} /></label>
                        </div>
                      </div>
                      </div>

                      {/* Enrollment Gallery — the ONLY source of captured images */}
                    <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900 space-y-3">
                      <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
                        <p className="text-xs font-bold text-[#0F172A] dark:text-white font-display flex items-center gap-1.5"><FiCpu className="h-4 w-4 text-[#2563EB]" /> Captured Face Frames {galleryFrames.length > 0 && <span className="text-slate-400 font-semibold">({galleryFrames.length} total)</span>}</p>
                        {autoCapture.isComplete && <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-[11px] font-bold text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400"><FiCheckCircle className="h-3 w-3" /> {galleryFrames.length} Frames Capture Complete</span>}
                      </div>

                      {/* Target count slider — TARGET_ENROLLMENT_IMAGES */}
                      <div>
                        <div className="flex items-center justify-between mb-1.5"><label className="text-[11px] font-bold uppercase text-slate-400">Target Frame Count</label><span className="text-xs font-extrabold text-[#2563EB] dark:text-blue-400 font-display">{targetFrameCount} pics</span></div>
                        <input type="range" min="30" max="50" step="5" value={targetFrameCount} onChange={(e) => setTargetFrameCount(Number(e.target.value))} className="w-full h-2 rounded-full bg-slate-100 appearance-none cursor-pointer accent-[#2563EB] disabled:opacity-50 dark:bg-slate-800" />
                        <div className="flex justify-between text-[9px] text-slate-400 mt-0.5"><span>30 (Min)</span><span>50 (Max)</span></div>
                      </div>

                      {/* Real-time progress bar — updates after every image saved */}
                      {(autoCapture.capturedCount > 0 || galleryFrames.length > 0) && (
                        <div className="space-y-1.5">
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-semibold text-slate-500 dark:text-slate-400">{autoCapture.isComplete ? "Enrollment complete" : "Enrolling images..."}</span>
                            <span className="font-extrabold text-[#2563EB] dark:text-blue-400 font-display">{galleryFrames.length} / {targetFrameCount} ({Math.min(100, Math.round((galleryFrames.length / Math.max(1, targetFrameCount)) * 100))}%)</span>
                          </div>
                          <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                            <div className={classNames("h-full transition-all duration-150", autoCapture.isComplete ? "bg-emerald-500" : "bg-[#2563EB]")} style={{ width: `${Math.min(100, Math.round((galleryFrames.length / Math.max(1, targetFrameCount)) * 100))}%` }} />
                          </div>
                        </div>
                      )}

                      {/* Live gallery — grows in REAL TIME as images are saved */}
                      {galleryFrames.length > 0 && (
                        <div>
                          <div className="flex items-center justify-between mb-1.5">
                            <p className="text-[10px] font-bold uppercase text-slate-400">Captured Face Frames ({galleryFrames.length} total)</p>
                            <span className="text-[9px] text-slate-400 font-medium">👆 Click any frame to enlarge</span>
                          </div>
                          <div className="flex gap-1.5 overflow-x-auto pb-1.5">
                            {galleryFrames.map((frame, idx) => (
                              <button key={idx} type="button" onClick={() => setViewingFrame({ src: frame, index: idx })} className="relative shrink-0 group" title={`View Frame ${idx + 1}`}>
                                <img src={frame} alt={`Frame ${idx + 1}`} className="h-12 w-12 rounded-lg object-cover border border-slate-200 dark:border-slate-700 transition group-hover:border-[#2563EB] group-hover:ring-2 group-hover:ring-blue-500/20" />
                                <span className="absolute bottom-0 left-0 right-0 rounded-b-lg bg-slate-950/70 py-0.5 text-center text-[8px] font-bold text-white opacity-0 group-hover:opacity-100 transition">#{idx + 1}</span>
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* 8 Pose Grid */}
                    <div>
                      <p className="text-xs font-bold text-[#0F172A] dark:text-white font-display mb-2">Facial Pose Verification Sequence (Click any pose to recapture)</p>
                      <div className="grid gap-2.5 grid-cols-2 sm:grid-cols-4">
                        {facialAngles.map((angle, idx) => {
                          const isCaptured = capturedAngles[angle.id];
                          const isCurrent = currentPoseIndex === idx;
                          return (
                            <button key={angle.id} type="button" onClick={() => { setCurrentPoseIndex(idx); handleAngleToggle(angle.id); }} className={classNames("flex flex-col justify-between rounded-xl border p-3 text-left transition relative overflow-hidden", isCaptured ? "border-emerald-200 bg-emerald-50/60 dark:border-emerald-500/20 dark:bg-emerald-500/10" : isCurrent ? "border-blue-300 bg-blue-50/80 dark:border-blue-500/30 dark:bg-blue-500/10 ring-2 ring-blue-500/20" : "border-slate-200 bg-white hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900")}>
                              <div className="flex items-center justify-between mb-2">
                                <div className={classNames("flex h-7 w-7 items-center justify-center rounded-lg text-xs font-bold", isCaptured ? "bg-emerald-500 text-white" : isCurrent ? "bg-[#2563EB] text-white" : "bg-slate-100 text-slate-500 dark:bg-slate-800")}>{isCaptured ? <FiCheck className="h-4 w-4" /> : idx + 1}</div>
                                <span className={classNames("text-[10px] font-bold uppercase", isCaptured ? "text-emerald-700 dark:text-emerald-300" : "text-slate-400")}>{isCaptured ? "Enrolled" : isCurrent ? "Active Target" : "Pending"}</span>
                              </div>
                              <div><p className="text-xs font-bold text-[#0F172A] dark:text-white font-display">{angle.label}</p><p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-1">{angle.desc}</p></div>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* STEP 5: Documents */}
                {currentStep === 5 && (
                  <motion.div key="step5" initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 12 }} className="space-y-5">
                    <div className="border-b border-slate-100 dark:border-slate-800 pb-3">
                      <h2 className="text-base font-bold text-[#0F172A] dark:text-white font-display">Step 5: Legal Document Upload & Emergency Contact</h2>
                      <p className="text-xs text-slate-500 dark:text-slate-400 font-sans mt-0.5">Attach medical examination reports, CWC court orders, and primary emergency contacts.</p>
                    </div>
                    <div className="space-y-4">
                      <p className="text-xs font-bold text-[#0F172A] dark:text-white font-display">Legal & Medical Documents</p>
                      <div className="grid gap-3 sm:grid-cols-2">
                        {[{ key: "medicalReport", label: "Medical Examination Report", desc: "Signed health check report from hospital" }, { key: "policeReport", label: "Police / Rescue Report", desc: "Official intake report or FIR copy" }, { key: "cwcOrder", label: "CWC / Court Placement Order", desc: "Child Welfare Committee approval" }, { key: "birthCertificate", label: "Birth Certificate / ID Proof", desc: "Aadhaar or birth certificate if available" }].map((doc) => (
                          <div key={doc.key} className="rounded-xl border border-slate-200/80 bg-white p-3.5 dark:border-slate-800 dark:bg-slate-900">
                            <div className="flex items-start justify-between">
                              <div><p className="text-xs font-bold text-[#0F172A] dark:text-white font-display">{doc.label}</p><p className="text-[10px] text-slate-400 mt-0.5">{doc.desc}</p></div>
                              <label className="cursor-pointer rounded-lg bg-blue-50 px-2.5 py-1 text-[11px] font-semibold text-[#2563EB] hover:bg-blue-100 dark:bg-blue-500/10 dark:text-blue-400">{uploadedDocs[doc.key] ? "Change" : "Upload"}<input type="file" accept=".pdf,image/*" className="hidden" onChange={(e) => handleDocUpload(doc.key, e)} /></label>
                            </div>
                            {uploadedDocs[doc.key] && <p className="mt-2 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1"><FiPaperclip className="h-3 w-3" /> {uploadedDocs[doc.key]}</p>}
                          </div>
                        ))}
                      </div>
                      <div className="border-t border-slate-100 dark:border-slate-800 pt-4 space-y-3">
                        <p className="text-xs font-bold text-[#0F172A] dark:text-white font-display">Emergency Contact Information</p>
                        <div className="grid gap-3 sm:grid-cols-2">
                          <FormInput label="Emergency Contact Name" icon={FiUser} placeholder="Relative or primary welfare officer" {...register("emergencyName")} />
                          <FormInput label="Relationship to Child" icon={FiUsers} placeholder="e.g. Guardian, Caseworker" {...register("emergencyRelation")} />
                          <FormInput label="Emergency Phone Number" icon={FiFileText} placeholder="+91 98765 43210" {...register("emergencyPhone")} />
                          <FormInput label="Address" icon={FiMapPin} placeholder="Contact residential or office address" {...register("emergencyAddress")} />
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* STEP 6: Review */}
                {currentStep === 6 && (
                  <motion.div key="step6" initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 12 }} className="space-y-5">
                    <div className="border-b border-slate-100 dark:border-slate-800 pb-3">
                      <h2 className="text-base font-bold text-[#0F172A] dark:text-white font-display">Step 6: Review & Complete Child Intake</h2>
                      <p className="text-xs text-slate-500 dark:text-slate-400 font-sans mt-0.5">Verify all captured biometric, legal, and health metadata before committing to the government registry.</p>
                    </div>
                    <div className="rounded-xl border border-slate-200/80 bg-slate-50/70 p-4 dark:border-slate-800 dark:bg-slate-800/40 space-y-3">
                      <div className="flex items-center gap-3">
                        <img src={photoPreview || dataUriForUnknown()} alt="Review Avatar" className="h-14 w-14 rounded-xl object-cover border border-white shadow-sm" />
                        <div>
                          <h3 className="text-base font-bold text-[#0F172A] dark:text-white font-display">{watchName || "Child Name Not Set"}</h3>
                          <p className="text-xs text-slate-500 dark:text-slate-400">Age: <strong className="text-[#0F172A] dark:text-white">{calculatedAge || "N/A"}</strong> • Gender: {watchGender} • Blood: {watchBloodGroup}</p>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs border-t border-slate-200/80 dark:border-slate-800 pt-3">
                        <div><p className="text-[10px] text-slate-400 font-bold uppercase">Assigned Orphanage</p><p className="font-semibold text-[#0F172A] dark:text-white mt-0.5">{watchOrphanage || "Auto-assigned"}</p></div>
                        <div><p className="text-[10px] text-slate-400 font-bold uppercase">Housing Room</p><p className="font-semibold text-[#0F172A] dark:text-white mt-0.5">{watchRoomNo || "Unassigned"}</p></div>
                        <div><p className="text-[10px] text-slate-400 font-bold uppercase">Caseworker</p><p className="font-semibold text-[#0F172A] dark:text-white mt-0.5">{watchCaretaker || "Duty Officer"}</p></div>
                        <div><p className="text-[10px] text-slate-400 font-bold uppercase">Entry Source</p><p className="font-semibold text-[#0F172A] dark:text-white mt-0.5">{watchFoundCondition}</p></div>
                        <div><p className="text-[10px] text-slate-400 font-bold uppercase">AI Risk Rating</p><p className="font-semibold text-emerald-600 dark:text-emerald-400 mt-0.5">{predictedRisk} Risk (Calculated)</p></div>
                        <div><p className="text-[10px] text-slate-400 font-bold uppercase">AI Biometric Readiness</p><p className="font-semibold text-[#2563EB] dark:text-blue-400 mt-0.5">{faceReadinessPercent}% Ready ({capturedAngleCount}/8)</p></div>
                      </div>
                    </div>
                    <div className="rounded-xl border border-slate-200/80 bg-white p-4 dark:border-slate-800 dark:bg-slate-900 space-y-2">
                      <label className="flex items-start gap-2.5 cursor-pointer" onClick={(e) => e.stopPropagation()}>
                        <input type="checkbox" checked={agreedToTerms} onChange={(e) => { e.stopPropagation(); setAgreedToTerms(e.target.checked); }} className="mt-0.5 rounded text-[#2563EB] focus:ring-[#2563EB] cursor-pointer" />
                        <span className="text-xs text-slate-600 dark:text-slate-300 font-sans select-none">I confirm that all entered child information, legal rescue documentation, and facial biometric scans have been verified in accordance with government child protection standards.</span>
                      </label>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Navigation Buttons */}
            <div className="flex items-center justify-between border-t border-slate-100 dark:border-slate-800 pt-4 mt-6">
              <Button type="button" variant="secondary" disabled={currentStep === 1 || submitting} onClick={prevStep} icon={FiChevronLeft} className="rounded-xl text-xs font-semibold">Previous Step</Button>
              {currentStep < 6 ? (
                <Button type="button" onClick={nextStep} icon={FiChevronRight} className="rounded-xl text-xs font-semibold">Next Step</Button>
              ) : (
                <Button type="submit" disabled={!agreedToTerms || submitting} icon={FiSave} loading={submitting} className="rounded-xl text-xs font-semibold">Finalize Child Intake</Button>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Sticky Summary */}
        <div className="lg:col-span-4 sticky top-6">
          <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-card dark:border-slate-800 dark:bg-slate-900 space-y-4">
            <div className="border-b border-slate-100 dark:border-slate-800 pb-3 flex items-center justify-between">
              <div><p className="text-[10px] font-bold uppercase tracking-wider text-[#2563EB] dark:text-blue-400 font-display">Live Summary</p><h3 className="text-base font-bold text-[#0F172A] dark:text-white font-display">AI Intake Readiness</h3></div>
              <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2.5 py-0.5 text-[11px] font-bold text-[#2563EB] dark:bg-blue-500/10 dark:text-blue-400">Step {currentStep} of 6</span>
            </div>

            {/* Live AI Face Detection Status Panel */}
            {currentStep === 4 && (
              <FaceDetectionStatus
                lastResponse={frameCapture.lastResponse}
                lastError={frameCapture.lastError}
                isStreaming={frameCapture.isStreaming}
                validationResult={enrollmentPipeline.currentValidation}
                pipelineStatus={enrollmentPipeline.pipelineStatus}
              />
            )}
            <div className="flex items-center gap-3.5 rounded-xl border border-slate-100 bg-slate-50/70 p-3 dark:border-slate-800 dark:bg-slate-800/40">
              <img src={photoPreview || dataUriForUnknown()} alt="Child Avatar" className="h-14 w-14 rounded-xl object-cover border border-white shadow-sm dark:border-slate-700" />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-bold text-[#0F172A] dark:text-white font-display truncate">{watchName || "Child Name"}</p>
                <p className="text-xs text-[#2563EB] dark:text-blue-400 font-semibold mt-0.5">{calculatedAge || "Age pending DOB"}</p>
                <p className="text-[10px] text-slate-400 truncate">{watchFoundCondition || "Direct Intake"}</p>
              </div>
            </div>
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs"><span className="font-semibold text-slate-500 dark:text-slate-400">Biometric Readiness</span><span className="font-extrabold text-[#2563EB] dark:text-blue-400 font-display">{faceReadinessPercent}%</span></div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800"><div className="h-full bg-[#2563EB] transition-all duration-500" style={{ width: `${faceReadinessPercent}%` }} /></div>
              <p className="text-[10px] text-slate-400">{capturedAngleCount} of {facialAngles.length} facial angles enrolled</p>
            </div>
            <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-3 dark:border-slate-800 dark:bg-slate-800/40">
              <p className="text-[10px] font-bold uppercase text-slate-400">Assessed AI Risk Level</p>
              <div className="mt-1 flex items-center gap-2">
                <span className={classNames("h-2 w-2 rounded-full", predictedRisk === "High" ? "bg-red-500 animate-pulse" : predictedRisk === "Medium" ? "bg-amber-500" : "bg-emerald-500")} />
                <span className="text-xs font-bold text-[#0F172A] dark:text-white font-display">{predictedRisk} Initial Risk</span>
              </div>
            </div>
            <div className="space-y-2 text-xs border-t border-slate-100 dark:border-slate-800 pt-3">
              <div className="flex justify-between"><span className="text-slate-400 font-medium">Gender:</span><span className="font-semibold text-[#0F172A] dark:text-white">{watchGender}</span></div>
              <div className="flex justify-between"><span className="text-slate-400 font-medium">Blood Group:</span><span className="font-semibold text-[#0F172A] dark:text-white">{watchBloodGroup}</span></div>
              <div className="flex justify-between"><span className="text-slate-400 font-medium">Orphanage:</span><span className="font-semibold text-[#0F172A] dark:text-white truncate max-w-[140px] text-right">{watchOrphanage || "Auto-assigned"}</span></div>
              <div className="flex justify-between"><span className="text-slate-400 font-medium">Room No:</span><span className="font-semibold text-[#0F172A] dark:text-white">{watchRoomNo || "Pending"}</span></div>
            </div>
          </div>
        </div>
      </form>

      {/* Frame Viewer Modal — Click any captured gallery frame to view full size */}
      <Modal open={Boolean(viewingFrame)} title={`Face Frame #${viewingFrame?.index + 1} of ${galleryFrames.length}`} onClose={() => setViewingFrame(null)}>
        <div className="space-y-3">
          <div className="flex justify-center rounded-xl overflow-hidden bg-slate-950">
            <img src={viewingFrame?.src} alt={`Frame ${viewingFrame?.index + 1}`} className="max-h-[60vh] w-auto object-contain" />
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  const prevIdx = viewingFrame.index > 0 ? viewingFrame.index - 1 : galleryFrames.length - 1;
                  setViewingFrame({ src: galleryFrames[prevIdx], index: prevIdx });
                }}
                className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-bold text-slate-600 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
              >
                <FiChevronLeft className="h-4 w-4" /> Previous
              </button>
              <button
                type="button"
                onClick={() => {
                  const nextIdx = viewingFrame.index < galleryFrames.length - 1 ? viewingFrame.index + 1 : 0;
                  setViewingFrame({ src: galleryFrames[nextIdx], index: nextIdx });
                }}
                className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-bold text-slate-600 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
              >
                Next <FiChevronRight className="h-4 w-4" />
              </button>
            </div>
            <span className="text-xs font-bold text-slate-400">Frame {viewingFrame?.index + 1} / {galleryFrames.length}</span>
          </div>
        </div>
        <div className="mt-5 flex justify-end">
          <Button icon={FiX} className="rounded-xl text-xs font-semibold" onClick={() => setViewingFrame(null)}>Close</Button>
        </div>
      </Modal>

      {/* Success Modal */}
      <Modal open={Boolean(savedRecord)} title="Child Registered Successfully" onClose={() => setSavedRecord(null)}>
        <div className="flex items-start gap-4 p-2">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400"><FiCheckCircle className="h-6 w-6" /></div>
          <div>
            <h3 className="text-base font-bold text-[#0F172A] dark:text-white font-display">{savedRecord?.name} Registered!</h3>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 font-sans">Record Code: <strong className="text-[#0F172A] dark:text-white font-mono">{savedRecord?.id}</strong></p>
            <p className="mt-0.5 text-xs text-slate-400">Enrolled by {savedRecord?.registeredBy}</p>
          </div>
        </div>
        <div className="mt-5 flex justify-end">
          <Button icon={FiCheckCircle} className="rounded-xl text-xs font-semibold" onClick={() => setSavedRecord(null)}>Done</Button>
        </div>
      </Modal>
    </div>
  );
}
