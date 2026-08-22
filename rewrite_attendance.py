import re

with open('src/pages/AIAttendance.jsx', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Imports
content = content.replace(
    'import { generateLiveEmbedding, recognizeFace } from "../services/faceDetectionService";',
    'import { generateLiveEmbedding, recognizeFace } from "../services/faceDetectionService";\nimport useFrameCapture from "../hooks/useFrameCapture";'
)

# 2. Camera state
content = content.replace(
    'const [cameraOn, setCameraOn] = useState(true);',
    'const [cameraOn, setCameraOn] = useState(false);'
)

# 3. phase7A -> phase8A state
content = content.replace('phase7A', 'phase8A')
content = content.replace('Phase 7A', 'Phase 8A')
content = content.replace('Phase 7C/7D', 'Phase 8A')

# 4. Update the startWebcam / stopWebcam to include logs & useFrameCapture
webcam_block = '''  useEffect(() => {
    if (cameraOn) {
      console.log("==========================");
      console.log("AI ATTENDANCE");
      console.log("==========================");
      console.log("[Attendance] Camera Started");
      console.log("[Attendance] Frame Capture Started");
      startWebcam();
    } else {
      console.log("[Attendance] Camera Stopped");
      console.log("==========================");
      stopWebcam();
    }
    return () => {
      stopWebcam();
    };
  }, [cameraOn]);

  const { isStreaming, framesCaptured, framesSent, lastResponse } = useFrameCapture({ videoRef, enabled: cameraOn });

  useEffect(() => {
    if (framesCaptured > 0) console.log([Attendance] Frame # Captured);
  }, [framesCaptured]);

  useEffect(() => {
    if (framesSent > 0) console.log([Attendance] Sending Frame #);
  }, [framesSent]);'''

old_webcam_block = '''  useEffect(() => {
    if (cameraOn) {
      startWebcam();
    } else {
      stopWebcam();
    }
    return () => {
      stopWebcam();
    };
  }, [cameraOn]);'''

content = content.replace(old_webcam_block, webcam_block)

# 5. Replace phase8ACapture completely
old_capture_func = r'  const phase8ACapture = async \(\) => \{.*?\n  \};\n\n  // Watch useFrameCapture responses and trigger Phase 8A automatically\n  useEffect\(\(\) => \{.*?\n  \}, \[cameraOn\]\);'

new_capture_func = '''  const phase8ACapture = async () => {
    if (!cameraOn || !videoRef.current) return;
    if (phase8ARunningRef.current) return;
    if (scanState === "scanning") return;

    phase8ARunningRef.current = true;
    setPhase8AStatus("waiting");
    console.log("[Phase 8A]");
    console.log("Live Embedding Started");

    try {
      const canvas = document.createElement("canvas");
      canvas.width = videoRef.current.videoWidth || 640;
      canvas.height = videoRef.current.videoHeight || 480;
      const ctx = canvas.getContext("2d");
      if (!ctx) { phase8ARunningRef.current = false; return; }
      ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);

      const blob = await new Promise((resolve) =>
        canvas.toBlob(resolve, "image/jpeg", 0.92)
      );
      if (!blob) { phase8ARunningRef.current = false; return; }

      const result = await generateLiveEmbedding(blob, { cameraId: "CAM-01" });

      if (!result.liveEmbeddingGenerated) {
        setPhase8AStatus("waiting");
        setPhase8AReason(result.reason || "Adjust position");
        setPhase8AProcessingMs(result.processingTimeMs ?? null);
        console.log("Phase 8A FAILED");
      } else {
        setPhase8AStatus("ready");
        setPhase8AReason("Ready For Matching");
        setPhase8AProcessingMs(result.processingTimeMs ?? null);
        
        console.log("Face Cropped");
        console.log("Embedding Generated");
        console.log("Embedding Normalized");
        console.log("Embedding Validated");
        console.log("Ready For Matching");
        console.log("Phase 8A PASSED");
      }
    } catch (err) {
      setPhase8AStatus("error");
      setPhase8AReason("AI service unavailable");
      setPhase8AProcessingMs(null);
      console.log("Phase 8A FAILED");
    } finally {
      phase8ARunningRef.current = false;
    }
  };

  useEffect(() => {
    if (!cameraOn) {
      setPhase8AStatus(null);
      setPhase8AReason("");
      setPhase8AProcessingMs(null);
      return;
    }
    
    if (lastResponse && lastResponse.captureAllowed) {
      console.log("[Attendance] Detection Response Received");
      phase8ACapture();
    }
  }, [cameraOn, lastResponse]);'''

# Wait, since the file was restored, the original text actually has "phase7ACapture" and the setInterval logic.
# I will just write a regex that matches the whole phase7ACapture and the following useEffect.

old_capture_func_re = r'  const phase8ACapture = async \(\) => \{.*?\n  \};\n\n  // Run Phase 8A every 3 seconds while camera is live\n  useEffect\(\(\) => \{.*?\n  \}, \[cameraOn\]\);'

content = re.sub(old_capture_func_re, new_capture_func, content, flags=re.DOTALL)

# 6. Update handleCameraToggle
old_toggle = '''  const handleCameraToggle = () => {
    setCameraOn((current) => !current);
    if (cameraOn) {
      setScanState("idle");
      setDetectedChild(null);
    }
  };'''

new_toggle = '''  const handleCameraToggle = (turnOn) => {
    setCameraOn(turnOn);
    if (turnOn) {
      setScanState("idle");
      setDetectedChild(null);
    }
  };'''
content = content.replace(old_toggle, new_toggle)

# 7. Update UI Buttons
old_buttons = '''          <div className="flex shrink-0 items-center gap-2.5">
            <Button icon={FiRefreshCw} variant="secondary" className="rounded-xl text-xs font-semibold" onClick={() => startScan("manual")}>
              Re-scan Camera
            </Button>
            <Button icon={cameraOn ? FiCamera : FiCameraOff} className="rounded-xl text-xs font-semibold" onClick={handleCameraToggle}>
              {cameraOn ? "Camera Live" : "Camera Off"}
            </Button>
          </div>'''

new_buttons = '''          <div className="flex shrink-0 items-center gap-2.5">
            <span className="text-xs font-semibold text-slate-500 mr-2">
              Camera: {cameraOn ? "Running" : "Stopped"}
            </span>
            <Button 
              icon={FiCamera} 
              className="rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white" 
              onClick={() => handleCameraToggle(true)} 
              disabled={cameraOn}
            >
              Start Camera
            </Button>
            <Button 
              icon={FiCameraOff} 
              className="rounded-xl text-xs font-semibold bg-red-600 hover:bg-red-700 text-white" 
              onClick={() => handleCameraToggle(false)} 
              disabled={!cameraOn}
            >
              Stop Camera
            </Button>
          </div>'''
content = content.replace(old_buttons, new_buttons)

# 8. Update the JSX for phase 8A (which was originally phase 7A but got replaced to phase 8A in step 3).
# Wait, let's fix the JSX content of the phase 8A indicator that was originally 7A.
jsx_old_generating = '''                    ) : phase8AStatus === "generating" ? (
                      <>
                        <FiCpu className="inline mr-1.5 h-3.5 w-3.5 align-text-bottom animate-spin" />
                        Generating biometric template…
                      </>'''
jsx_new_generating = '''                    ) : phase8AStatus === "generating" ? (
                      <>
                        <FiCpu className="inline mr-1.5 h-3.5 w-3.5 align-text-bottom animate-spin" />
                        Generating Live Embedding...
                      </>'''
content = content.replace(jsx_old_generating, jsx_new_generating)

jsx_old_ready = '''                    {phase8AStatus === "ready" ? (
                      <>
                        <FiCheckCircle className="inline mr-1.5 h-3.5 w-3.5 align-text-bottom" />
                        Live biometric template generated — Ready for recognition
                      </>'''
jsx_new_ready = '''                    {phase8AStatus === "ready" ? (
                      <>
                        <FiCheckCircle className="inline mr-1.5 h-3.5 w-3.5 align-text-bottom" />
                        Live biometric template generated — Ready for matching
                      </>'''
content = content.replace(jsx_old_ready, jsx_new_ready)

with open('src/pages/AIAttendance.jsx', 'w', encoding='utf-8') as f:
    f.write(content)