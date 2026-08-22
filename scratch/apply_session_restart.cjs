const fs = require("fs");

const p = "src/pages/RegisterChild.jsx";
let s = fs.readFileSync(p, "utf8");

const hadCRLF = s.includes("\r\n");
let c = hadCRLF ? s.replace(/\r\n/g, "\n") : s;

// Add session ID reset in restartEnrollmentSession
const search = "    galleryUrlsRef.current = [];\n    if (!isCameraActive) {";
const replace = "    galleryUrlsRef.current = [];\n    // New session → new unique folder for the next enrollment run.\n    setEnrollmentSessionId(`${Date.now()}-${Math.random().toString(36).slice(2, 8)}`);\n    if (!isCameraActive) {";

if (c.includes(search)) {
  c = c.replace(search, replace);
  console.log("Replacement applied");
} else {
  console.log("Search pattern NOT found");
}

const out = hadCRLF ? c.replace(/\n/g, "\r\n") : c;
fs.writeFileSync(p, out);

const check = fs.readFileSync(p, "utf8");
console.log("enrollmentSessionId occurrences:", (check.match(/enrollmentSessionId/g) || []).length);