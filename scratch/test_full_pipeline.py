import psycopg2, os, json, numpy as np, base64
from dotenv import load_dotenv

load_dotenv('backend/.env')
conn = psycopg2.connect(os.getenv('DATABASE_URL'))
cur = conn.cursor()

query = """
SELECT c.id, c."childCode", bd."faceImageUrl", bd."faceEncodingJson", c."orphanageId"
FROM children c
JOIN biometric_data bd ON bd."childId" = c.id
WHERE c."childCode" = 'CH-2026-23898'
"""
cur.execute(query)
row = cur.fetchone()
if row:
    print('Child:', row[1])
    print('Orphanage ID:', row[4])
    emb_json = row[3]
    emb = np.array(json.loads(emb_json))
    print('DB Embedding shape:', emb.shape)
    
    img_b64 = row[2]
    if img_b64.startswith('data:image'):
        img_b64 = img_b64.split(',', 1)[1]
    
    img_data = base64.b64decode(img_b64)
    with open('scratch/db_child_image.jpg', 'wb') as f:
        f.write(img_data)
    print('Saved image to scratch/db_child_image.jpg')

    # Now let's trigger Phase 8A and 8C via HTTP
    import requests
    # 1. Load cache for this orphanage
    url_load = 'http://localhost:8000/attendance/load-enrolled-embeddings'
    requests.post(url_load, json={"orphanageId": row[4]})
    
    # 2. Generate Live Embedding
    url_live = 'http://localhost:8000/attendance/generate-live-embedding'
    with open('scratch/db_child_image.jpg', 'rb') as f:
        files = {'image': ('db_child_image.jpg', f, 'image/jpeg')}
        data = {'cameraId': 'TEST-CAM'}
        resp_live = requests.post(url_live, files=files, data=data)
    
    res_live = resp_live.json()
    print('Phase 8A:', res_live.get('phaseStatus'))
    
    # 3. Match
    url_match = 'http://localhost:8000/attendance/recognize-live'
    data_match = {'frameKey': res_live.get('frameKey')}
    resp_match = requests.post(url_match, data=data_match)
    
    res_match = resp_match.json()
    print('Phase 8C Similarity:', res_match.get('bestSimilarity'))
    print('Recognized:', res_match.get('recognized'))
