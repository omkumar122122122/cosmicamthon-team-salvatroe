import psycopg2, os, json, numpy as np, base64
from dotenv import load_dotenv

load_dotenv('backend/.env')
conn = psycopg2.connect(os.getenv('DATABASE_URL'))
cur = conn.cursor()

query = """
SELECT c.id, c."childCode", bd."faceImageUrl", bd."faceEncodingJson"
FROM children c
JOIN biometric_data bd ON bd."childId" = c.id
WHERE c."childCode" = 'CH-2026-23898'
"""
cur.execute(query)
row = cur.fetchone()
if row:
    emb_json = row[3]
    print('Type of emb_json:', type(emb_json))
    if isinstance(emb_json, str):
        print('String length:', len(emb_json))
        print('Prefix:', emb_json[:200])
        parsed = json.loads(emb_json)
        print('Type of parsed:', type(parsed))
    else:
        print('Prefix:', str(emb_json)[:200])
        print('Type of emb_json (is string?): No')
