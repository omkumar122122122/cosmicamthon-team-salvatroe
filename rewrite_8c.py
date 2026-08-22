import re

with open('ai_microservice/main.py', 'r', encoding='utf-8') as f:
    content = f.read()

new_func = '''@app.post("/attendance/recognize-live")
async def recognize_live(
    frameKey: str = Form(...)
):
    """
    Phase 8C - Cosine Similarity Matching
    """
    request_start_time = time.perf_counter()

    def fail_response(reason):
        print("=" * 50)
        print("PHASE 8C FAILED")
        print(f"Reason: {reason}")
        print("=" * 50)
        return {
            "success": True,
            "phase": "8C",
            "phaseStatus": "FAILED",
            "reason": reason
        }

    # 1. Check Live Embedding
    if frameKey not in _live_embeddings:
        return fail_response("Live embedding missing")
        
    live_emb_list = _live_embeddings.pop(frameKey)
    live_vec = np.array(live_emb_list, dtype=np.float32)

    # 2. Check Cache
    if not _recognition_cache:
        return fail_response("Embedding cache empty")

    # 3. Calculate similarities
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
        return fail_response(f"Comparison error: {str(e)}")

    # 4. Sort results
    results.sort(key=lambda x: x["similarity"], reverse=True)

    if len(results) == 0:
        return fail_response("Comparison error (No results)")

    best_match = results[0]["childId"]
    best_sim = results[0]["similarity"]
    
    second_best_sim = results[1]["similarity"] if len(results) > 1 else 0.0
    sim_gap = round(best_sim - second_best_sim, 4)
    
    proc_time_ms = round((time.perf_counter() - request_start_time) * 1000.0, 1)

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
    print(f"Comparison Time .............{proc_time_ms} ms")
    print(f"Ready For Recognition .......YES")
    print(f"PHASE 8C STATUS .............PASSED")
    print("=" * 50)
    print()

    return {
        "success": True,
        "phase": "8C",
        "phaseStatus": "PASSED",
        "childrenCompared": len(results),
        "bestMatch": best_match,
        "bestSimilarity": best_sim,
        "secondBestSimilarity": second_best_sim,
        "similarityGap": sim_gap,
        "comparisonTimeMs": proc_time_ms,
        "readyForRecognition": True
    }
'''

pattern = re.compile(r'@app\.post\("/attendance/recognize-live"\).*?return \{\s*"success": True,\s*"phase": "7D",.*?\}', re.DOTALL)

if pattern.search(content):
    new_content = pattern.sub(new_func, content)
    with open('ai_microservice/main.py', 'w', encoding='utf-8') as f:
        f.write(new_content)
    print("Replaced successfully")
else:
    print("Failed to find replacement block.")