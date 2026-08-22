"""
repositories/child_repository.py
───────────────────────────────────────────────────────────────────────────────
Data access layer for child records — queries Neon PostgreSQL.
"""

from typing import Optional

from app.database import fetch_one, fetch_all


async def get_child_by_id(child_id: str) -> Optional[dict]:
    """
    Fetch child profile by ID from the Neon PostgreSQL database.
    Returns a flat dict of label → value pairs or None if not found.
    """
    row = await fetch_one(
        """
        SELECT
            c."firstName" || ' ' || COALESCE(c."lastName", '') AS "Child Name",
            c."childCode" AS "Child ID",
            FLOOR(DATE_PART('year', AGE(COALESCE(c."dateOfBirth", CURRENT_DATE)))) AS "Age",
            c."gender" AS "Gender",
            c."bloodGroup" AS "Blood Group",
            o."name" AS "Orphanage",
            c."healthStatus" AS "Health Status",
            c."currentStatus" AS "Current Status",
            c."isAdoptable" AS "Is Adoptable",
            c."photo" AS "Photo",
            c."admissionDate" AS "Admission Date"
        FROM children c
        LEFT JOIN orphanages o ON o.id = c."orphanageId"
        WHERE c.id = $1 OR c."childCode" = $1
        LIMIT 1
        """,
        child_id,
    )
    if not row:
        return None

    # Compute age label if dateOfBirth exists
    age = row.get("Age")
    row["Age"] = f"{age} years" if age is not None else "Unknown"

    # Map enum values to human-readable labels where useful
    gender_map = {"MALE": "Male", "FEMALE": "Female", "OTHER": "Other", "UNKNOWN": "Unknown"}
    row["Gender"] = gender_map.get(row.get("Gender"), row.get("Gender"))

    return row


async def get_child_history(child_id: str) -> list[dict]:
    """
    Fetch historical records for a child (attendance, health, education).
    """
    return await fetch_all(
        """
        SELECT
            a."date" AS "Date",
            a."status" AS "Status",
            a."activity" AS "Activity",
            a."remarks" AS "Remarks"
        FROM attendance_records a
        INNER JOIN children c ON c.id = a."childId"
        WHERE c.id = $1 OR c."childCode" = $1
        ORDER BY a."date" DESC
        LIMIT 20
        """,
        child_id,
    )