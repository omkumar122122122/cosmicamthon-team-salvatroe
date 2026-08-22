"""
repositories/vaccination_repository.py
───────────────────────────────────────────────────────────────────────────────
Data access layer for vaccination records — queries Neon PostgreSQL.
Vaccination data is stored in health_reports (vaccinationGiven / nextVaccinationDue).
"""

from datetime import date
from typing import Optional

from app.database import fetch_all


async def get_vaccination_schedule(child_id: str) -> Optional[list[dict]]:
    """
    Fetch the vaccination schedule for a child from health_reports in Neon PostgreSQL.
    """
    rows = await fetch_all(
        """
        SELECT
            h."vaccinationGiven" AS "vaccine",
            h."reportDate" AS "date_given",
            h."nextVaccinationDue" AS "next_due",
            h."vaccinationBatch" AS "batch"
        FROM health_reports h
        INNER JOIN children c ON c.id = h."childId"
        WHERE (c.id = $1 OR c."childCode" = $1)
          AND h."vaccinationGiven" IS NOT NULL
        ORDER BY h."reportDate" DESC
        """,
        child_id,
    )
    if not rows:
        return None

    today = date.today().isoformat()
    for r in rows:
        if r.get("date_given"):
            r["date_given"] = r["date_given"].strftime("%Y-%m-%d")
        if r.get("next_due"):
            r["next_due"] = r["next_due"].strftime("%Y-%m-%d")
        # Derive status
        next_due = r.get("next_due")
        if next_due is None:
            r["status"] = "Completed"
        elif next_due < today:
            r["status"] = "Overdue"
        else:
            r["status"] = "Pending"

    return rows


async def get_overdue_vaccinations(child_id: str) -> list[dict]:
    """
    Fetch only overdue vaccinations for a child.
    """
    schedule = await get_vaccination_schedule(child_id)
    if not schedule:
        return []
    return [v for v in schedule if v.get("status") == "Overdue"]