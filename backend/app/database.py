"""
database.py — Async PostgreSQL connection pool (Neon Serverless Postgres)
"""
import asyncpg
from app.config import settings

_pool: asyncpg.Pool | None = None


async def init_db_pool() -> None:
    """Create a global asyncpg connection pool using the Neon DATABASE_URL."""
    global _pool
    if _pool is None:
        _pool = await asyncpg.create_pool(
            dsn=settings.DATABASE_URL,
            min_size=1,
            max_size=10,
            command_timeout=60,
        )


async def close_db_pool() -> None:
    """Close the global asyncpg connection pool."""
    global _pool
    if _pool is not None:
        await _pool.close()
        _pool = None


async def fetch_one(query: str, *args) -> dict | None:
    """Execute a SELECT query and return a single row as dict (or None)."""
    if _pool is None:
        await init_db_pool()
    async with _pool.acquire() as conn:
        row = await conn.fetchrow(query, *args)
        return dict(row) if row else None


async def fetch_all(query: str, *args) -> list[dict]:
    """Execute a SELECT query and return all rows as a list of dicts."""
    if _pool is None:
        await init_db_pool()
    async with _pool.acquire() as conn:
        rows = await conn.fetch(query, *args)
        return [dict(r) for r in rows]