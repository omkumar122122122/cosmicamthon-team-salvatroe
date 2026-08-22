"""
repositories/parent_repository.py
───────────────────────────────────────────────────────────────────────────────
Data access layer for parent records — queries Neon PostgreSQL.
"""

from typing import Optional

from app.database import fetch_one


async def get_parent_by_id(parent_id: str) -> Optional[dict]:
    """
    Fetch parent profile by ID from the Neon PostgreSQL database.
    Returns a flat dict of label → value pairs or None if not found.
    """
    row = await fetch_one(
        """
        SELECT
            u."firstName" || ' ' || u."lastName" AS "Parent Name",
            p."id" AS "Parent ID",
            p."kycStatus" AS "KYC Status",
            p."kycApprovedAt" AS "KYC Date",
            p."trustScore" AS "Trust Score",
            p."verificationStatus" AS "Background Check",
            p."annualIncome" AS "Annual Income",
            p."occupation" AS "Occupation",
            p."maritalStatus" AS "Marital Status",
            p."houseOwnership" AS "House Ownership",
            u."phone" AS "Contact",
            u."email" AS "Email",
            p."isActive" AS "Is Active",
            p."trustScoreBreakdown" AS "Trust Score Breakdown"
        FROM parents p
        INNER JOIN users u ON u.id = p."userId"
        WHERE p.id = $1 OR u."email" = $1
        LIMIT 1
        """,
        parent_id,
    )
    if not row:
        return None

    # Format trust score as "85 / 100"
    trust_score = row.get("Trust Score")
    if trust_score is not None:
        row["Trust Score"] = f"{trust_score} / 100"

    # Map enum values to human-readable labels
    kyc_map = {"PENDING": "Pending", "SUBMITTED": "Submitted", "UNDER_REVIEW": "Under Review", "APPROVED": "Verified", "REJECTED": "Rejected"}
    row["KYC Status"] = kyc_map.get(row.get("KYC Status"), row.get("KYC Status"))

    return row


async def get_kyc_status(parent_id: str) -> Optional[dict]:
    """
    Fetch KYC verification status for a parent from Neon PostgreSQL.
    """
    row = await fetch_one(
        """
        SELECT
            p."kycStatus" AS "KYC Status",
            p."kycSubmittedAt" AS "Submitted At",
            p."kycApprovedAt" AS "Approved At",
            p."kycRejectionReason" AS "Rejection Reason"
        FROM parents p
        INNER JOIN users u ON u.id = p."userId"
        WHERE p.id = $1 OR u."email" = $1
        LIMIT 1
        """,
        parent_id,
    )
    if not row:
        return None

    # Map enum values to human-readable labels
    kyc_map = {"PENDING": "Pending", "SUBMITTED": "Submitted", "UNDER_REVIEW": "Under Review", "APPROVED": "Verified", "REJECTED": "Rejected"}
    row["KYC Status"] = kyc_map.get(row.get("KYC Status"), row.get("KYC Status"))

    return row