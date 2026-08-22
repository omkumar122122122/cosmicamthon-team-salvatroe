import re

with open('src/services/faceDetectionService.js', 'r', encoding='utf-8') as f:
    content = f.read()

new_func = '''// Phase 8C - Cosine Similarity Matching
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
    console.error(${LOG_TAG} Phase 8C failed:, detail);
    console.log("Phase 8C FAILED");
    throw new Error(ecognizeFace failed: );
  }

  const data = await response.json().catch(() => ({}));

  console.log(Children Compared : );
  console.log("Similarity Calculation Finished");
  console.log(Top Match : );
  console.log(Similarity : );
  console.log(Comparison Time :  ms);
  
  if (data.readyForRecognition) {
    console.log("Ready For Recognition");
    console.log("Phase 8C PASSED");
  } else {
    console.log("Phase 8C FAILED");
  }

  return data;
}'''

old_func_re = r'// \?\?\? Phase 7C & 7D.*?export async function recognizeFace\(frameKey, frameIndex = null\) \{.*?\n\}'
# Actually it might be easier to match export async function recognizeFace and the block.
# I will use a simple regex replacing from export async function recognizeFace to the end.

old_func_re2 = r'// \?\?\? Phase 7C & 7D.*?export async function recognizeFace\(frameKey, frameIndex = null\) \{.*'

if re.search(old_func_re2, content, re.DOTALL):
    content = re.sub(old_func_re2, new_func, content, flags=re.DOTALL)
else:
    # Try just function
    content = re.sub(r'export async function recognizeFace.*?$', new_func, content, flags=re.DOTALL)

with open('src/services/faceDetectionService.js', 'w', encoding='utf-8') as f:
    f.write(content)