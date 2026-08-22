/**
 * useEnrollmentPipeline — Integrated Face Enrollment Pipeline
 * ------------------------------------------------------------------
 * Orchestrates the complete Phase 5 workflow:
 *   Frame Capture -> Quality Validation -> Auto Enrollment
 *
 * This hook wires together:
 *  - useFrameCapture (existing)
 *  - useQualityValidation (new)
 *  - useAutoEnrollment (new)
 *
 * Pipeline responsibility:
 *   Frame Capture  ->  Quality Validation  ->  Auto Enrollment
 *
 * NOTE: This hook ONLY orchestrates enrollment. It does NOT perform
 * face recognition, embedding generation, or attendance marking.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import useFrameCapture from "./useFrameCapture";
import useQualityValidation from "./useQualityValidation";
import useAutoEnrollment from "./useAutoEnrollment";

const LOG_TAG = "[EnrollmentPipeline]";

export default function useEnrollmentPipeline({
  videoRef,
  enabled = false,
  childId = null,
  targetCount = 40,
} = {}) {
  // ---- Frame Capture (existing) ----
  const frameCapture = useFrameCapture({
    videoRef,
    enabled,
    cameraId: "CAM-01-MAIN",
  });

  // ---- Quality Validation (new) ----
  const qualityValidation = useQualityValidation({
    videoRef,
    enabled,
  });

  // ---- Auto Enrollment (new) ----
  const autoEnrollment = useAutoEnrollment({
    videoRef,
    enabled,
    qualityValidation,
    childId,
    targetCount,
  });

  // ---- Pipeline State ----
  const [pipelineStatus, setPipelineStatus] = useState("Idle");
  const [currentValidation, setCurrentValidation] = useState(null);
  const [processingFrame, setProcessingFrame] = useState(false);

  const processingRef = useRef(false);

  /**
   * Process a single frame through the pipeline:
   * 1. Get detection result from frame capture
   * 2. Validate quality
   * 3. Update UI status
   */
  const processFrame = useCallback(async () => {
    if (processingRef.current) return;
    if (!frameCapture.lastResponse) return;

    processingRef.current = true;
    setProcessingFrame(true);

    try {
      const detectionResult = frameCapture.lastResponse;

      // Run quality validation
      const validationResult = await qualityValidation.validateDetection(
        detectionResult
      );

      setCurrentValidation(validationResult);
      qualityValidation.updateValidation(validationResult);

      // Update pipeline status based on validation
      if (validationResult?.status) {
        setPipelineStatus(validationResult.status);
      } else if (validationResult?.message) {
        setPipelineStatus(validationResult.message);
      }
    } catch (err) {
      console.error(`${LOG_TAG} Pipeline processing error:`, err);
      setPipelineStatus("Processing error");
    } finally {
      processingRef.current = false;
      setProcessingFrame(false);
    }
  }, [frameCapture.lastResponse, qualityValidation]);

  /**
   * Monitor frame capture responses and process them
   */
  useEffect(() => {
    if (!enabled) return;

    // Check for new responses
    if (frameCapture.lastResponse && !processingRef.current) {
      processFrame();
    }
  }, [enabled, frameCapture.lastResponse, processFrame]);

  /**
   * Update status when auto enrollment state changes
   */
  useEffect(() => {
    if (autoEnrollment.isCountingDown) {
      setPipelineStatus(`Starting in ${autoEnrollment.countdownValue}...`);
    } else if (autoEnrollment.isComplete) {
      setPipelineStatus(`✓ ${autoEnrollment.capturedCount} frames captured`);
    } else if (autoEnrollment.status && autoEnrollment.status !== "Ready to Capture") {
      setPipelineStatus(autoEnrollment.status);
    }
  }, [autoEnrollment.isCountingDown, autoEnrollment.countdownValue, autoEnrollment.isComplete, autoEnrollment.status]);

  /**
   * Start the enrollment pipeline
   */
  const startPipeline = useCallback(() => {
    console.log(`${LOG_TAG} Starting enrollment pipeline`);
    setPipelineStatus("Initializing...");
    frameCapture.start();
    autoEnrollment.start();
  }, [frameCapture, autoEnrollment]);

  /**
   * Stop the enrollment pipeline
   */
  const stopPipeline = useCallback(() => {
    console.log(`${LOG_TAG} Stopping enrollment pipeline`);
    setPipelineStatus("Stopped");
    frameCapture.stop();
    autoEnrollment.stopCapture();
    qualityValidation.resetStability();
  }, [frameCapture, autoEnrollment, qualityValidation]);

  /**
   * Reset the enrollment pipeline
   */
  const resetPipeline = useCallback(() => {
    console.log(`${LOG_TAG} Resetting enrollment pipeline`);
    setPipelineStatus("Ready");
    setCurrentValidation(null);
    frameCapture.stop();
    autoEnrollment.reset();
    qualityValidation.resetStability();
  }, [frameCapture, autoEnrollment, qualityValidation]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopPipeline();
    };
  }, [stopPipeline]);

  return {
    // Status
    pipelineStatus,
    currentValidation,
    processingFrame,

    // Frame capture state
    isStreaming: frameCapture.isStreaming,
    framesCaptured: frameCapture.framesCaptured,
    framesSent: frameCapture.framesSent,
    framesSkipped: frameCapture.framesSkipped,
    lastResponse: frameCapture.lastResponse,
    lastError: frameCapture.lastError,

    // Quality validation state
    validationResult: qualityValidation.validationResult,
    isStable: qualityValidation.isStable,

    // Auto enrollment state
    isCountingDown: autoEnrollment.isCountingDown,
    countdownValue: autoEnrollment.countdownValue,
    capturedCount: autoEnrollment.capturedCount,
    isComplete: autoEnrollment.isComplete,
    capturedImages: autoEnrollment.capturedImages,
    lastSavedPath: autoEnrollment.lastSavedPath,

    // Controls
    startPipeline,
    stopPipeline,
    resetPipeline,
    processFrame,
  };
}
