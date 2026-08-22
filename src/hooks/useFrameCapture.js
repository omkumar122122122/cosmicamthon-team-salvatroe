/**
 * useFrameCapture — Frame Capture Service
 * ------------------------------------------------------------------
 * Captures one frame every 300ms from a live webcam <video> element
 * and transmits it to the Python FastAPI `/detect-face` endpoint.
 *
 * Pipeline responsibility:
 *   Camera Component  ->  Frame Capture Service  ->  API Service
 *
 * Design rules enforced by this hook:
 *  1. Reuses an EXISTING video ref (does not create a new camera).
 *  2. Captures one frame every 300ms (CAPTURE_INTERVAL).
 *  3. Converts each frame to a JPEG Blob at ~80% quality.
 *  4. Sends the image as multipart/form-data (field name: `image`).
 *  5. NEVER stops the camera while sending frames.
 *  6. If a request is already in progress, the current frame is SKIPPED
 *     to avoid flooding the server.
 *  7. Network errors are handled gracefully (logged, never thrown up
 *     to the caller / UI).
 *  8. Logs: frame captured, frame sent, response received, errors.
 *
 * NOTE: This hook ONLY captures + transmits. It does NOT perform face
 * detection, recognition, embedding generation, or attendance marking.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { CAPTURE_INTERVAL } from "../components/FaceEnrollment/constants";
import { detectFace } from "../services/faceDetectionService";

const LOG_TAG = "[FrameCapture]";
const JPEG_QUALITY = 0.8; // ~80% quality as required
const DEFAULT_CAMERA_ID = "CAM-01-MAIN";

export default function useFrameCapture({ videoRef, enabled = false, cameraId = DEFAULT_CAMERA_ID } = {}) {
  // ---- State (for optional UI observability; UI is NOT changed by this task) ----
  const [isStreaming, setIsStreaming] = useState(false);
  const [framesCaptured, setFramesCaptured] = useState(0);
  const [framesSent, setFramesSent] = useState(0);
  const [framesSkipped, setFramesSkipped] = useState(0);
  const [lastResponse, setLastResponse] = useState(null);
  const [lastError, setLastError] = useState(null);

  // ---- Refs (mutable, do not trigger re-render) ----
  const intervalRef = useRef(null);
  const inFlightRef = useRef(false); // request-in-progress guard
  const frameIndexRef = useRef(0);
  const canvasRef = useRef(null); // reusable offscreen canvas
  const enabledRef = useRef(enabled);

  // Keep enabledRef in sync so the interval callback always sees the latest value.
  useEffect(() => {
    enabledRef.current = enabled;
  }, [enabled]);

  /**
   * Capture the current video frame as a JPEG Blob (~80% quality).
   * Returns null if the video is not ready.
   */
  const captureFrameBlob = useCallback(() => {
    const video = videoRef?.current;
    if (!video || !video.videoWidth || !video.videoHeight) {
      return null;
    }

    // Lazily create / resize the reusable offscreen canvas.
    if (!canvasRef.current) {
      canvasRef.current = document.createElement("canvas");
    }
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const ctx = canvas.getContext("2d");
    if (!ctx) return null;

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    // toBlob is async but cheap; we wrap it in a Promise.
    return new Promise((resolve) => {
      canvas.toBlob(
        (blob) => resolve(blob),
        "image/jpeg",
        JPEG_QUALITY
      );
    });
  }, [videoRef]);

  /**
   * Capture + transmit a single frame, with the in-flight guard.
   */
  const captureAndSend = useCallback(async () => {
    if (!enabledRef.current) return;
    if (inFlightRef.current) {
      // A previous request is still pending -> skip this frame.
      setFramesSkipped((n) => n + 1);
      console.log(`${LOG_TAG} Frame skipped (request in progress).`);
      return;
    }

    const blob = await captureFrameBlob();
    if (!blob) {
      // Camera not ready yet — silently skip, no error.
      return;
    }

    frameIndexRef.current += 1;
    const idx = frameIndexRef.current;
    setFramesCaptured((n) => n + 1);
    console.log(`${LOG_TAG} Frame captured #${idx} (${blob.size} bytes)`);

    inFlightRef.current = true;
    setFramesSent((n) => n + 1);

    try {
      const res = await detectFace(blob, { cameraId, frameIndex: idx });
      setLastResponse(res);
      setLastError(null);
      // `detectFace` already logs "Frame sent" and "Response received".
    } catch (err) {
      console.error(`${LOG_TAG} Error sending frame #${idx}:`, err?.message || err);
      setLastError(err?.message || "Network error");
      // Graceful: do NOT rethrow. The pipeline must keep running.
    } finally {
      inFlightRef.current = false;
    }
  }, [captureFrameBlob, cameraId]);

  /**
   * Start the 300ms capture interval. The camera itself is NOT touched.
   */
  const start = useCallback(() => {
    if (intervalRef.current) return; // already running
    console.log(`${LOG_TAG} Starting 300ms frame capture pipeline.`);
    setIsStreaming(true);
    intervalRef.current = setInterval(() => {
      // setInterval cannot await, so we fire-and-forget the async work.
      captureAndSend();
    }, CAPTURE_INTERVAL);
  }, [captureAndSend]);

  /**
   * Stop the capture interval. The camera stream is left running so the
   * existing UI keeps showing the live feed.
   */
  const stop = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
      console.log(`${LOG_TAG} Frame capture pipeline stopped.`);
    }
    setIsStreaming(false);
  }, []);

  // Auto start/stop based on the `enabled` flag.
  useEffect(() => {
    if (enabled) {
      start();
    } else {
      stop();
    }
    // Cleanup on unmount or when handlers change.
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [enabled, start, stop]);

  return {
    // controls
    start,
    stop,
    // status (read-only)
    isStreaming,
    framesCaptured,
    framesSent,
    framesSkipped,
    lastResponse,
    lastError,
  };
}