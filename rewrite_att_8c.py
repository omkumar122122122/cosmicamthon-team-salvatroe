import re

with open('src/pages/AIAttendance.jsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Replace any lingering phase7A with phase8A
content = content.replace('phase7A', 'phase8A')
content = content.replace('Phase 7A', 'Phase 8A')
content = content.replace('Phase 7C/7D', 'Phase 8C')

# Rewrite phase8ACapture
new_capture = '''  const phase8ACapture = async () => {
    if (!cameraOn || !videoRef.current) return;
    if (phase8ARunningRef.current) return;
    if (scanState === "scanning") return;

    phase8ARunningRef.current = true;
    setPhase8AStatus("waiting");

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
        // Phase 8C
        setPhase8AStatus("generating");
        setPhase8AReason("Calculating Similarity...");
        try {
          const recResult = await recognizeFace(result.frameKey);
          
          if (recResult.readyForRecognition) {
            setPhase8AStatus("ready");
            setPhase8AReason(Best Match:  (%));
            setPhase8AProcessingMs(recResult.comparisonTimeMs ?? null);
          } else {
            setPhase8AStatus("error");
            setPhase8AReason("Phase 8C FAILED");
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
else:
    print("Warning: old capture not found")

with open('src/pages/AIAttendance.jsx', 'w', encoding='utf-8') as f:
    f.write(content)