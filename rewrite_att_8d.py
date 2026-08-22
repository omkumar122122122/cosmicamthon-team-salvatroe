import re

with open('src/pages/AIAttendance.jsx', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Add state for Phase 8D Result
state_hook_re = r'  const \[phase8AProcessingMs, setPhase8AProcessingMs\] = useState\(null\);'
if re.search(state_hook_re, content):
    content = re.sub(state_hook_re, 
        '''  const [phase8AProcessingMs, setPhase8AProcessingMs] = useState(null);\n  const [phase8DResult, setPhase8DResult] = useState(null);''',
        content)

# 2. Reset phase8DResult in useEffect when camera turns off
useEffect_camera_re = r'    if \(!cameraOn\) \{\s*setPhase7AStatus\(null\);\s*setPhase7AReason\(""\);\s*setPhase7AProcessingMs\(null\);\s*return;\s*\}'
if re.search(useEffect_camera_re, content):
    content = re.sub(useEffect_camera_re,
        '''    if (!cameraOn) {\n      setPhase7AStatus(null);\n      setPhase7AReason("");\n      setPhase7AProcessingMs(null);\n      setPhase8DResult(null);\n      return;\n    }''',
        content)

# 3. Rewrite phase8ACapture
new_capture = '''  const phase8ACapture = async () => {
    if (!cameraOn || !videoRef.current) return;
    if (phase8ARunningRef.current) return;
    if (scanState === "scanning") return;

    phase8ARunningRef.current = true;
    setPhase8AStatus("waiting");
    setPhase8DResult(null);

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

      // Phase 8A
      const result = await generateLiveEmbedding(blob, { cameraId: "CAM-01" });

      if (!result.liveEmbeddingGenerated) {
        setPhase8AStatus("waiting");
        setPhase8AReason(result.reason || result.status || "Adjust position");
        setPhase8AProcessingMs(result.processingTimeMs ?? null);
      } else {
        // Phase 8C/8D
        setPhase8AStatus("generating");
        setPhase8AReason("Deciding Recognition...");
        try {
          const recResult = await recognizeFace(result.frameKey);
          
          setPhase8DResult(recResult);
          
          if (recResult.recognitionStatus === "RECOGNIZED") {
            setPhase8AStatus("ready");
            setPhase8AReason(Child ID: );
            setPhase8AProcessingMs(recResult.comparisonTimeMs ?? null);
          } else if (recResult.recognitionStatus === "UNKNOWN_FACE") {
            setPhase8AStatus("error");
            setPhase8AReason("Unknown Face");
            setPhase8AProcessingMs(recResult.comparisonTimeMs ?? null);
          } else if (recResult.recognitionStatus === "AMBIGUOUS_MATCH") {
            setPhase8AStatus("error");
            setPhase8AReason("Ambiguous Match");
            setPhase8AProcessingMs(recResult.comparisonTimeMs ?? null);
          } else {
            setPhase8AStatus("error");
            setPhase8AReason("Phase 8D FAILED");
            setPhase8AProcessingMs(null);
          }
        } catch (recErr) {
          setPhase8AStatus("error");
          setPhase8AReason("AI Matching Error");
          setPhase8AProcessingMs(null);
        }
      }
    } catch (err) {
      setPhase8AStatus("error");
      setPhase8AReason("AI service unavailable");
      setPhase8AProcessingMs(null);
    } finally {
      phase8ARunningRef.current = false;
      console.log("[Attendance] Recognition Pipeline Completed");
    }
  };'''

old_capture_re = r'  const phase8ACapture = async \(\) => \{.*?\};\n\n  // Watch useFrameCapture'

if re.search(old_capture_re, content, re.DOTALL):
    content = re.sub(old_capture_re, new_capture + '\n\n  // Watch useFrameCapture', content, flags=re.DOTALL)

with open('src/pages/AIAttendance.jsx', 'w', encoding='utf-8') as f:
    f.write(content)