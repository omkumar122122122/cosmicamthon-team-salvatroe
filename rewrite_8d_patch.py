import re

with open('ai_microservice/main.py', 'r', encoding='utf-8') as f:
    content = f.read()

# I need to add childrenCompared and comparisonTimeMs to the return blocks of Phase 8D
new_return_recognized = '''return {
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
            "readyForAttendance": True,
            "childrenCompared": len(results),
            "comparisonTimeMs": proc_time_ms_8c
        }'''

old_return_recognized = r'return \{\s*"success": True,\s*"phase": "8D",\s*"phaseStatus": "PASSED",\s*"recognized": True,\s*"recognitionStatus": "RECOGNIZED",\s*"childId": best_match,\s*"bestSimilarity": best_sim,\s*"secondBestSimilarity": second_best_sim,\s*"similarityGap": sim_gap,\s*"confidenceLevel": confidence,\s*"readyForAttendance": True\s*\}'

content = re.sub(old_return_recognized, new_return_recognized, content)

new_return_unknown = '''return {
            "success": True,
            "phase": "8D",
            "recognized": False,
            "recognitionStatus": "UNKNOWN_FACE",
            "bestSimilarity": best_sim,
            "readyForAttendance": False,
            "childrenCompared": len(results),
            "comparisonTimeMs": proc_time_ms_8c
        }'''

old_return_unknown = r'return \{\s*"success": True,\s*"phase": "8D",\s*"recognized": False,\s*"recognitionStatus": "UNKNOWN_FACE",\s*"bestSimilarity": best_sim,\s*"readyForAttendance": False\s*\}'

content = re.sub(old_return_unknown, new_return_unknown, content)

new_return_ambiguous = '''return {
            "success": True,
            "phase": "8D",
            "recognized": False,
            "recognitionStatus": "AMBIGUOUS_MATCH",
            "reason": reason,
            "readyForAttendance": False,
            "childrenCompared": len(results),
            "comparisonTimeMs": proc_time_ms_8c
        }'''

old_return_ambiguous = r'return \{\s*"success": True,\s*"phase": "8D",\s*"recognized": False,\s*"recognitionStatus": "AMBIGUOUS_MATCH",\s*"reason": reason,\s*"readyForAttendance": False\s*\}'

content = re.sub(old_return_ambiguous, new_return_ambiguous, content)

with open('ai_microservice/main.py', 'w', encoding='utf-8') as f:
    f.write(content)