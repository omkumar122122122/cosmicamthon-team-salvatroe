const fs = require("fs");

const p = "src/pages/RegisterChild.jsx";
let s = fs.readFileSync(p, "utf8");

const hadCRLF = s.includes("\r\n");
const content = hadCRLF ? s.replace(/\r\n/g, "\n") : s;
let c = content;

// 1. Add enrollmentSessionId state (after phase6ATriggeredRef)
c = c.replace(
  "  const phase6ATriggeredRef = useRef(false);",
  "  const phase6ATriggeredRef = useRef(false);\n\n  // Unique enrollment session ID — isolates this session's images into\n  // their own folder (enrollment_images/session_<id>) so Phase 6A never\n  // processes images from previous enrollment sessions.\n  const [enrollmentSessionId, setEnrollmentSessionId] = useState(() =>\n    `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`\n  );"
);

// 2. Pass sessionId to useAutoCapture
c = c.replace(
  "    onImageSaved: handleImageSaved,\n    onComplete: (result) => {",
  "    onImageSaved: handleImageSaved,\n    sessionId: enrollmentSessionId,\n    onComplete: (result) => {"
);

// 3. Pass sessionId to generateEnrollmentEmbeddings in Phase 6A effect
c = c.replace(
  "        const result = await generateEnrollmentEmbeddings();",
  "        const result = await generateEnrollmentEmbeddings(enrollmentSessionId);"
);

// 4. Reset session ID on restartEnrollmentSession
c = c.replace(
  "    phase6ATriggeredRef.current = false;\n    if (!isCameraActive) {",
  "    phase6ATriggeredRef.current = false;\n    // New session → new unique folder for the next enrollment run.\n    setEnrollmentSessionId(`${Date.now()}-${Math.random().toString(36).slice(2, 8)}`);\n    if (!isCameraActive) {"
);

const out = hadCRLF ? c.replace(/\n/g, "\r\n") : c;
fs.writeFileSync(p, out);

const check = fs.readFileSync(p, "utf8");
const count = (check.match(/enrollmentSessionId/g) || []).length;
console.log("enrollmentSessionId occurrences:", count);