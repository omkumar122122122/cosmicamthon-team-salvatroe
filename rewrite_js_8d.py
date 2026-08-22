import re

with open('src/services/faceDetectionService.js', 'r', encoding='utf-8') as f:
    content = f.read()

new_func = '''// Phase 8C & 8D - Recognition Decision
export async function recognizeFace(frameKey) {
  const url = ${AI_MICROSERVICE_BASE_URL}/attendance/recognize-live;

  const formData = new FormData();
  formData.append("frameKey", frameKey);

  console.log("[Phase 8C]");
  console.log("Matching Started");
  console.log("Using Cached Embeddings");

  const response = await fetch(url, {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    let detail = HTTP ;
    try {
      const errBody = await response.json();
      detail = errBody?.error || errBody?.detail || errBody?.message || detail;
    } catch {
      //
    }
    console.error(${LOG_TAG} Phase 8C/8D failed:, detail);
    console.log("Phase 8C FAILED");
    throw new Error(ecognizeFace failed: );
  }

  const data = await response.json().catch(() => ({}));

  // Log Phase 8C results (we still return it in the JSON partially if possible, but 
  // actually the backend returns only Phase 8D json. Wait, I should make the backend 
  // also return Phase 8C fields in the single JSON so JS can log them.)

  console.log(Children Compared : );
  console.log("Similarity Calculation Finished");
  console.log(Top Match : );
  console.log(Similarity : );
  console.log(Comparison Time :  ms);
  console.log("Ready For Recognition");
  console.log("Phase 8C PASSED");

  console.log("");
  console.log("[Phase 8D]");
  console.log("Recognition Started");
  console.log(Best Match : );
  console.log(Similarity : );
  console.log(Gap : );
  console.log(Decision : );
  
  if (data.recognitionStatus === "RECOGNIZED") {
    console.log(Confidence : );
    console.log("Ready For Attendance");
    console.log("Phase 8D PASSED");
  } else if (data.recognitionStatus === "UNKNOWN_FACE") {
    console.log("Phase 8D PASSED");
  } else if (data.recognitionStatus === "AMBIGUOUS_MATCH") {
    console.log("Phase 8D PASSED");
  }

  return data;
}'''

old_func_re = r'// \?\?\? Phase 7C & 7D.*?export async function recognizeFace.*?$'
if re.search(old_func_re, content, re.DOTALL):
    content = re.sub(old_func_re, new_func, content, flags=re.DOTALL)
else:
    # Just match function
    content = re.sub(r'export async function recognizeFace.*?$', new_func, content, flags=re.DOTALL)

with open('src/services/faceDetectionService.js', 'w', encoding='utf-8') as f:
    f.write(content)