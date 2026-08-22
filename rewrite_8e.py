import re

with open('ai_microservice/main.py', 'r', encoding='utf-8') as f:
    content = f.read()

new_return_recognized = '''
        # =========================================================================
        # PHASE 8E - FETCH CHILD PROFILE
        # =========================================================================
        child_profile = None
        db_lookup_time = 0.0
        
        try:
            t_start = time.perf_counter()
            conn = psycopg2.connect(DATABASE_URL)
            conn.set_session(readonly=True, autocommit=True)
            with conn.cursor(cursor_factory=RealDictCursor) as cur:
                # Query the child and optionally join orphanage if needed
                # Assuming orphanage table is "orphanages" with column "name"
                q = """
                SELECT 
                    c.id as child_id,
                    c."childCode" as registration_number,
                    c."firstName" as first_name,
                    c."lastName" as last_name,
                    c."approximateAge" as age,
                    c."gender",
                    c."photo",
                    c."orphanageId" as orphanage_id,
                    c."currentStatus" as status,
                    c."admissionDate" as admission_date,
                    c."isActive",
                    o."name" as orphanage_name
                FROM "children" c
                LEFT JOIN "orphanages" o ON c."orphanageId" = o.id
                WHERE c.id = %s
                """
                cur.execute(q, (best_match,))
                row = cur.fetchone()
                
                if row:
                    # Validate active & complete
                    if row["isActive"]:
                        first_name = row["first_name"] or ""
                        last_name = row["last_name"] or ""
                        full_name = f"{first_name} {last_name}".strip()
                        
                        child_profile = {
                            "childId": row["child_id"],
                            "registrationNumber": row["registration_number"] or "N/A",
                            "fullName": full_name,
                            "age": row["age"] or 0,
                            "gender": row["gender"] or "UNKNOWN",
                            "photo": row["photo"] or "",
                            "orphanageId": row["orphanage_id"] or "",
                            "orphanageName": row["orphanage_name"] or "Unknown",
                            "status": row["status"] or "ACTIVE"
                        }
            conn.close()
            db_lookup_time = round((time.perf_counter() - t_start) * 1000.0, 1)
        except Exception as db_exc:
            print("Database error:", db_exc)
            
        print()
        print("=" * 50)
        print("PHASE 8E")
        print("FETCH CHILD PROFILE")
        print("=" * 50)
        
        if not child_profile:
            print("PHASE 8E FAILED")
            print("Reason")
            print("Child profile not found or inactive")
            print("=" * 50)
            return {
                "success": True,
                "phase": "8E",
                "phaseStatus": "FAILED",
                "recognized": False,
                "reason": "PROFILE_NOT_FOUND",
                "readyForAttendance": False,
                "childrenCompared": len(results),
                "comparisonTimeMs": proc_time_ms_8c
            }
        
        print("Recognition ............... SUCCESS")
        print("Child Found ............... YES")
        print(f"Child ID ................. {child_profile['childId']}")
        print(f"Registration No .......... {child_profile['registrationNumber']}")
        print(f"Name ..................... {child_profile['fullName']}")
        print(f"Age ...................... {child_profile['age']}")
        print(f"Gender ................... {child_profile['gender']}")
        print(f"Orphanage ............... {child_profile['orphanageName']}")
        print(f"Enrollment Status ........ {child_profile['status']}")
        print("Ready For Attendance ..... YES")
        print(f"Database Lookup Time ..... {db_lookup_time} ms")
        print("PHASE 8E STATUS .......... PASSED")
        print("=" * 50)

        return {
            "success": True,
            "phase": "8E",
            "phaseStatus": "PASSED",
            "recognized": True,
            "recognitionStatus": "RECOGNIZED",
            "child": child_profile,
            "bestSimilarity": best_sim,
            "secondBestSimilarity": second_best_sim,
            "similarityGap": sim_gap,
            "confidenceLevel": confidence,
            "readyForAttendance": True,
            "childrenCompared": len(results),
            "comparisonTimeMs": proc_time_ms_8c
        }
'''

old_return_recognized = r'return \{\s*"success": True,\s*"phase": "8D",\s*"phaseStatus": "PASSED",\s*"recognized": True,\s*"recognitionStatus": "RECOGNIZED",\s*"childId": best_match,\s*"bestSimilarity": best_sim,\s*"secondBestSimilarity": second_best_sim,\s*"similarityGap": sim_gap,\s*"confidenceLevel": confidence,\s*"readyForAttendance": True,\s*"childrenCompared": len\(results\),\s*"comparisonTimeMs": proc_time_ms_8c\s*\}'

content = re.sub(old_return_recognized, new_return_recognized, content)

with open('ai_microservice/main.py', 'w', encoding='utf-8') as f:
    f.write(content)