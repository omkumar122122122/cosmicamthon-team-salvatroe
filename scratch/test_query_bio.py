import psycopg2, os
from dotenv import load_dotenv

load_dotenv('backend/.env')
conn = psycopg2.connect(os.getenv('DATABASE_URL'))
cur = conn.cursor()

query = """
SELECT
    c."id" AS child_id,
    c."childCode",
    bd."id" AS biometric_id,
    bd."faceEncodingJson" IS NOT NULL AS has_embedding,
    bd."isActive" AS bio_active
FROM "children" c
LEFT JOIN "biometric_data" bd ON bd."childId" = c."id"
                              AND bd."type" = 'FACE_RECOGNITION'
                              AND bd."isActive" = true
WHERE (c."deletedAt" IS NULL)
"""
cur.execute(query)
for row in cur.fetchall():
    print(row)

cur.execute("SELECT id, type, \"isActive\", length(\"faceEncodingJson\") FROM biometric_data")
print("\nAll biometric data:")
for row in cur.fetchall():
    print(row)
