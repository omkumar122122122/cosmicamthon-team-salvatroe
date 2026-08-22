/**
 * useQualityValidation — Face Quality Validation Service
 * ------------------------------------------------------------------
 * Validates detected faces against quality thresholds before allowing
 * enrollment image capture.
 *
 * Pipeline responsibility:
 *   Frame Capture  ->  Quality Validation  ->  Auto Enrollment
 *
 * Validation checks:
 *  1. Face Detection Confidence (min: 0.80)
 *  2. Face Size (7%-40% of frame)
 *  3. Blur Detection (Laplacian variance)
 *  4. Brightness Check (50-210)
 *  5. Stability Check (1.5s minimum)
 *
 * NOTE: This hook ONLY validates quality. It does NOT perform face
 * recognition, embedding generation, or attendance marking.
 */

import { useCallback, useEffect, useRef, useState } from "react";

const LOG_TAG = "[QualityValidation]";

const QUALITY_THRESHOLDS = {
  MIN_CONFIDENCE: 0.80,
  MIN_FACE_RATIO: 0.07,
  MAX_FACE_RATIO: 0.40,
  MIN_BRIGHTNESS: 50,
  MAX_BRIGHTNESS: 210,
  MIN_SHARPNESS: 70,
  STABILITY_DURATION_MS: 1500,
  CAPTURE_INTERVAL_MS: 1000,
};

/**
 * Calculate face area ratio relative to frame size
 */
function calculateFaceRatio(faceBox, frameWidth, frameHeight) {
  if (!faceBox || !frameWidth || !frameHeight) return 0;
  const faceWidth = faceBox.w || faceBox.width || 0;
  const faceHeight = faceBox.h || faceBox.height || 0;
  const faceArea = faceWidth * faceHeight;
  const frameArea = frameWidth * frameHeight;
  return faceArea / frameArea;
}


/**
 * Calculate brightness of image region
 */
function calculateBrightness(imageData) {
  if (!imageData) return 0;
  const data = imageData.data;
  let sum = 0;
  const pixelCount = data.length / 4;
  
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    sum += (r + g + b) / 3;
  }
  
  return sum / pixelCount;
}

/**
 * Calculate sharpness using Laplacian variance
 */
function calculateSharpness(imageData) {
  if (!imageData) return 0;
  const data = imageData.data;
  const width = imageData.width;
  const height = imageData.height;
  
  // Simplified Laplacian calculation
  let sum = 0;
  let count = 0;
  
  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const idx = (y * width + x) * 4;
      const center = (data[idx] + data[idx + 1] + data[idx + 2]) / 3;
      const top = (data[((y - 1) * width + x) * 4] + data[((y - 1) * width + x) * 4 + 1] + data[((y - 1) * width + x) * 4 + 2]) / 3;
      const bottom = (data[((y + 1) * width + x) * 4] + data[((y + 1) * width + x) * 4 + 1] + data[((y + 1) * width + x) * 4 + 2]) / 3;
      const left = (data[(y * width + (x - 1)) * 4] + data[(y * width + (x - 1)) * 4 + 1] + data[(y * width + (x - 1)) * 4 + 2]) / 3;
      const right = (data[(y * width + (x + 1)) * 4] + data[(y * width + (x + 1)) * 4 + 1] + data[(y * width + (x + 1)) * 4 + 2]) / 3;
      
      const laplacian = Math.abs(center * 4 - top - bottom - left - right);
      sum += laplacian;
      count++;
    }
  }
  
  return count > 0 ? sum / count : 0;
}

