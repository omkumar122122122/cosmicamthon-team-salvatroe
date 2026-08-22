/**
 * useAutoEnrollment — Automatic Face Enrollment Service
 * ------------------------------------------------------------------
 * Automatically captures enrollment images when quality validations pass.
 *
 * Pipeline responsibility:
 *   Quality Validation  ->  Countdown  ->  Auto Capture  ->  Save Image
 *
 * Features:
 *  - 3-2-1 countdown before capture
 *  - Auto-captures when all validations pass
 *  - Saves images to faces/child_<id>/enrollment/img_XXX.jpg
 *  - Maintains 1-second minimum interval between captures
 *  - Stops when target count is reached
 *
 * NOTE: This hook ONLY handles enrollment capture. It does NOT perform
 * face recognition, embedding generation, or attendance marking.
 */

import { useCallback, useEffect, useRef, useState } from "react";

const LOG_TAG = "[AutoEnrollment]";

const DEFAULT_CONFIG = {
  targetCount: 40,
  captureIntervalMs: 1000,
  countdownSeconds: 3,
  childId: null,
};

export default function useAutoEnrollment({
  videoRef,
  enabled = false,
  qualityValidation = null,
  childId = null,
  targetCount = 40,
} = {}) {
  const [isCountingDown, setIsCountingDown] = useState(false);
  const [countdownValue, setCountdownValue] = useState(0);
  const [capturedCount, setCapturedCount] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  const [capturedImages, setCapturedImages] = useState([]);
  const [status, setStatus] = useState("Ready to Capture");
  const [lastSavedPath, setLastSavedPath] = useState(null);
  const [saveError, setSaveError] = useState(false);

  const countdownTimerRef = useRef(null);
  const captureTimerRef = useRef(null);
  const lastCaptureTimeRef = useRef(0);
  const canvasRef = useRef(null);
  const stabilityCheckRef = useRef(null);
  const wasCaptureAllowedRef = useRef(false);

  /**
   * Capture current frame from video
   */
  const captureFrame = useCallback(() => {
    if (!videoRef?.current) return null;

    try {
      const video = videoRef.current;
      const canvas = canvasRef.current || document.createElement("canvas");
      canvasRef.current = canvas;

      canvas.width = video.videoWidth || 640;
      canvas.height = video.videoHeight || 480;

      const ctx = canvas.getContext("2d");
      if (!ctx) return null;

      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      return canvas.toDataURL("image/jpeg", 0.95);
    } catch (err) {
      console.error(`${LOG_TAG} Frame capture error:`, err);
      return null;
    }
  }, [videoRef]);

  /**
   * Save image to filesystem (simulated via download for demo)
   */
  const saveImage = useCallback((imageDataUrl, index, childIdParam) => {
    try {
      const cid = childIdParam || childId || "unknown";
      const folderPath = `faces/child_${cid}/enrollment`;
      const fileName = `img_${String(index).padStart(3, '0')}.jpg`;
      const fullPath = `${folderPath}/${fileName}`;

      // In a real implementation, this would save to the server
      // For now, we trigger a download
      const link = document.createElement("a");
      link.href = imageDataUrl;
      link.download = fileName;
      link.click();

      console.log(`${LOG_TAG} Image Saved:`);
      console.log(`${LOG_TAG} ${fullPath}`);

      setLastSavedPath(fullPath);
      return fullPath;
    } catch (err) {
      console.error(`${LOG_TAG} Save error:`, err);
      return null;
    }
  }, [childId]);

  /**
   * Check if enough time has passed since last capture
   */
  const canCapture = useCallback(() => {
    const now = Date.now();
    const timeSinceLastCapture = now - lastCaptureTimeRef.current;
    return timeSinceLastCapture >= DEFAULT_CONFIG.captureIntervalMs;
  }, []);

  /**
   * Perform a single capture
   */
  const performCapture = useCallback(() => {
    if (!canCapture()) {
      return false;
    }

    const frame = captureFrame();
    if (!frame) {
      console.log(`${LOG_TAG} ❌ Failed to capture frame`);
      return false;
    }

    const newCount = capturedCount + 1;
    const savedPath = saveImage(frame, newCount, childId);

    if (savedPath) {
      setCapturedCount(newCount);
      setCapturedImages(prev => [...prev, frame]);
      lastCaptureTimeRef.current = Date.now();
      setSaveError(false);

      console.log(`${LOG_TAG} Image Saved`);
      console.log(`${LOG_TAG} Path: ${savedPath}`);

      // Reset stability tracking after capture
      if (qualityValidation?.resetStability) {
        qualityValidation.resetStability();
      }

      return true;
    } else {
      setSaveError(true);
      console.log(`${LOG_TAG} ❌ Image Save Failed`);
      return false;
    }
  }, [captureFrame, saveImage, capturedCount, childId, targetCount, qualityValidation, canCapture]);

  /**
   * Start the countdown sequence
   */
  const startCountdown = useCallback(() => {
    if (isCountingDown || isComplete) return;

    setIsCountingDown(true);
    setCountdownValue(DEFAULT_CONFIG.countdownSeconds);
    setStatus("Hold Still");

    console.log(`${LOG_TAG} --------------------------------------`);
    console.log(`${LOG_TAG} Countdown Started`);

    let count = DEFAULT_CONFIG.countdownSeconds;

    countdownTimerRef.current = setInterval(() => {
      count -= 1;

      if (count <= 0) {
        clearInterval(countdownTimerRef.current);
        countdownTimerRef.current = null;
        setIsCountingDown(false);
        setCountdownValue(0);
        setStatus("Capturing...");

        console.log(`${LOG_TAG} --------------------------------------`);
        console.log(`${LOG_TAG} Capturing Image`);

        // Perform initial capture
        setTimeout(() => {
          performCapture();
          startCaptureLoop();
        }, 100);
      } else {
        setCountdownValue(count);
        setStatus(`${count}`);
        console.log(`${LOG_TAG} ${count}`);
      }
    }, 1000);
  }, [isCountingDown, isComplete, performCapture]);

  /**
   * Start continuous capture loop
   */
  const startCaptureLoop = useCallback(() => {
    if (captureTimerRef.current) return;

    console.log(`${LOG_TAG} Starting capture loop`);

    captureTimerRef.current = setInterval(() => {
      const validationResult = qualityValidation?.validationResult;
      const captureAllowed = validationResult?.captureAllowed || validationResult?.isValid;

      // Only capture if validation passes
      if (captureAllowed) {
        const success = performCapture();

        if (!success) {
          if (saveError) {
            setStatus("Image Save Failed - Retrying...");
          } else {
            setStatus("Capture in progress...");
          }
        } else {
          setStatus(`Captured ${capturedCount} / ${targetCount}`);
          console.log(`${LOG_TAG} Enrollment Progress`);
          console.log(`${LOG_TAG} ${capturedCount} / ${targetCount}`);
        }

        // Check if we've reached the target
        if (capturedCount >= targetCount) {
          stopCapture();
          setIsComplete(true);
          setStatus("✅ Enrollment Complete");
          console.log(`${LOG_TAG} --------------------------------------`);
          console.log(`${LOG_TAG} ✅ Enrollment Complete`);
          console.log(`${LOG_TAG} ${capturedCount} images saved`);
          console.log(`${LOG_TAG} --------------------------------------`);
        }
      } else {
        // Validation failed - stop capturing and wait for it to become true again
        stopCapture();
        setStatus("Waiting for valid frame...");
        wasCaptureAllowedRef.current = false;
      }
    }, 500); // Check every 500ms
  }, [qualityValidation, performCapture, capturedCount, targetCount, saveError]);

  /**
   * Stop capture
   */
  const stopCapture = useCallback(() => {
    if (countdownTimerRef.current) {
      clearInterval(countdownTimerRef.current);
      countdownTimerRef.current = null;
    }

    if (captureTimerRef.current) {
      clearInterval(captureTimerRef.current);
      captureTimerRef.current = null;
    }

    setIsCountingDown(false);
    setCountdownValue(0);
  }, []);

  /**
   * Reset enrollment session
   */
  const reset = useCallback(() => {
    stopCapture();
    setCapturedCount(0);
    setCapturedImages([]);
    setIsComplete(false);
    setStatus("Ready to Capture");
    setLastSavedPath(null);
    setSaveError(false);
    lastCaptureTimeRef.current = 0;
    wasCaptureAllowedRef.current = false;

    if (qualityValidation?.resetStability) {
      qualityValidation.resetStability();
    }

    console.log(`${LOG_TAG} Enrollment session reset`);
  }, [stopCapture, qualityValidation]);

  /**
   * Start enrollment process
   */
  const start = useCallback(() => {
    if (isComplete) {
      console.warn(`${LOG_TAG} Enrollment already complete. Reset first.`);
      return;
    }

    if (!enabled) {
      console.warn(`${LOG_TAG} Cannot start: enrollment not enabled`);
      return;
    }

    console.log(`${LOG_TAG} Starting auto enrollment...`);
    startCountdown();
  }, [enabled, isComplete, startCountdown]);

  /**
   * Auto-start when enabled and quality validation passes
   * Monitors captureAllowed and handles countdown cancellation
   */
  useEffect(() => {
    if (enabled && !isCountingDown && !isComplete && capturedCount === 0) {
      // Wait for quality validation to be ready
      const checkInterval = setInterval(() => {
        const validationResult = qualityValidation?.validationResult;
        const captureAllowed = validationResult?.captureAllowed || validationResult?.isValid;

        if (captureAllowed && !wasCaptureAllowedRef.current) {
          wasCaptureAllowedRef.current = true;
          console.log(`${LOG_TAG} Quality validation ready, starting enrollment...`);
          start();
        } else if (!captureAllowed) {
          wasCaptureAllowedRef.current = false;
        }
      }, 1000);

      return () => clearInterval(checkInterval);
    }
  }, [enabled, isCountingDown, isComplete, capturedCount, qualityValidation, start]);

  /**
   * Cleanup on unmount
   */
  useEffect(() => {
    return () => {
      stopCapture();
    };
  }, [stopCapture]);

  return {
    // State
    isCountingDown,
    countdownValue,
    capturedCount,
    isComplete,
    capturedImages,
    status,
    lastSavedPath,

    // Controls
    start,
    stopCapture,
    reset,

    // Helpers
    captureFrame,
    saveImage,
    performCapture,
  };
}

export { DEFAULT_CONFIG };