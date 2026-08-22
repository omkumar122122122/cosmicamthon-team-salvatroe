"""
services/retrieval_service.py
───────────────────────────────────────────────────────────────────────────────
RAG RETRIEVAL LAYER — orchestrates all data fetches before the AI call.

This layer sits between the route handler and Gemini.
It calls each repository in parallel, aggregates the results, and returns
a unified RetrievedContext object.

FUTURE VECTOR SEARCH:
  To add RAG with ChromaDB / FAISS / Pinecone:
  1. Embed the user message: vector = await embed(user_message)
  2. Query your vector store: docs = await vector_store.search(vector, top_k=5)
  3. Append doc chunks to the context returned here.
  No other file needs to change.
"""

import asyncio
import logging
from dataclasses import dataclass, field
from typing import Optional

from app.repositories.parent_repository     import get_parent_by_id, get_kyc_status
from app.repositories.child_repository      import get_child_by_id
from app.repositories.health_repository     import get_latest_health_report, get_health_history
from app.repositories.vaccination_repository import get_vaccination_schedule, get_overdue_vaccinations
from app.repositories.appointment_repository import get_upcoming_appointments

logger = logging.getLogger(__name__)


@dataclass
class RetrievedContext:
    """All data retrieved for a single chat request."""
    parent_profile:     Optional[dict]       = None
    kyc_status:         Optional[dict]       = None
    child_profile:      Optional[dict]       = None
    latest_health_report: Optional[dict]     = None
    health_history:     list[dict]           = field(default_factory=list)
    vaccination_schedule: Optional[list]     = None
    overdue_vaccinations: list[dict]         = field(default_factory=list)
    upcoming_appointments: list[dict]        = field(default_factory=list)
    # Future: vector_chunks: list[str]       = field(default_factory=list)


async def retrieve_all_context(
    parent_id: Optional[str],
    child_id:  Optional[str],
) -> RetrievedContext:
    """
    Runs all repository fetches concurrently and returns a RetrievedContext.

    Args:
        parent_id: Optional parent identifier
        child_id:  Optional child identifier

    Returns:
        RetrievedContext with all available data (None fields mean no data found)
    """
    ctx = RetrievedContext()

    # Build coroutine list — only fetch what we have IDs for
    tasks: list = []

    if parent_id:
        tasks.append(_fetch_parent_data(ctx, parent_id))
    if child_id:
        tasks.append(_fetch_child_data(ctx, child_id))

    # Run all fetches in parallel
    if tasks:
        await asyncio.gather(*tasks, return_exceptions=True)

    logger.debug(
        "Context retrieved — parent=%s child=%s health=%s vaccinations=%s appointments=%s",
        bool(ctx.parent_profile),
        bool(ctx.child_profile),
        bool(ctx.latest_health_report),
        bool(ctx.vaccination_schedule),
        len(ctx.upcoming_appointments),
    )

    return ctx


async def _fetch_parent_data(ctx: RetrievedContext, parent_id: str) -> None:
    """Fetch all parent-related data concurrently."""
    try:
        ctx.parent_profile, ctx.kyc_status, ctx.upcoming_appointments = await asyncio.gather(
            get_parent_by_id(parent_id),
            get_kyc_status(parent_id),
            get_upcoming_appointments(parent_id),
        )
    except Exception as exc:
        logger.warning("Parent data fetch error (parent_id=%s): %s", parent_id, exc)


async def _fetch_child_data(ctx: RetrievedContext, child_id: str) -> None:
    """Fetch all child-related data concurrently."""
    try:
        (
            ctx.child_profile,
            ctx.latest_health_report,
            ctx.health_history,
            ctx.vaccination_schedule,
            ctx.overdue_vaccinations,
        ) = await asyncio.gather(
            get_child_by_id(child_id),
            get_latest_health_report(child_id),
            get_health_history(child_id),
            get_vaccination_schedule(child_id),
            get_overdue_vaccinations(child_id),
        )
    except Exception as exc:
        logger.warning("Child data fetch error (child_id=%s): %s", child_id, exc)
