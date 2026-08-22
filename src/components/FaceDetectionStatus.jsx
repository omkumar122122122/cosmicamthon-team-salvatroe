/**
 * FaceDetectionStatus — Live Status Panel Component
 * ------------------------------------------------------------------
 * Displays real-time face detection status based on the FastAPI
 * `/detect-face` endpoint response.
 *
 * Props:
 *   - lastResponse: The most recent API response object (or null)
 *   - lastError: The most recent error message (or null)
 *   - isStreaming: Boolean indicating if frame capture is active
 */

export default function FaceDetectionStatus({ lastResponse, lastError, isStreaming, validationResult, pipelineStatus }) {
  // Determine status based on state
  const getStatus = () => {
    // Error state takes precedence
    if (lastError) {
      return {
        icon: "🔴",
        text: "AI Service Offline",
        color: "text-red-600",
        bg: "bg-red-50",
        border: "border-red-200",
      };
    }

    // Not streaming means waiting for camera
    if (!isStreaming) {
      return {
        icon: "⚪",
        text: "Camera Inactive",
        color: "text-slate-500",
        bg: "bg-slate-50",
        border: "border-slate-200",
      };
    }

    // Use validation status from quality validation pipeline if available
    if (validationResult?.status) {
      const statusText = validationResult.status;
      if (statusText.includes("Ready To Capture")) {
        return {
          icon: "✅",
          text: statusText,
          color: "text-emerald-600",
          bg: "bg-emerald-50",
          border: "border-emerald-200",
        };
      } else if (statusText.includes("No Face")) {
        return {
          icon: "❌",
          text: statusText,
          color: "text-red-600",
          bg: "bg-red-50",
          border: "border-red-200",
        };
      } else if (statusText.includes("Only One Child")) {
        return {
          icon: "⚠️",
          text: statusText,
          color: "text-orange-600",
          bg: "bg-orange-50",
          border: "border-orange-200",
        };
      } else if (statusText.includes("❌")) {
        return {
          icon: "❌",
          text: statusText,
          color: "text-red-600",
          bg: "bg-red-50",
          border: "border-red-200",
        };
      }
    }

    // Streaming but no response yet (first frame pending)
    if (!lastResponse) {
      return {
        icon: "🟡",
        text: "Detecting Face...",
        color: "text-amber-600",
        bg: "bg-amber-50",
        border: "border-amber-200",
      };
    }

    // Fallback to pipeline status
    if (pipelineStatus) {
      return {
        icon: "🟡",
        text: pipelineStatus,
        color: "text-amber-600",
        bg: "bg-amber-50",
        border: "border-amber-200",
      };
    }

    // Fallback
    return {
      icon: "🟡",
      text: "Detecting Face...",
      color: "text-amber-600",
      bg: "bg-amber-50",
      border: "border-amber-200",
    };
  };

  const status = getStatus();
  const { icon, text, color, bg, border } = status;

  // Extract confidence from detections if available
  const confidence = lastResponse?.detections?.[0]?.confidence
    ? `${(lastResponse.detections[0].confidence * 100).toFixed(1)}%`
    : null;

  const faces = lastResponse?.faces;

  return (
    <div className={`rounded-xl border-2 ${border} ${bg} p-5 shadow-sm transition-all duration-300`}>
      {/* Title */}
      <h3 className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-3">
        AI Face Detection Status
      </h3>

      {/* Status */}
      <div className="space-y-2 mb-3">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-semibold uppercase text-slate-500 dark:text-slate-400">
            Status:
          </span>
          <span className={`text-sm font-extrabold ${color} font-display`}>
            {icon} {text}
          </span>
        </div>

        {/* Faces Count */}
        {faces !== undefined && (
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase text-slate-500 dark:text-slate-400">
              Faces:
            </span>
            <span className="text-sm font-bold text-slate-700 dark:text-slate-200 font-mono">
              {faces}
            </span>
          </div>
        )}

        {/* Confidence - only show when exactly 1 face detected */}
        {confidence && faces === 1 && (
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase text-slate-500 dark:text-slate-400">
              Confidence:
            </span>
            <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400 font-mono">
              {confidence}
            </span>
          </div>
        )}
      </div>

      {/* Error Message */}
      {lastError && (
        <div className="mt-2 rounded-lg bg-red-100 border border-red-200 px-2.5 py-2">
          <p className="text-[11px] font-medium text-red-700 dark:text-red-300">
            {lastError}
          </p>
        </div>
      )}

      {/* Backend Message */}
      {lastResponse?.message && !lastError && (
        <div className="mt-2 rounded-lg bg-white/60 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 px-2.5 py-2">
          <p className="text-[11px] font-medium text-slate-600 dark:text-slate-300">
            {lastResponse.message}
          </p>
        </div>
      )}

      {/* Validation Details - Show when we have validation results */}
      {validationResult?.validation && (
        <div className="mt-3 space-y-1.5 border-t border-slate-200 dark:border-slate-700 pt-2.5">
          <p className="text-[10px] font-bold uppercase text-slate-400 mb-1.5">Quality Checks</p>
          
          {/* Confidence */}
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-slate-600 dark:text-slate-400">Confidence</span>
            <span className={`text-[11px] font-bold ${validationResult.validation.confidence ? 'text-emerald-600' : 'text-red-600'}`}>
              {validationResult.validation.confidence ? '✓ PASS' : '✗ FAIL'}
            </span>
          </div>

          {/* Size */}
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-slate-600 dark:text-slate-400">Size (30-60%)</span>
            <span className={`text-[11px] font-bold ${validationResult.validation.size ? 'text-emerald-600' : 'text-red-600'}`}>
              {validationResult.validation.size ? '✓ PASS' : '✗ FAIL'}
            </span>
          </div>

          {/* Position */}
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-slate-600 dark:text-slate-400">Position</span>
            <span className={`text-[11px] font-bold ${validationResult.validation.position ? 'text-emerald-600' : 'text-red-600'}`}>
              {validationResult.validation.position ? '✓ PASS' : '✗ FAIL'}
            </span>
          </div>

          {/* Blur */}
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-slate-600 dark:text-slate-400">Blur Detection</span>
            <span className={`text-[11px] font-bold ${validationResult.validation.blur ? 'text-emerald-600' : 'text-red-600'}`}>
              {validationResult.validation.blur ? '✓ PASS' : '✗ FAIL'}
            </span>
          </div>

          {/* Brightness */}
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-slate-600 dark:text-slate-400">Brightness</span>
            <span className={`text-[11px] font-bold ${validationResult.validation.brightness ? 'text-emerald-600' : 'text-red-600'}`}>
              {validationResult.validation.brightness ? '✓ PASS' : '✗ FAIL'}
            </span>
          </div>

          {/* Stability */}
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-slate-600 dark:text-slate-400">Stability (1.5s)</span>
            <span className={`text-[11px] font-bold ${validationResult.validation.stability ? 'text-emerald-600' : 'text-red-600'}`}>
              {validationResult.validation.stability ? '✓ PASS' : '✗ FAIL'}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
