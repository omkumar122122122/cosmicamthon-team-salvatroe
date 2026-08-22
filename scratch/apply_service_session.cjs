const fs = require("fs");

const p = "src/services/faceDetectionService.js";
let s = fs.readFileSync(p, "utf8");

const hadCRLF = s.includes("\r\n");
let c = hadCRLF ? s.replace(/\r\n/g, "\n") : s;

let applied = 0;

// 1. Add sessionId to formData in saveEnrollmentImage
if (!c.includes("if (meta.sessionId) formData.append")) {
  c = c.replace(
    '  if (meta.frameId !== undefined && meta.frameId !== null) {\n    formData.append("frameId", String(meta.frameId));\n  }\n  if (meta.timestamp) formData.append("timestamp", meta.timestamp);',
    '  if (meta.frameId !== undefined && meta.frameId !== null) {\n    formData.append("frameId", String(meta.frameId));\n  }\n  if (meta.sessionId) formData.append("sessionId", meta.sessionId);\n  if (meta.timestamp) formData.append("timestamp", meta.timestamp);'
  );
  applied++;
}

// 2. Add sessionId to JSDoc for saveEnrollmentImage
if (!c.includes("@param {string} [meta.sessionId]")) {
  c = c.replace(
    " * @param {number|string} [meta.frameId] - frameId returned by /detect-face.",
    " * @param {number|string} [meta.frameId] - frameId returned by /detect-face.\n * @param {string} [meta.sessionId] - Unique enrollment session ID (isolates images per session)."
  );
  applied++;
}

// 3. Add sessionId to saveEnrollmentImage log
if (!c.includes("sessionId: meta.sessionId,")) {
  c = c.replace(
    "    frameId: meta.frameId,\n    timestamp: meta.timestamp,",
    "    frameId: meta.frameId,\n    sessionId: meta.sessionId,\n    timestamp: meta.timestamp,"
  );
  applied++;
}

// 4. Update generateEnrollmentEmbeddings signature + body
if (!c.includes("export async function generateEnrollmentEmbeddings(sessionId)")) {
  // Find and replace the old-body version
  c = c.replace(
    "export async function generateEnrollmentEmbeddings() {",
    "export async function generateEnrollmentEmbeddings(sessionId) {"
  );
  applied++;
}

if (!c.includes("sessionId ? JSON.stringify({ sessionId }) : undefined")) {
  c = c.replace(
    "    // No body — the backend locates the saved enrollment folder itself.",
    "    body: sessionId ? JSON.stringify({ sessionId }) : undefined,"
  );
  c = c.replace(
    '  const response = await fetch(url, {\n    method: "POST",\n    // No body — the backend locates the saved enrollment folder itself.\n  });',
    '  const response = await fetch(url, {\n    method: "POST",\n    headers: { "Content-Type": "application/json" },\n    body: sessionId ? JSON.stringify({ sessionId }) : undefined,\n  });'
  );
  applied++;
}

if (!c.includes("sessionId: ${sessionId || \"none\"}")) {
  c = c.replace(
    '  console.log(`${LOG_TAG} Phase 6A -> POST ${url}`);',
    '  console.log(`${LOG_TAG} Phase 6A -> POST ${url} (sessionId: ${sessionId || "none"})`);'
  );
  applied++;
}

const out = hadCRLF ? c.replace(/\n/g, "\r\n") : c;
fs.writeFileSync(p, out);

const check = fs.readFileSync(p, "utf8");
console.log("sessionId occurrences:", (check.match(/sessionId/g) || []).length);
console.log("Replacements applied:", applied);