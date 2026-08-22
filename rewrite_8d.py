import re

with open('ai_microservice/main.py', 'r', encoding='utf-8') as f:
    content = f.read()

new_func = '''@app.post("/attendance/recognize-live")
async def recognize_live(
    frameKey: str = Form(...)
):
    """
    Phase 8C & 8D - Cosine Similarity Matching & Recognition Decision
    """
    request_start_time = time.perf_counter()

    def fail_response(phase, reason):
        print("=" * 50)
        print(f"PHASE {phase} FAILED")
        print(f"Reason: {reason}")
        print("=" * 50)
        return {
            "success": True,
            "phase": phase,
            "phaseStatus": "FAILED",
            "reason": reason
        }

    # 1. Check Live Embedding
    if frameKey not in _live_embeddings:
        return fail_response("8C", "Live embedding missing")
        
    live_emb_list = _live_embeddings.pop(frameKey)
    live_vec = np.array(live_emb_list, dtype=np.float32)

    # 2. Check Cache
    if not _recognition_cache:
        return fail_response("8C", "Embedding cache empty")

    # =========================================================================
    # PHASE 8C - COSINE SIMILARITY MATCHING
    # =========================================================================
    results = []
    try:
        for child_id, record in _recognition_cache.items():
            master_vec = record["embedding"]
            similarity = float(np.dot(live_vec, master_vec))
            results.append({
                "childId": child_id,
                "similarity": round(similarity, 4)
            })
    except Exception as e:
        return fail_response("8C", f"Comparison error: {str(e)}")

    results.sort(key=lambda x: x["similarity"], reverse=True)

    if len(results) == 0:
        return fail_response("8C", "Comparison error (No results)")

    best_match = results[0]["childId"]
    best_sim = results[0]["similarity"]
    second_best_sim = results[1]["similarity"] if len(results) > 1 else 0.0
    sim_gap = round(best_sim - second_best_sim, 4)
    proc_time_ms_8c = round((time.perf_counter() - request_start_time) * 1000.0, 1)

    print()
    print("=" * 50)
    print("PHASE 8C")
    print("COSINE SIMILARITY MATCHING")
    print("=" * 50)
    print("Live Embedding ............. READY")
    print(f"Cached Embeddings .......... {len(_recognition_cache)}")
    print(f"Children Compared .......... {len(results)}")
    print("-" * 38)
    print("TOP 5 MATCHES")
    for i in range(min(5, len(results))):
        print(f"{i+1}.")
        print(f"Child ID ........ {results[i]['childId']}")
        print(f"Similarity ...... {results[i]['similarity']:.4f}")
        print("-" * 38)
    
    print(f"Best Similarity ............ {best_sim:.4f}")
    print(f"Second Best .................{second_best_sim:.4f}")
    print(f"Similarity Gap ..............{sim_gap:.4f}")
    print(f"Comparison Time .............{proc_time_ms_8c} ms")
    print(f"Ready For Recognition .......YES")
    print(f"PHASE 8C STATUS .............PASSED")
    print("=" * 50)

    # =========================================================================
    # PHASE 8D - RECOGNITION DECISION ENGINE
    # =========================================================================
    MIN_RECOGNITION_SIMILARITY = 0.65
    HIGH_CONFIDENCE = 0.85
    VERY_HIGH_CONFIDENCE = 0.92
    MIN_SIMILARITY_GAP = 0.05

    decision = ""
    reason = ""
    recognized = False

    if best_sim < MIN_RECOGNITION_SIMILARITY:
        decision = "UNKNOWN_FACE"
        reason = "Similarity below minimum threshold"
    elif best_sim >= MIN_RECOGNITION_SIMILARITY and sim_gap < MIN_SIMILARITY_GAP:
        decision = "AMBIGUOUS_MATCH"
        reason = "Similarity gap too small"
    else:
        decision = "RECOGNIZED"
        recognized = True

    confidence = "LOW"
    if best_sim >= VERY_HIGH_CONFIDENCE:
        confidence = "VERY_HIGH"
    elif best_sim >= HIGH_CONFIDENCE:
        confidence = "HIGH"
    elif best_sim >= 0.75:
        confidence = "MEDIUM"

    print()
    print("=" * 50)
    print("PHASE 8D")
    print("RECOGNITION DECISION")
    print("=" * 50)
    print(f"Children Compared ............ {len(results)}")
    print(f"Best Match ................... {best_match}")
    print(f"Best Similarity .............. {best_sim:.4f}")
    print(f"Second Best .................. {second_best_sim:.4f}")
    print(f"Similarity Gap ............... {sim_gap:.4f}")

    if decision == "RECOGNIZED":
        print(f"Recognition Decision ......... {decision}")
        print(f"Confidence Level ............. {confidence}")
        print(f"Ready For Attendance ......... YES")
        print(f"PHASE 8D STATUS .............. PASSED")
        print("=" * 50)
        return {
            "success": True,
            "phase": "8D",
            "phaseStatus": "PASSED",
            "recognized": True,
            "recognitionStatus": "RECOGNIZED",
            "childId": best_match,
            "bestSimilarity": best_sim,
            "secondBestSimilarity": second_best_sim,
            "similarityGap": sim_gap,
            "confidenceLevel": confidence,
            "readyForAttendance": True
        }
    elif decision == "UNKNOWN_FACE":
        print(f"Recognition Decision ......... UNKNOWN FACE")
        print(f"Best Similarity .............. {best_sim:.4f}")
        print(f"Ready For Attendance ......... NO")
        print("=" * 50)
        return {
            "success": True,
            "phase": "8D",
            "recognized": False,
            "recognitionStatus": "UNKNOWN_FACE",
            "bestSimilarity": best_sim,
            "readyForAttendance": False
        }
    else:
        # AMBIGUOUS
        print(f"Recognition Decision ......... AMBIGUOUS MATCH")
        print(f"Reason ....................... {reason}")
        print(f"Ready For Attendance ......... NO")
        print("=" * 50)
        return {
            "success": True,
            "phase": "8D",
            "recognized": False,
            "recognitionStatus": "AMBIGUOUS_MATCH",
            "reason": reason,
            "readyForAttendance": False
        }
'''

pattern = re.compile(r'@app\.post\("/attendance/recognize-live"\).*?# =============================================================================\r?\n# PHASE', re.DOTALL)

if pattern.search(content):
    new_content = pattern.sub(new_func + '\n# =============================================================================\n# PHASE', content)
    with open('ai_microservice/main.py', 'w', encoding='utf-8') as f:
        f.write(new_content)
    print("Replaced successfully")
else:
    # try matching till end of file
    pattern_eof = re.compile(r'@app\.post\("/attendance/recognize-live"\).*', re.DOTALL)
    if pattern_eof.search(content):
        new_content = pattern_eof.sub(new_func, content)
        with open('ai_microservice/main.py', 'w', encoding='utf-8') as f:
            f.write(new_content)
        print("Replaced successfully (to EOF)")
    else:
        print("Failed to find replacement block.")