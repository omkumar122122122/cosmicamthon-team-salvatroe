import re

with open('src/pages/AIAttendance.jsx', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Add import for loadEnrolledEmbeddings
content = content.replace(
    'import { generateLiveEmbedding, recognizeFace } from "../services/faceDetectionService";',
    'import { generateLiveEmbedding, recognizeFace, loadEnrolledEmbeddings } from "../services/faceDetectionService";'
)

# 2. Add useEffect to load embeddings when component mounts
load_embeddings_effect = '''  // Phase 8B: Load master embeddings on mount
  useEffect(() => {
    const loadEmbeddings = async () => {
      try {
        await loadEnrolledEmbeddings();
      } catch (err) {
        console.error("Failed to load enrolled embeddings", err);
      }
    };
    loadEmbeddings();
  }, []);'''

# Find a good place to insert this useEffect (e.g., after the fetchRealChildren useEffect)
fetch_children_effect_re = r'(  useEffect\(\(\) => \{\n    const fetchRealChildren = async \(\) => \{.*?\n  \}, \[\]\);)'

if re.search(fetch_children_effect_re, content, re.DOTALL):
    content = re.sub(
        fetch_children_effect_re, 
        r'\1\n\n' + load_embeddings_effect, 
        content, 
        flags=re.DOTALL
    )
else:
    print("Warning: Could not find fetchRealChildren useEffect to append to.")

with open('src/pages/AIAttendance.jsx', 'w', encoding='utf-8') as f:
    f.write(content)