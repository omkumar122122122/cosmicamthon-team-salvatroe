const fs = require("fs");

const p = "src/hooks/useAutoCapture.js";
let s = fs.readFileSync(p, "utf8");

// Normalize to LF for reliable matching, then restore CRLF at the end.
const hadCRLF = s.includes("\r\n");
const content = hadCRLF ? s.replace(/\r\n/g, "\n") : s;

let c = content;

// 1. Add sessionId prop to destructure
c = c.replace(
  "  onImageSaved = null,\n  onComplete = null,\n} = {}) {",
  "  onImageSaved = null,\n  onComplete = null,\n  sessionId = null,\n} = {}) {"
);

// 2. Add sessionIdRef
c = c.replace(
  "  const targetCountRef = useRef(targetCount);\n  const onImageSavedRef = useRef(onImageSaved);",
  "  const targetCountRef = useRef(targetCount);\n  const sessionIdRef = useRef(sessionId);\n  const onImageSavedRef = useRef(onImageSaved);"
);

// 3. Add sessionId sync effect
c = c.replace(
  "  useEffect(() => {\n    onCompleteRef.current = onComplete;\n  }, [onComplete]);",
  "  useEffect(() => {\n    onCompleteRef.current = onComplete;\n  }, [onComplete]);\n\n  useEffect(() => {\n    sessionIdRef.current = sessionId;\n  }, [sessionId]);"
);

// 4. Pass sessionId in sendImage
c = c.replace(
  "        cameraId: cameraIdRef.current,\n        frameId: frameIdRef.current,\n        timestamp: new Date().toISOString(),",
  "        cameraId: cameraIdRef.current,\n        frameId: frameIdRef.current,\n        sessionId: sessionIdRef.current,\n        timestamp: new Date().toISOString(),"
);

// Restore CRLF if the original used it.
const out = hadCRLF ? c.replace(/\n/g, "\r\n") : c;

fs.writeFileSync(p, out);

// Verify
const check = fs.readFileSync(p, "utf8");
const count = (check.match(/sessionId/g) || []).length;
console.log("sessionId occurrences:", count);