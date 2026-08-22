const fs = require("fs");

const results = {};

// 1. Backend: save-image endpoint
let mainPy = fs.readFileSync("ai_microservice/main.py", "utf8");
results.backend_sessionId_param = mainPy.includes("sessionId: Optional[str] = Form(None)");
results.backend_target_dir_session = mainPy.includes('f"session_{sessionId}"');
results.backend_embedding_req = mainPy.includes('sessionId: Optional[str] = None');
results.backend_generate_filters = mainPy.includes('if req and req.sessionId:');

// 2. Service: faceDetectionService.js
let svc = fs.readFileSync("src/services/faceDetectionService.js", "utf8");
results.service_save_form = svc.includes('if (meta.sessionId) formData.append("sessionId", meta.sessionId);');
results.service_gen_sig = svc.includes("export async function generateEnrollmentEmbeddings(sessionId)");
results.service_gen_body = svc.includes("sessionId ? JSON.stringify({ sessionId }) : undefined");

// 3. Hook: useAutoCapture.js
let hook = fs.readFileSync("src/hooks/useAutoCapture.js", "utf8");
results.hook_prop = hook.includes("sessionId = null,");
results.hook_ref = hook.includes("const sessionIdRef = useRef(sessionId);");
results.hook_sync = hook.includes("sessionIdRef.current = sessionId;");
results.hook_send = hook.includes("sessionId: sessionIdRef.current,");

// 4. Page: RegisterChild.jsx
let page = fs.readFileSync("src/pages/RegisterChild.jsx", "utf8");
results.page_state = page.includes("enrollmentSessionId");
results.page_autocap = page.includes("sessionId: enrollmentSessionId,");
results.page_phase6a = page.includes("generateEnrollmentEmbeddings(enrollmentSessionId)");
results.page_restart = page.includes('setEnrollmentSessionId(`');
results.page_phase6a_display = page.includes("Phase 6A Verification");

console.log("=== Session ID Wiring Verification ===");
let allPass = true;
for (const [k, v] of Object.entries(results)) {
  const status = v ? "PASS" : "FAIL";
  if (!v) allPass = false;
  console.log(`  [${status}] ${k}`);
}
console.log(allPass ? "\nALL CHECKS PASSED ✓" : "\nSOME CHECKS FAILED ✗");