import re

with open('ai_microservice/main.py', 'r', encoding='utf-8') as f:
    content = f.read()

new_func = '''@app.post("/attendance/load-enrolled-embeddings")
async def load_enrolled_embeddings():
    """
    Phase 8B - Database Embedding Loader.
    """
    request_start_time = time.perf_counter()

    def fail_response(reason):
        print("=" * 50)
        print("PHASE 8B FAILED")
        print(f"Reason : {reason}")
        print("=" * 50)
        return {
            "success": True,
            "phase": "8B",
            "phaseStatus": "FAILED",
            "databaseConnected": False,
            "reason": reason
        }

    # 1. Check DATABASE_URL
    if not DATABASE_URL:
        return fail_response("Database connection failed (DATABASE_URL missing)")

    # 2. Connect to PostgreSQL
    conn = None
    try:
        conn = psycopg2.connect(DATABASE_URL)
        conn.set_session(readonly=True, autocommit=True)
    except Exception as db_exc:
        return fail_response(f"Database connection failed: {db_exc}")

    # 3. Query: all active FACE_RECOGNITION records joined with children
    SELECT_QUERY = """
        SELECT
            bd."id"               AS biometric_id,
            bd."childId"          AS child_id,
            bd."faceEncodingJson" AS face_encoding_json,
            bd."faceModelVersion" AS model_version,
            bd."capturedAt"       AS captured_at,
            bd."notes"            AS notes,
            c."childCode"         AS child_code,
            c."firstName"         AS first_name,
            c."lastName"          AS last_name
        FROM   "biometric_data"  bd
        JOIN   "children"        c  ON c."id" = bd."childId"
        WHERE  bd."type"     = 'FACE_RECOGNITION'
          AND  bd."isActive" = true
          AND  (c."deletedAt" IS NULL)
        ORDER BY bd."capturedAt" ASC
    """

    rows = []
    try:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            cur.execute(SELECT_QUERY)
            rows = cur.fetchall()
    except Exception as query_exc:
        conn.close()
        return fail_response(f"Database query failed: {query_exc}")

    total_found = len(rows)
    if total_found == 0:
        conn.close()
        return fail_response("No enrolled children found")

    # 4. Validate and cache each record
    _recognition_cache.clear()

    valid_count = 0
    invalid_count = 0
    skipped_count = 0

    for row in rows:
        child_id    = row["child_id"]
        child_code  = row["child_code"] or "UNKNOWN"
        first_name  = row["first_name"] or ""
        last_name   = row["last_name"]  or ""
        child_name  = f"{first_name} {last_name}".strip() or "Unknown"
        biometric_id = row["biometric_id"]
        captured_at  = str(row["captured_at"]) if row["captured_at"] else None
        face_json    = row["face_encoding_json"]

        # Validation rules
        if not face_json:
            print(f"Skipping {child_id}: Master embedding missing")
            invalid_count += 1
            skipped_count += 1
            continue

        try:
            raw_list = json.loads(face_json)
            vec = np.array(raw_list, dtype=np.float32)
        except Exception as exc:
            print(f"Skipping {child_id}: Array conversion error - {exc}")
            invalid_count += 1
            skipped_count += 1
            continue

        dim = int(vec.shape[0])
        if dim != EMBEDDING_DIMENSION:
            print(f"Skipping {child_id}: Embedding dimension invalid ({dim})")
            invalid_count += 1
            skipped_count += 1
            continue

        if bool(np.isnan(vec).any()):
            print(f"Skipping {child_id}: Embedding contains NaN")
            invalid_count += 1
            skipped_count += 1
            continue

        if bool(np.isinf(vec).any()):
            print(f"Skipping {child_id}: Embedding contains Infinity")
            invalid_count += 1
            skipped_count += 1
            continue

        l2_norm = float(np.linalg.norm(vec))
        if not math.isclose(l2_norm, 1.0, abs_tol=_NORM_TOLERANCE):
            print(f"Skipping {child_id}: L2 norm {l2_norm:.6f} != 1.0")
            invalid_count += 1
            skipped_count += 1
            continue

        # All checks passed - store in cache
        _recognition_cache[child_id] = {
            "childId":     child_id,
            "childCode":   child_code,
            "childName":   child_name,
            "embedding":   vec,
            "biometricId": biometric_id,
            "capturedAt":  captured_at,
        }
        valid_count += 1

    conn.close()

    processing_time_ms = round((time.perf_counter() - request_start_time) * 1000.0, 1)
    ready = valid_count > 0

    print()
    print("=" * 50)
    print("PHASE 8B")
    print("LOAD MASTER EMBEDDINGS")
    print("=" * 50)
    print(f"Database Connected ......... YES")
    print(f"Children Found ............. {total_found}")
    print(f"Embeddings Loaded .......... {valid_count}")
    print(f"Invalid Embeddings ......... {invalid_count}")
    print(f"Embedding Dimension ........ {EMBEDDING_DIMENSION}")
    print(f"Normalized Embeddings ...... {valid_count}")
    print(f"Skipped Records ............ {skipped_count}")
    print(f"Ready For Matching ......... {'YES' if ready else 'NO'}")
    print(f"Processing Time ............ {processing_time_ms} ms")
    print(f"PHASE 8B STATUS ............ {'PASSED' if ready else 'FAILED'}")
    print("=" * 50)
    print()

    return {
        "success": True,
        "phase": "8B",
        "phaseStatus": "PASSED" if ready else "FAILED",
        "databaseConnected": True,
        "childrenLoaded": total_found,
        "validEmbeddings": valid_count,
        "invalidEmbeddings": invalid_count,
        "embeddingDimension": EMBEDDING_DIMENSION,
        "readyForMatching": ready,
        "processingTimeMs": processing_time_ms
    }
'''

pattern = re.compile(r'@app\.post\("/attendance/load-enrolled-embeddings"\).*?# =============================================================================\r?\n# Phase 7B', re.DOTALL)

if pattern.search(content):
    new_content = pattern.sub(new_func + '\n# =============================================================================\n# Phase 7B', content)
    with open('ai_microservice/main.py', 'w', encoding='utf-8') as f:
        f.write(new_content)
    print("Replaced successfully")
else:
    print("Failed to find replacement block.")