export default function useQualityValidation({ videoRef, enabled = false } = {}) {
  const [validationResult, setValidationResult] = useState({
    isValid: false,
    errors: [],
    metrics: {},
  });
  
  const [stabilityStartTime, setStabilityStartTime] = useState(null);
  const [isStable, setIsStable] = useState(false);
  const [lastCaptureTime, setLastCaptureTime] = useState(0);
  
  const previousFaceBoxRef = useRef(null);
  const stabilityTimerRef = useRef(null);
  const canvasRef = useRef(null);

  /**
   * Validate a single detection result
   */
  const validateDetection = useCallback(async (detectionResult) => {
    if (!enabled || !detectionResult) {
      return null;
    }

    // Extract faces from detection result
    const faces = detectionResult.faces || detectionResult.detections || [];
    const faceCount = faces.length;
    
    console.log(`${LOG_TAG} Frame Received`);
    console.log(`${LOG_TAG} Faces: ${faceCount}`);
    
    // Early returns for 0 or >1 faces
    if (faceCount === 0) {
      console.log(`${LOG_TAG} ❌ No Face Detected`);
      return {
        faces: 0,
        captureAllowed: false,
        status: "❌ No Face Detected",
        validation: {
          confidence: false,
          size: false,
          blur: false,
          brightness: false,
          stability: false,
        }
      };
    }
    
    if (faceCount > 1) {
      console.log(`${LOG_TAG} ⚠ Only One Child Should Be Visible`);
      return {
        faces: faceCount,
        captureAllowed: false,
        status: "⚠ Only One Child Should Be Visible",
        validation: {
          confidence: false,
          size: false,
          blur: false,
          brightness: false,
          stability: false,
        }
      };
    }
    
    // Exactly one face - run all quality validations
    const face = faces[0];
    const confidence = face.confidence || face.score || 0;
    const faceBox = face.bbox || face.box || face;
    
    console.log(`${LOG_TAG}`);
    console.log(`${LOG_TAG} --------------------------------------`);
    console.log(`${LOG_TAG} Faces: 1`);
    
    // Get frame dimensions
    let frameWidth = 1280;
    let frameHeight = 720;
    
    if (videoRef?.current) {
      frameWidth = videoRef.current.videoWidth || frameWidth;
      frameHeight = videoRef.current.videoHeight || frameHeight;
    }
    
    // Validation 1: Confidence
    const confidencePass = confidence >= QUALITY_THRESHOLDS.MIN_CONFIDENCE;
    console.log(`${LOG_TAG} Confidence = ${(confidence * 100).toFixed(1)}%`);
    console.log(`${LOG_TAG} Minimum = ${(QUALITY_THRESHOLDS.MIN_CONFIDENCE * 100).toFixed(1)}%`);
    console.log(`${LOG_TAG} Confidence: ${confidencePass ? "PASS" : "FAIL"} (${(confidence * 100).toFixed(1)}%)`);
    
    // Validation 2: Face Size
    const faceRatio = calculateFaceRatio(faceBox, frameWidth, frameHeight);
    const sizePass = faceRatio >= QUALITY_THRESHOLDS.MIN_FACE_RATIO && 
                     faceRatio <= QUALITY_THRESHOLDS.MAX_FACE_RATIO;
    console.log(`${LOG_TAG} Face Ratio = ${faceRatio.toFixed(2)}`);
    console.log(`${LOG_TAG} Allowed = ${QUALITY_THRESHOLDS.MIN_FACE_RATIO}–${QUALITY_THRESHOLDS.MAX_FACE_RATIO}`);
    console.log(`${LOG_TAG} Size: ${sizePass ? "PASS" : "FAIL"} (${(faceRatio * 100).toFixed(1)}%)`);
    
    
    // Validation 4 & 5: Blur and Brightness (from video frame)
    let brightness = 0;
    let sharpness = 0;
    let brightnessPass = true;
    let blurPass = true;
    
    if (videoRef?.current) {
      try {
        const canvas = canvasRef.current || document.createElement("canvas");
        canvasRef.current = canvas;
        canvas.width = videoRef.current.videoWidth || 640;
        canvas.height = videoRef.current.videoHeight || 480;
        
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          
          // Brightness check
          brightness = calculateBrightness(imageData);
          brightnessPass = brightness >= QUALITY_THRESHOLDS.MIN_BRIGHTNESS && 
                          brightness <= QUALITY_THRESHOLDS.MAX_BRIGHTNESS;
          console.log(`${LOG_TAG} Brightness = ${brightness.toFixed(1)}`);
          console.log(`${LOG_TAG} Allowed = ${QUALITY_THRESHOLDS.MIN_BRIGHTNESS}–${QUALITY_THRESHOLDS.MAX_BRIGHTNESS}`);
          console.log(`${LOG_TAG} Brightness: ${brightnessPass ? "PASS" : "FAIL"} (${brightness.toFixed(1)})`);
          
          // Blur detection
          sharpness = calculateSharpness(imageData);
          blurPass = sharpness >= QUALITY_THRESHOLDS.MIN_SHARPNESS;
          console.log(`${LOG_TAG} Blur Score = ${sharpness.toFixed(2)}`);
          console.log(`${LOG_TAG} Minimum = ${QUALITY_THRESHOLDS.MIN_SHARPNESS}`);
          console.log(`${LOG_TAG} Blur: ${blurPass ? "PASS" : "FAIL"} (${sharpness.toFixed(2)})`);
        }
      } catch (err) {
        console.warn(`${LOG_TAG} Could not analyze frame quality:`, err);
      }
    }
    
    // Validation 6: Stability Check
    const isPositionStable = checkPositionStability(faceBox);
    const stabilityPass = isPositionStable;
    console.log(`${LOG_TAG} Stability: ${stabilityPass ? "PASS" : "FAIL"}`);
    
    const captureAllowed = confidencePass && sizePass && 
                          brightnessPass && blurPass && stabilityPass;
    
    console.log(`${LOG_TAG} Capture Allowed: ${captureAllowed ? "YES" : "NO"}`);
    console.log(`${LOG_TAG} --------------------------------------`);
    console.log(`${LOG_TAG}`);
    
    // Determine status message
    let status;
    if (captureAllowed) {
      status = "✅ Ready To Capture";
    } else if (!confidencePass) {
      status = "❌ Low Detection Confidence";
    } else if (!sizePass && faceRatio < QUALITY_THRESHOLDS.MIN_FACE_RATIO) {
      status = "❌ Move Closer";
    } else if (!sizePass && faceRatio > QUALITY_THRESHOLDS.MAX_FACE_RATIO) {
      status = "❌ Move Slightly Back";
    } else if (!brightnessPass) {
      status = "❌ Improve Lighting";
    } else if (!blurPass || !stabilityPass) {
      status = "❌ Hold Still";
    } else {
      status = "❌ Hold Still";
    }
    
    return {
      faces: 1,
      captureAllowed,
      status,
      validation: {
        confidence: confidencePass,
        size: sizePass,
        blur: blurPass,
        brightness: brightnessPass,
        stability: stabilityPass,
      }
    };
  }, [enabled, videoRef]);

  /**
   * Check if face position is stable over time
   */
  const checkPositionStability = useCallback((currentFaceBox) => {
    if (!currentFaceBox) return false;
    
    const currentX = currentFaceBox.x || currentFaceBox.left || 0;
    const currentY = currentFaceBox.y || currentFaceBox.top || 0;
    
    if (!previousFaceBoxRef.current) {
      previousFaceBoxRef.current = { x: currentX, y: currentY, time: Date.now() };
      return false;
    }
    
    const prev = previousFaceBoxRef.current;
    const deltaX = Math.abs(currentX - prev.x);
    const deltaY = Math.abs(currentY - prev.y);
    const maxDelta = 15; // pixels
    
    const isStable = deltaX < maxDelta && deltaY < maxDelta;
    
    if (isStable) {
      if (!stabilityStartTime) {
        setStabilityStartTime(Date.now());
      }
    } else {
      previousFaceBoxRef.current = { x: currentX, y: currentY, time: Date.now() };
      setStabilityStartTime(null);
      setIsStable(false);
      return false;
    }
    
    // Check if stable for required duration
    if (stabilityStartTime) {
      const stableDuration = Date.now() - stabilityStartTime;
      if (stableDuration >= QUALITY_THRESHOLDS.STABILITY_DURATION_MS) {
        setIsStable(true);
        return true;
      }
    }
    
    return false;
  }, [stabilityStartTime]);

  /**
   * Reset stability tracking
   */
  const resetStability = useCallback(() => {
    previousFaceBoxRef.current = null;
    setStabilityStartTime(null);
    setIsStable(false);
  }, []);

  /**
   * Update validation result
   */
  const updateValidation = useCallback((result) => {
    setValidationResult(result);
  }, []);

  /**
   * Cleanup on unmount
   */
  useEffect(() => {
    return () => {
      if (stabilityTimerRef.current) {
        clearInterval(stabilityTimerRef.current);
      }
      resetStability();
    };
  }, [resetStability]);

  return {
    validationResult,
    validateDetection,
    updateValidation,
    resetStability,
    isStable,
    lastCaptureTime,
    QUALITY_THRESHOLDS,
  };
}

export { QUALITY_THRESHOLDS };
