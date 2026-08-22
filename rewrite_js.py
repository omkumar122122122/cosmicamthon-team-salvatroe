import re

with open('src/services/faceDetectionService.js', 'r', encoding='utf-8') as f:
    content = f.read()

new_func = '''// Phase 8B - Database Embedding Loader
export async function loadEnrolledEmbeddings() {
  const url = ${AI_MICROSERVICE_BASE_URL}/attendance/load-enrolled-embeddings;

  console.log("[Phase 8B]");
  console.log("Loading Database...");

  const response = await fetch(url, {
    method: "POST",
  });

  if (!response.ok) {
    let detail = HTTP ;
    try {
      const errBody = await response.json();
      detail = errBody?.error || errBody?.detail || errBody?.message || detail;
    } catch {
      //
    }
    console.error(${LOG_TAG} Phase 8B failed:, detail);
    console.log("Phase 8B FAILED");
    throw new Error(loadEnrolledEmbeddings failed: );
  }

  const data = await response.json().catch(() => ({}));

  if (data.databaseConnected) {
    console.log("Database Connected");
  }
  
  console.log("Loading Master Embeddings");
  console.log(Children Loaded : );
  console.log(Valid Embeddings : );
  
  if (data.readyForMatching) {
    console.log("Ready For Matching");
    console.log("Phase 8B PASSED");
  } else {
    console.log("Phase 8B FAILED");
  }

  return data;
}'''

old_func_re = r'export async function loadEnrolledEmbeddings\(\) \{.*?\n\}'
content = re.sub(old_func_re, new_func, content, flags=re.DOTALL)

# Update Phase 7B references to Phase 8B where appropriate
content = content.replace("Phase 7B", "Phase 8B")

with open('src/services/faceDetectionService.js', 'w', encoding='utf-8') as f:
    f.write(content)