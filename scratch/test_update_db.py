import psycopg2, os, json, numpy as np, base64, requests, cv2
from dotenv import load_dotenv
from insightface.app import FaceAnalysis

load_dotenv('backend/.env')
conn = psycopg2.connect(os.getenv('DATABASE_URL'))
cur = conn.cursor()

# 1. Get the image
cur.execute('SELECT bd."faceImageUrl" FROM children c JOIN biometric_data bd ON bd."childId" = c.id WHERE c."childCode" = %s', ('CH-2026-23898',))
img_b64 = cur.fetchone()[0]
if img_b64.startswith('data:image'):
    img_b64 = img_b64.split(',', 1)[1]
img_data = base64.b64decode(img_b64)
with open('scratch/temp.jpg', 'wb') as f:
    f.write(img_data)

# 2. Get local embedding
app = FaceAnalysis(name='buffalo_l', allowed_modules=['detection', 'recognition'])
app.prepare(ctx_id=0, det_thresh=0.5)
img_bgr = cv2.imread('scratch/temp.jpg')
faces = app.get(img_bgr)
face = faces[0]
raw = np.asarray(face.embedding, dtype=np.float32)
norm = raw / np.linalg.norm(raw)

# 3. Update DB with real embedding
cur.execute('UPDATE biometric_data SET "faceEncodingJson" = %s WHERE "childId" = (SELECT id FROM children WHERE "childCode" = %s)', (json.dumps(norm.tolist()), 'CH-2026-23898'))
conn.commit()

# 4. Reload Cache
requests.post('http://localhost:8000/attendance/load-enrolled-embeddings', json={'orphanageId': '71104eec-b03b-45bc-ad67-847c5391848b'})

# 5. Live Embedding and Match
url_live = 'http://localhost:8000/attendance/generate-live-embedding'
with open('scratch/temp.jpg', 'rb') as f:
    res_live = requests.post(url_live, files={'image': ('temp.jpg', f, 'image/jpeg')}, data={'cameraId': 'TEST-CAM'}).json()

res_match = requests.post('http://localhost:8000/attendance/recognize-live', data={'frameKey': res_live['frameKey']}).json()
print('New Similarity:', res_match['bestSimilarity'])
