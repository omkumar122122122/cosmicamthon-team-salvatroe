"""
repositories/health_repository.py
───────────────────────────────────────────────────────────────────────────────
Data access layer for child health records and reports — queries Neon PostgreSQL.
"""

from typing import Optional

from app.database import fetch_one, fetch_all


async def get_latest_health_report(child_id: str) -> Optional[dict]:
    """
    Fetch the most recent health report for a child from Neon PostgreSQL.
    """
    row = await fetch_one(
        """
        SELECT
            h."reportDate" AS "Report Date",
            h."reportedBy" AS "Doctor",
            h."diagnosis" AS "Diagnosis",
            h."findings" AS "Findings",
            h."prescription" AS "Treatment",
            h."healthStatus" AS "Health Status",
            h."followUpDate" AS "Next Checkup",
            h."followUpNotes" AS "Notes"
        FROM health_reports h
        INNER JOIN children c ON c.id = h."childId"
        WHERE c.id = $1 OR c."childCode" = $1
        ORDER BY h."reportDate" DESC
        LIMIT 1
        """,
        child_id,
    )
    if not row:
        return None

    # Format dates as readable strings
    for key in ("Report Date", "Next Checkup"):
        val = row.get(key)
        if val:
            row[key] = val.strftime("%d %b %Y")

    return row


async def get_health_history(child_id: str) -> list[dict]:
    """
    Fetch historical health records for a child (newest first).
    """
    rows = await fetch_all(
        """
        SELECT
            h."reportDate" AS "date",
            h."diagnosis" AS "diagnosis",
            h."reportedBy" AS "doctor",
            h."prescription" AS "treatment",
            h."healthStatus" AS "status"
        FROM health_reports h
        INNER JOIN children c ON c.id = h."childId"
        WHERE c.id = $1 OR c."childCode" = $1
        ORDER BY h."reportDate" DESC
        LIMIT 20
        """,
        child_id,
    )
    for r in rows:
        if r.get("date"):
            r["date"] = r["date"].strftime("%Y-%m-%d")
    return rows