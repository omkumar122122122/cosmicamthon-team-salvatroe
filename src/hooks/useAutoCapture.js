/**
 * useAutoCapture — Phase 5C Continuous High-Speed Auto Capture & Save
 * ------------------------------------------------------------------
 * Automatically captures and saves enrollment images at high speed while
 * the backend declares the current frame ready (`captureAllowed` and
 * `readyForCapture`).
 *
 * Pipeline workflow:
 *   1. A ONE-TIME 2-second countdown runs BEFORE the first capture only.
 *   2. After the first successful save the countdown is NEVER restarted.
 *   3. Incoming backend responses keep driving the pipeline (face detection
 *      on incoming frames continues without interruption).
 *   4. While `captureAllowed === true` AND `readyForCapture === true`
 *      AND `capturedImages < TARGET_ENROLLMENT_IMAGES`, the CURRENT live
 *      video frame is automatically captured and saved.
 *   5. After each successful save a 200 ms cooldown is enforced before the
 *      next frame is captured (avoids duplicate consecutive images).
 *   6. The loop continues while the above conditions remain true.
 *   7. If `captureAllowed` becomes false the pipeline stops capturing
 *      immediately. The image count is NOT reset and the countdown is NOT
 *      restarted. When `captureAllowed` becomes true again, automatic image
 *      capture resumes with no countdown.
 *   8. The pipeline stops only when `capturedImages >= TARGET`.
 *   9. When complete the hook returns:
 *        {
 *          success: true,
 *          completed: true,
 *          capturedImages: TARGET_ENROLLMENT_IMAGES,
 *          message: "Enrollment completed successfully"
 *        }
 *
 * Guards enforced by this hook:
 *   - The frame captured is the CURRENT live video frame — never a
 *     buffered or older frame.
 *   - Only ONE save operation may run at a time.
 *   - While saving, additional frames are ignored (no duplicate saves).
 *   - The image counter is NEVER reset by a `captureAllowed` toggle.
 *
 * NOTE: This hook ONLY handles the Phase 5C enrollment capture pipeline.
 * It does NOT modify face detection, validation logic, or backend APIs.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { saveEnrollmentImage } from "../services/faceDetectionService";

const LOG_TAG = "[AutoCapture]";

const COUNTDOWN_SECONDS = 2; // 2 → 1 → 📸 (ONE-TIME, before the first capture)
const CAPTURE_COOLDOWN_MS = 200; // min gap between saves (requirement #5)
const FAILURE_RETRY_MS = 300; // retry delay after a failed save
const MIN_FIRST_FEEDBACK_MS = 350; // brief freeze for the first captured frame
const MIN_CONTINUOUS_FEEDBACK_MS = 40; // tiny pacing for continuous captures
const FIRST_SUCCESS_FEEDBACK_MS = 700; // ✅ hold before entering continuous mode
const FIRST_FAILURE_FEEDBACK_MS = 500; // ❌ hold before retrying (no countdown)
const JPEG_QUALITY = 0.95;
const DEFAULT_CAMERA_ID = "CAM-01-MAIN";
const DEFAULT_TARGET_IMAGES = 40; // TARGET_ENROLLMENT_IMAGES

export default function useAutoCapture({
  videoRef,
  lastResponse = null,
  enabled = false,
  cameraId = DEFAULT_CAMERA_ID,
  targetCount = DEFAULT_TARGET_IMAGES,
  onImageSaved = null,
  onComplete = null,
  sessionId = null,
} = {}) {
  // ---- Public UI state (Phase 5C states) ----
  const [isCountingDown, setIsCountingDown] = useState(false);
  const [countdownValue, setCountdownValue] = useState(0);
  const [isCapturing, setIsCapturing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isContinuousCapture, setIsContinuousCapture] = useState(false);
  const [capturedCount, setCapturedCount] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  const [completionResult, setCompletionResult] = useState(null);
  const [captureCompleted, setCaptureCompleted] = useState(false);
  const [capturedFrame, setCapturedFrame] = useState(null);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState(false);

  // ---- Refs (mutable, do not trigger re-render) ----
  const countdownTimerRef = useRef(null);
  const retryTimerRef = useRef(null);
  const successFadeTimerRef = useRef(null);
  const errorFadeTimerRef = useRef(null);
  const canvasRef = useRef(null);
  const capturedFrameUrlRef = useRef(null);

  // Function indirection refs (avoid stale-closure / ordering issues).
  const executeCaptureRef = useRef(null);
  const maybeCaptureNextRef = useRef(null);

  const isCountingDownRef = useRef(false);
  const isCapturingRef = useRef(false);
  const isSavingRef = useRef(false);
  const isCompleteRef = useRef(false);
  const hasCountedDownRef = useRef(false); // ONE-TIME countdown guard
  const capturedImagesRef = useRef(0); // persistent image counter
  const lastCaptureTimeRef = useRef(0); // 200ms cooldown anchor

  const enabledRef = useRef(enabled);
  const lastResponseRef = useRef(lastResponse);
  const frameIdRef = useRef(null);
  const cameraIdRef = useRef(cameraId);
  const targetCountRef = useRef(targetCount);
  const sessionIdRef = useRef(sessionId);
  const onImageSavedRef = useRef(onImageSaved);
  const onCompleteRef = useRef(onComplete);

  // Keep refs in sync with the latest props.
  useEffect(() => {
    enabledRef.current = enabled;
  }, [enabled]);

  useEffect(() => {
    onImageSavedRef.current = onImageSaved;
  }, [onImageSaved]);

  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  useEffect(() => {
    sessionIdRef.current = sessionId;
  }, [sessionId]);

  useEffect(() => {
    lastResponseRef.current = lastResponse;
    if (lastResponse?.frameId !== undefined) {
      frameIdRef.current = lastResponse.frameId;
    }
  }, [lastResponse]);

  useEffect(() => {
    cameraIdRef.current = cameraId;
  }, [cameraId]);

  useEffect(() => {
    targetCountRef.current = targetCount;
  }, [targetCount]);

  // ---- Utility helpers ----

  const clearTimer = (timerRef) => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  };

  const clearIntervalTimer = (timerRef) => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  const clearAllTimers = useCallback(() => {
    clearIntervalTimer(countdownTimerRef);
    clearTimer(retryTimerRef);
    clearTimer(successFadeTimerRef);
    clearTimer(errorFadeTimerRef);
  }, []);

  const revokeCapturedFrame = useCallback(() => {
    if (capturedFrameUrlRef.current) {
      URL.revokeObjectURL(capturedFrameUrlRef.current);
      capturedFrameUrlRef.current = null;
    }
    setCapturedFrame(null);
  }, []);

  /**
   * Cancel any running countdown immediately.
   * Called when the backend declares `captureAllowed = false`.
   * The countdown is NOT restarted automatically after cancellation —
   * it is restarted only on the next false→true edge if the first
   * capture has not yet occurred.
   */
  const cancelCountdown = useCallback(() => {
    if (!isCountingDownRef.current && !countdownTimerRef.current) return;
    clearIntervalTimer(countdownTimerRef);
    isCountingDownRef.current = false;
    setIsCountingDown(false);
    setCountdownValue(0);
    console.log(`${LOG_TAG} Countdown Cancelled`);
  }, []);

  /**
   * Capture the CURRENT camera frame as a JPEG Blob.
   * Draws directly from the live <video> element at call time —
   * never from a buffered frame.
   */
  const captureCurrentFrame = useCallback(() => {
    const video = videoRef?.current;
    if (!video || !video.videoWidth || !video.videoHeight) {
      console.log(`${LOG_TAG} Video not ready for capture.`);
      return null;
    }

    if (!canvasRef.current) {
      canvasRef.current = document.createElement("canvas");
    }
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const ctx = canvas.getContext("2d");
    if (!ctx) return null;

    // Draw the CURRENT visible frame exactly as shown.
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    return new Promise((resolve) => {
      canvas.toBlob((blob) => resolve(blob), "image/jpeg", JPEG_QUALITY);
    });
  }, [videoRef]);

  /**
   * Send ONLY the captured frame to POST /enrollment/save-image.
   * Multipart fields: image, cameraId, frameId, timestamp.
   */
  const sendImage = useCallback(async (imageBlob) => {
    isSavingRef.current = true;
    setIsSaving(true);
    console.log(`${LOG_TAG} Sending Image`);

    try {
      await saveEnrollmentImage(imageBlob, {
        cameraId: cameraIdRef.current,
        frameId: frameIdRef.current,
        sessionId: sessionIdRef.current,
        timestamp: new Date().toISOString(),
      });
      console.log(`${LOG_TAG} Image Saved Successfully`);
      isSavingRef.current = false;
      setIsSaving(false);
      return true;
    } catch (err) {
      console.error(`${LOG_TAG} Save Failed`);
      console.error(err?.message || err);
      isSavingRef.current = false;
      setIsSaving(false);
      return false;
    }
  }, []);

  /**
   * Complete the enrollment and return the required result object.
   * Stopping happens ONLY when `capturedImages >= TARGET`.
   */
  const completeEnrollment = useCallback(() => {
    if (isCompleteRef.current) return;
    isCompleteRef.current = true;
    clearAllTimers();
    setIsCountingDown(false);
    setCountdownValue(0);
    setIsCapturing(false);
    setIsSaving(false);
    setIsContinuousCapture(false);
    setIsComplete(true);
    setCaptureCompleted(true);
    revokeCapturedFrame();
    setSaveSuccess(false);
    setSaveError(false);

    const result = {
      success: true,
      completed: true,
      capturedImages: targetCountRef.current,
      message: "Enrollment completed successfully",
    };
    setCompletionResult(result);
    console.log(`${LOG_TAG} 🎉 Enrollment Completed:`, result);

    // Notify the parent so it can STOP the frame-capture pipeline (no more
    // /detect-face requests) and then trigger Phase 6A.
    if (typeof onCompleteRef.current === "function") {
      try {
        onCompleteRef.current(result);
      } catch (err) {
        console.error(`${LOG_TAG} onComplete callback error:`, err);
      }
    }
  }, [clearAllTimers, revokeCapturedFrame]);

  /**
   * Execute an actual capture + save of the CURRENT live frame.
   *
   * @param {boolean} isFirstCapture - true for the capture that follows the
   *   one-time countdown (shows the 📸 / ✅ / ❌ feedback). false for every
   *   high-speed continuous capture that follows (live view stays visible).
   */
  const executeCapture = useCallback(
    async (isFirstCapture = false) => {
      if (isCompleteRef.current) return;
      if (isCapturingRef.current || isSavingRef.current) return;

      isCapturingRef.current = true;
      if (isFirstCapture) {
        setIsCountingDown(false);
        setIsCapturing(true);
      } else {
        // Continuous high-speed mode: keep the live camera unobstructed.
        setIsContinuousCapture(true);
      }

      const captureStartTime = Date.now();

      // Capture the CURRENT live frame (never buffered).
      const blob = await captureCurrentFrame();

      isCapturingRef.current = false;
      if (isFirstCapture) setIsCapturing(false);

      if (!blob) {
        console.error(`${LOG_TAG} Frame Captured — FAILED (video unavailable)`);
        if (!isFirstCapture) setIsContinuousCapture(true);
        retryTimerRef.current = setTimeout(() => {
          maybeCaptureNextRef.current?.();
        }, FAILURE_RETRY_MS);
        return;
      }

      if (isFirstCapture) {
        // Freeze preview only for the first (countdown) capture.
        revokeCapturedFrame();
        const objectUrl = URL.createObjectURL(blob);
        capturedFrameUrlRef.current = objectUrl;
        setCapturedFrame(objectUrl);
      }

      // Send the image to the backend (single save at a time).
      const success = await sendImage(blob);

      // Ensure a brief feedback window so the first capture is visible.
      const elapsed = Date.now() - captureStartTime;
      const minFeedbackMs = isFirstCapture ? MIN_FIRST_FEEDBACK_MS : MIN_CONTINUOUS_FEEDBACK_MS;
      const remainingMs = minFeedbackMs - elapsed;
      if (remainingMs > 0) {
        await new Promise((resolve) => setTimeout(resolve, remainingMs));
      }

      if (success) {
        // Requirement #7: NEVER reset this counter on `captureAllowed` toggles.
        capturedImagesRef.current += 1;
        const newCount = capturedImagesRef.current;
        setCapturedCount(newCount);
        console.log(`${LOG_TAG} ✅ Image #${newCount} / ${targetCountRef.current} Saved Successfully`);

        // Notify the parent so the gallery can grow in REAL TIME —
        // immediately after each successful save, never at the end.
        if (typeof onImageSavedRef.current === "function") {
          try {
            const reader = new FileReader();
            reader.onloadend = () => {
              onImageSavedRef.current?.(reader.result, newCount);
            };
            reader.readAsDataURL(blob);
          } catch (err) {
            console.error(`${LOG_TAG} Failed to convert saved image for gallery:`, err);
          }
        }

        // Requirement #8: stop only when the target is reached.
        if (newCount >= targetCountRef.current) {
          completeEnrollment();
          return;
        }

        // Requirement #5: 200ms cooldown after each successful save.
        lastCaptureTimeRef.current = Date.now();

        if (isFirstCapture) {
          // Show the first-capture confirmation briefly, then enter
          // high-speed continuous mode — NO further countdowns.
          setSaveSuccess(true);
          successFadeTimerRef.current = setTimeout(() => {
            setSaveSuccess(false);
            revokeCapturedFrame();
            setIsContinuousCapture(true);
            retryTimerRef.current = setTimeout(() => {
              maybeCaptureNextRef.current?.();
            }, CAPTURE_COOLDOWN_MS);
          }, FIRST_SUCCESS_FEEDBACK_MS);
        } else {
          retryTimerRef.current = setTimeout(() => {
            maybeCaptureNextRef.current?.();
          }, CAPTURE_COOLDOWN_MS);
        }
      } else {
        // On failure: do NOT increment the counter, do NOT restart the
        // countdown — retry as a continuous capture shortly.
        console.error(`${LOG_TAG} ❌ Failed To Save Image`);
        if (isFirstCapture) {
          setSaveError(true);
          errorFadeTimerRef.current = setTimeout(() => {
            setSaveError(false);
            revokeCapturedFrame();
            setIsContinuousCapture(true);
            retryTimerRef.current = setTimeout(() => {
              maybeCaptureNextRef.current?.();
            }, FAILURE_RETRY_MS);
          }, FIRST_FAILURE_FEEDBACK_MS);
        } else {
          retryTimerRef.current = setTimeout(() => {
            maybeCaptureNextRef.current?.();
          }, FAILURE_RETRY_MS);
        }
      }
    },
    [captureCurrentFrame, sendImage, completeEnrollment, revokeCapturedFrame]
  );

  /**
   * Attempt the next high-speed capture if, and only if:
   *   captureAllowed === true
   *   readyForCapture === true
   *   capturedImages < TARGET_ENROLLMENT_IMAGES
   *   the 200ms cooldown has elapsed
   *   no capture/save is currently in flight
   */
  const maybeCaptureNext = useCallback(() => {
    if (isCompleteRef.current) return;
    if (!enabledRef.current) return;
    if (isCountingDownRef.current) return;
    if (isCapturingRef.current || isSavingRef.current) return;

    const res = lastResponseRef.current;
    if (!res) return;

    const allowed = Boolean(res.captureAllowed);
    const ready = Boolean(res.readyForCapture);
    if (!allowed || !ready) return; // paused — the response effect resumes us

    if (capturedImagesRef.current >= targetCountRef.current) {
      completeEnrollment();
      return;
    }

    const now = Date.now();
    if (now - lastCaptureTimeRef.current < CAPTURE_COOLDOWN_MS) return;

    // Conditions met → capture the CURRENT live frame (continuous mode).
    executeCaptureRef.current?.(false);
  }, [completeEnrollment]);

  // Keep function-ref indirections fresh.
  executeCaptureRef.current = executeCapture;
  maybeCaptureNextRef.current = maybeCaptureNext;

  /**
   * Start the ONE-TIME 2-second countdown: 2 → 1 → first capture.
   * The guard `hasCountedDownRef` is set to true only when the countdown
   * COMPLETES, so an interrupted countdown can replay before the first
   * capture — but after the first capture, it never runs again.
   */
  const startCountdown = useCallback(() => {
    if (isCountingDownRef.current) return;
    if (isCapturingRef.current || isSavingRef.current || isCompleteRef.current) return;
    if (!enabledRef.current) return;

    console.log(`${LOG_TAG} Countdown Started (one-time)`);
    isCountingDownRef.current = true;
    setIsCountingDown(true);
    setCountdownValue(COUNTDOWN_SECONDS);

    let remaining = COUNTDOWN_SECONDS;

    countdownTimerRef.current = setInterval(() => {
      remaining -= 1;

      if (remaining <= 0) {
        clearIntervalTimer(countdownTimerRef);
        isCountingDownRef.current = false;
        setIsCountingDown(false);
        setCountdownValue(0);
        // Requirement #1 / #2: the countdown has happened — never again.
        hasCountedDownRef.current = true;
        executeCaptureRef.current?.(true);
      } else {
        setCountdownValue(remaining);
      }
    }, 1000);
  }, []);

  /**
   * Monitor `/detect-face` responses.
   *  - captureAllowed=false (+ or readyForCapture=false):
   *      stop capturing immediately, keep image count, do NOT restart
   *      countdown. Face detection on incoming frames continues in the
   *      frame-capture layer.
   *  - captureAllowed=true && readyForCapture=true:
   *      first time → one-time countdown.
   *      afterwards → automatic continuous capture while count < target.
   */
  useEffect(() => {
    if (!enabledRef.current) return;

    const res = lastResponseRef.current;
    if (!res) return;

    const allowed = Boolean(res.captureAllowed);
    const ready = Boolean(res.readyForCapture);

    if (!allowed || !ready) {
      // Requirement #7: stop capturing images immediately.
      // Clear any queued/retry capture so no stale frame is saved.
      if (retryTimerRef.current) {
        clearTimeout(retryTimerRef.current);
        retryTimerRef.current = null;
      }
      setIsContinuousCapture(false);
      // Do NOT reset capturedImagesRef.
      // Do NOT reset hasCountedDownRef (unless no capture ever happened).
      if (isCountingDownRef.current) {
        cancelCountdown();
      }
      return;
    }

    // captureAllowed === true && readyForCapture === true

    if (isCompleteRef.current) return;

    if (capturedImagesRef.current >= targetCountRef.current) {
      completeEnrollment();
      return;
    }

    // Requirement #1: countdown ONLY ONCE, before the first capture.
    if (!hasCountedDownRef.current) {
      startCountdown();
      return;
    }

    // Requirement #4 / #6: automatically capture the current frame while
    // the conditions hold. This fires for every fresh backend response
    // (each incoming camera frame), so the loop keeps advancing.
    maybeCaptureNextRef.current?.();
  }, [lastResponse, startCountdown, cancelCountdown, completeEnrollment]);

  /**
   * When the hook is disabled (camera off / step changed), pause the
   * pipeline. The image count is preserved. If nothing has been captured
   * yet, a fresh countdown is allowed on the next enable.
   */
  useEffect(() => {
    if (!enabled) {
      clearAllTimers();
      isCountingDownRef.current = false;
      setIsCountingDown(false);
      setCountdownValue(0);
      setIsCapturing(false);
      setIsContinuousCapture(false);
      if (capturedImagesRef.current === 0) {
        hasCountedDownRef.current = false;
      }
    }
  }, [enabled, clearAllTimers]);

  /**
   * Cleanup timers + object URLs on unmount.
   */
  useEffect(() => {
    return () => {
      clearAllTimers();
      revokeCapturedFrame();
    };
  }, [clearAllTimers, revokeCapturedFrame]);

  return {
    // Phase 5C internal states
    isCountingDown,
    countdownValue,
    isCapturing,
    isSaving,
    isContinuousCapture,
    capturedCount,
    targetCount,
    isComplete,
    captureCompleted,
    completionResult,
    capturedFrame,
    // Result feedback
    saveSuccess,
    saveError,
  };
}