import re

with open('ai_microservice/main.py', 'r', encoding='utf-8') as f:
    content = f.read()

new_func = '''@app.post("/attendance/generate-live-embedding")
async def generate_live_embedding(
    image: UploadFile = File(...),
    cameraId: Optional[str] = Form("CAM-01-MAIN"),
    frameIndex: Optional[str] = Form(None),
):
    """
    Phase 8A - Live Attendance Embedding Generation.
    """
    request_start_time = time.perf_counter()

    def fail_response(reason):
        print("=" * 50)
        print("PHASE 8A FAILED")
        print(f"Reason : {reason}")
        print("=" * 50)
        return {
            "success": True,
            "phase": "8A",
            "liveEmbeddingGenerated": False,
            "phaseStatus": "FAILED",
            "reason": reason
        }

    # 1. Read uploaded frame
    if image.content_type and not image.content_type.startswith("image/"):
        return fail_response("Uploaded file is not an image")

    contents = await image.read()
    if not contents:
        return fail_response("No image data received")

    # 2. Decode frame
    np_arr = np.frombuffer(contents, np.uint8)
    img_bgr = cv2.imdecode(np_arr, cv2.IMREAD_COLOR)

    if img_bgr is None:
        return fail_response("Image decoding failed")

    frame_height, frame_width = img_bgr.shape[:2]

    # 3. Detection
    if _face_app is None:
        return fail_response("Face detection model is not available")

    try:
        faces = _face_app.get(img_bgr)
    except Exception as exc:
        return fail_response(f"Face detection error: {exc}")

    # 4. Quality Gate
    if len(faces) == 0:
        return fail_response("NO_FACE")

    if len(faces) > 1:
        return fail_response("MULTIPLE_FACES")

    face = faces[0]
    bbox = [round(float(v), 2) for v in face.bbox]
    confidence_score = round(float(face.det_score), 4)

    confidence_pass = confidence_score >= 0.80

    x1, y1, x2, y2 = bbox
    face_width = x2 - x1
    face_height = y2 - y1
    face_area = face_width * face_height
    frame_area = frame_width * frame_height
    face_area_ratio = round(face_area / frame_area, 4) if frame_area > 0 else 0.0
    size_pass = (8.0 <= (face_area_ratio * 100) <= 35.0 and face_width >= 180 and face_height >= 220)

    blur_pass = False
    brightness_pass = False

    try:
        gray = cv2.cvtColor(img_bgr, cv2.COLOR_BGR2GRAY)
        blur_score = round(float(cv2.Laplacian(gray, cv2.CV_64F).var()), 1)
        blur_pass = blur_score >= 80.0
        brightness_value = round(float(np.mean(gray)), 1)
        brightness_pass = 60.0 <= brightness_value <= 200.0
    except Exception:
        pass

    capture_allowed = confidence_pass and size_pass and blur_pass and brightness_pass

    if not capture_allowed:
        return fail_response("QUALITY_VALIDATION_FAILED")

    # 5. Generate Embedding
    if _recognition_app is None:
        return fail_response("Recognition model is not available")

    try:
        rec_faces = _recognition_app.get(img_bgr)
    except Exception as exc:
        return fail_response(f"Recognition model error: {exc}")

    if not rec_faces:
        return fail_response("NO_FACE_RECOGNITION")

    rec_face = rec_faces[0]
    raw_embedding = rec_face.embedding

    if raw_embedding is None:
        return fail_response("Recognition model returned None embedding")

    raw_arr = np.asarray(raw_embedding, dtype=np.float32)

    if raw_arr.shape[0] != EMBEDDING_DIMENSION:
        return fail_response(f"Embedding dimension {raw_arr.shape[0]} != {EMBEDDING_DIMENSION}")

    contains_nan = bool(np.isnan(raw_arr).any())
    contains_inf = bool(np.isinf(raw_arr).any())

    if contains_nan:
        return fail_response("Raw embedding contains NaN values")

    if contains_inf:
        return fail_response("Raw embedding contains Infinity values")

    l2_norm_before = float(np.linalg.norm(raw_arr))
    if l2_norm_before < _EPSILON:
        return fail_response("Raw embedding has zero L2 norm")

    # L2 normalize
    normalized = raw_arr / l2_norm_before

    contains_nan_norm = bool(np.isnan(normalized).any())
    contains_inf_norm = bool(np.isinf(normalized).any())
    l2_norm_after = float(np.linalg.norm(normalized))
    norm_ok = math.isclose(l2_norm_after, 1.0, abs_tol=_NORM_TOLERANCE)

    if contains_nan_norm or contains_inf_norm or not norm_ok:
        return fail_response("Normalized embedding failed validation")

    # 6. Store in-process
    frame_key = f"8a_{int(time.time() * 1000)}_{uuid.uuid4().hex[:8]}"
    _live_embeddings[frame_key] = normalized.tolist()

    processing_time_ms = round((time.perf_counter() - request_start_time) * 1000.0, 1)

    print()
    print("=" * 50)
    print("PHASE 8A")
    print("LIVE EMBEDDING GENERATION")
    print("=" * 50)
    print(f"Frame ID .............. {frameIndex or 'N/A'}")
    print(f"Face Detected ......... YES")
    print(f"Face Cropped .......... YES")
    print(f"Embedding Generated ... YES")
    print(f"Embedding Dimension ... {EMBEDDING_DIMENSION}")
    print(f"Embedding Type ........ float32")
    print(f"Normalized ............ YES")
    print(f"L2 Norm ............... {l2_norm_after:.6f}")
    print(f"Contains NaN .......... NO")
    print(f"Contains Infinity ..... NO")
    print(f"Processing Time ....... {processing_time_ms} ms")
    print(f"Ready For Matching .... YES")
    print(f"PHASE 8A STATUS ....... PASSED")
    print("=" * 50)
    print()

    return {
        "success": True,
        "phase": "8A",
        "liveEmbeddingGenerated": True,
        "embeddingDimension": EMBEDDING_DIMENSION,
        "normalized": True,
        "readyForMatching": True,
        "processingTimeMs": processing_time_ms,
        "phaseStatus": "PASSED",
        "frameKey": frame_key
    }
'''

pattern = re.compile(r'@app\.post\("/attendance/generate-live-embedding"\).*?# =============================================================================\r?\n# Phase 7B', re.DOTALL)

if pattern.search(content):
    new_content = pattern.sub(new_func + '\n# =============================================================================\n# Phase 7B', content)
    
    # Also replace mentions of Phase 7A -> 8A globally in comments just in case
    new_content = new_content.replace('Phase 7A', 'Phase 8A')
    
    with open('ai_microservice/main.py', 'w', encoding='utf-8') as f:
        f.write(new_content)
    print("Replaced successfully")
else:
    print("Failed to find replacement block.")