"""
repositories/appointment_repository.py
───────────────────────────────────────────────────────────────────────────────
Data access layer for appointments and visit requests — queries Neon PostgreSQL.
"""

from typing import Optional
from datetime import date, timedelta

from app.database import fetch_all


async def get_upcoming_appointments(parent_id: str) -> list[dict]:
    """
    Fetch upcoming appointments for a parent (visits, checkups, etc.)
    from the visit_requests table in Neon PostgreSQL.
    """
    rows = await fetch_all(
        """
        SELECT
            vr."visitDate" AS "date",
            vr."visitTime" AS "time",
            o."name" AS "location",
            vr."status" AS "status",
            vr."purpose" AS "notes"
        FROM visit_requests vr
        INNER JOIN parents p ON p.id = vr."parentId"
        INNER JOIN users u ON u.id = p."userId"
        INNER JOIN orphanages o ON o.id = vr."orphanageId"
        WHERE (vr."parentId" = $1 OR u."email" = $1)
          AND vr."visitDate" >= CURRENT_DATE
        ORDER BY vr."visitDate" ASC
        LIMIT 10
        """,
        parent_id,
    )
    result = []
    for r in rows:
        d = r.get("date")
        result.append({
            "type": "Orphanage Visit",
            "date": d.strftime("%Y-%m-%d") if d else None,
            "time": r.get("time"),
            "location": r.get("location"),
            "status": r.get("status", "Pending"),
            "notes": r.get("notes"),
        })
    return result


async def get_visit_history(parent_id: str) -> list[dict]:
    """
    Fetch previous visit records for a parent.
    """
    rows = await fetch_all(
        """
        SELECT
            vr."requestId" AS "id",
            o."name" AS "orphanage",
            vr."visitDate" AS "date",
            vr."status" AS "status",
            vr."purpose" AS "purpose"
        FROM visit_requests vr
        INNER JOIN parents p ON p.id = vr."parentId"
        INNER JOIN users u ON u.id = p."userId"
        INNER JOIN orphanages o ON o.id = vr."orphanageId"
        WHERE (vr."parentId" = $1 OR u."email" = $1)
          AND vr."visitDate" < CURRENT_DATE
        ORDER BY vr."visitDate" DESC
        LIMIT 10
        """,
        parent_id,
    )
    result = []
    for r in rows:
        d = r.get("date")
        result.append({
            "id": r.get("id"),
            "orphanage": r.get("orphanage"),
            "date": d.strftime("%Y-%m-%d") if d else None,
            "status": r.get("status"),
            "purpose": r.get("purpose"),
        })
    return result