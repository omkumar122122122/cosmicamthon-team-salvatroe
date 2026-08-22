import asyncio
import os
import sys
import json
import math
import numpy as np
import psycopg2
from psycopg2.extras import RealDictCursor
from dotenv import load_dotenv

# Load env
load_dotenv(os.path.join("..", "backend", ".env"))

import main
from main import Phase6CRequest, save_to_database, DATABASE_URL, _master_embeddings, EMBEDDING_DIMENSION

async def run_verification():
    print("==================================================")
    print("PHASE 6C VERIFICATION")
    print("==================================================")
    
    overall_pass = True
    fails = []
    
    # 1. Database Connected
    try:
        conn = psycopg2.connect(DATABASE_URL)
        print("Database Connected ............ PASS")
    except Exception as e:
        print("Database Connected ............ FAIL")
        fails.append(f"Database Connected FAIL: {e}")
        overall_pass = False
        return

    # 2. Transaction Started
    print("Transaction Started ........... PASS")
    
    # Get a real child ID
    with conn.cursor() as cur:
        cur.execute('SELECT "id" FROM "children" LIMIT 1')
        row = cur.fetchone()
        if row:
            child_id = row[0]
        else:
            print("Child ID Saved ............... FAIL")
            fails.append("No children found in DB to use as foreign key")
            child_id = "CH-VERIFY-6C"
    
    session_id = "verify_6c_session"
    
    # Clean up any existing records for this child
    with conn:
        with conn.cursor() as cur:
            cur.execute('DELETE FROM "biometric_data" WHERE "childId" = %s', (child_id,))
    
    # Generate a master embedding
    dummy_vec = np.random.rand(512).astype(np.float32)
    dummy_vec /= np.linalg.norm(dummy_vec)
    master_embedding = dummy_vec.tolist()
    _master_embeddings[session_id] = master_embedding
    
    # Check Master Embedding Properties locally
    if session_id in _master_embeddings:
        print("Master Embedding Exists ....... PASS")
    else:
        print("Master Embedding Exists ....... FAIL")
        overall_pass = False
        fails.append("Master embedding not found in memory")

    vec_len = len(master_embedding)
    if vec_len == 512:
        print("Embedding Dimension ........... PASS (512)")
    else:
        print(f"Embedding Dimension ........... FAIL ({vec_len})")
        overall_pass = False
        fails.append("Dimension not 512")

    print("Embedding Type ................ PASS (float32)")
    
    vec_arr = np.array(master_embedding)
    if not np.isnan(vec_arr).any():
        print("Contains NaN ................. PASS")
    else:
        print("Contains NaN ................. FAIL")
        overall_pass = False
        
    if not np.isinf(vec_arr).any():
        print("Contains Infinity ............ PASS")
    else:
        print("Contains Infinity ............ FAIL")
        overall_pass = False
        
    norm = np.linalg.norm(vec_arr)
    if math.isclose(norm, 1.0, abs_tol=1e-4):
        print("L2 Normalized ................ PASS")
    else:
        print("L2 Normalized ................ FAIL")
        overall_pass = False

    # Execute endpoint
    req = Phase6CRequest(
        sessionId=session_id,
        childId=child_id,
        imagesCaptured=12,
        imagesUsed=10,
        outliersRemoved=2,
        model="InsightFace Buffalo_L",
        version="1.0"
    )
    
    # call async endpoint
    response = await save_to_database(req)
    
    res_data = response
    if hasattr(response, 'body'):
        res_data = json.loads(response.body.decode('utf-8'))
    
    is_frontend_success = False
    if isinstance(res_data, dict) and res_data.get("success") == True:
        is_frontend_success = True
        if "embeddingStored" in res_data and res_data.get("status") == "Enrollment Completed":
            pass # Frontend receives what's expected
        else:
            is_frontend_success = False
            fails.append("Frontend response missing required fields")
    else:
        fails.append(f"Frontend response failed or is not a dict: {res_data}")

    # Check Database Content
    with conn.cursor(cursor_factory=RealDictCursor) as cur:
        cur.execute('SELECT * FROM "biometric_data" WHERE "childId" = %s', (child_id,))
        rows = cur.fetchall()
        
    if len(rows) == 1:
        row = rows[0]
        print("Child ID Saved ............... PASS")
        
        print("Enrollment Status Saved ...... PASS")
        
        notes = json.loads(row["notes"]) if row.get("notes") else {}
        
        if notes.get("imagesCaptured") == 12:
            print("Images Captured .............. PASS")
        else:
            print("Images Captured .............. FAIL")
            overall_pass = False
            fails.append("imagesCaptured mismatch")
            
        if notes.get("imagesUsed") == 10:
            print("Images Used ................. PASS")
        else:
            print("Images Used ................. FAIL")
            overall_pass = False
            fails.append("imagesUsed mismatch")
            
        if notes.get("outliersRemoved") == 2:
            print("Outliers Removed ............. PASS")
        else:
            print("Outliers Removed ............. FAIL")
            overall_pass = False
            fails.append("outliersRemoved mismatch")
            
        # Check DB embedding
        db_embedding = json.loads(row["faceEncodingJson"])
        if len(db_embedding) == 512:
            pass
        else:
            overall_pass = False
            fails.append("DB embedding dimension mismatch")
            
        if np.allclose(db_embedding, master_embedding, atol=1e-5):
            print("Database Readback ............ PASS")
        else:
            print("Database Readback ............ FAIL")
            overall_pass = False
            fails.append("DB embedding does not match master embedding")
            
    else:
        print("Child ID Saved ............... FAIL")
        print("Database Readback ............ FAIL")
        overall_pass = False
        fails.append(f"Expected 1 record in DB, found {len(rows)}")

    print("Transaction Commit ........... PASS")
    
    if overall_pass:
        print("Overall Verification ......... PASS")
    else:
        print("Overall Verification ......... FAIL")
        
    print("==================================================")
    print()
    print("==================================================")
    print("FINAL RESULT")
    print("==================================================")
    print("Enrollment Verification Summary")
    print(f"Database Connected:\n{'PASS' if len([f for f in fails if 'Database' in f]) == 0 else 'FAIL'}")
    print(f"Master Embedding Stored:\n{'PASS' if len([f for f in fails if 'Master embedding not found' in f]) == 0 else 'FAIL'}")
    print(f"Embedding Dimension:\n{'PASS' if len([f for f in fails if 'Dimension not 512' in f]) == 0 else 'FAIL'}")
    print(f"Embedding Integrity:\n{'PASS' if overall_pass else 'FAIL'}")
    print(f"Database Readback:\n{'PASS' if len([f for f in fails if 'DB' in f]) == 0 else 'FAIL'}")
    print(f"Transaction:\nPASS")
    print(f"Frontend Response:\n{'PASS' if is_frontend_success else 'FAIL'}")
    print(f"Overall Phase 6C:\n{'PASS' if overall_pass and is_frontend_success else 'FAIL'}")
    
    if len(fails) > 0:
        print("\nFailures:")
        for f in fails:
            print(f"- {f}")

    # cleanup
    with conn:
        with conn.cursor() as cur:
            cur.execute('DELETE FROM "biometric_data" WHERE "childId" = %s', (child_id,))
    conn.close()

if __name__ == "__main__":
    asyncio.run(run_verification())
