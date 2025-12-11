import sqlite3
from logging import getLogger

from django.conf import settings

logger = getLogger(__name__)

_connection: sqlite3.Connection | None = None


def _get_raw_connection() -> sqlite3.Connection:
    """Get sqlite3 connection."""
    global _connection
    if _connection is not None:
        return _connection

    db_path = settings.DATABASES["default"]["NAME"]
    _connection = sqlite3.connect(db_path, check_same_thread=False)
    return _connection


def init_fts_table():
    """Initialize the FTS5 virtual table with trigram tokenizer."""
    conn = _get_raw_connection()
    cursor = conn.cursor()
    cursor.execute("""
        CREATE VIRTUAL TABLE IF NOT EXISTS fts_incidents USING fts5(
            incident_id,
            content,
            tokenize='trigram'
        )
    """)
    conn.commit()
    logger.info("FTS table fts_incidents initialized")


def upsert_fts(incident_id: int, content: str):
    """Insert or update FTS content for an incident."""
    conn = _get_raw_connection()
    cursor = conn.cursor()

    # Delete existing entry if present
    cursor.execute("DELETE FROM fts_incidents WHERE incident_id = ?", (str(incident_id),))

    # Insert new content (lowercased)
    cursor.execute(
        "INSERT INTO fts_incidents (incident_id, content) VALUES (?, ?)",
        (str(incident_id), content.lower())
    )
    conn.commit()
    logger.info(f"Stored FTS content for incident {incident_id}")


def delete_fts(incident_id: int):
    """Delete FTS content for an incident."""
    conn = _get_raw_connection()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM fts_incidents WHERE incident_id = ?", (str(incident_id),))
    conn.commit()


def get_indexed_incident_ids() -> set[int]:
    """Get set of incident IDs that have FTS content."""
    conn = _get_raw_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT incident_id FROM fts_incidents")
    return {int(row[0]) for row in cursor.fetchall()}


def search_fts(query: str, limit: int = 100) -> list[int]:
    """
    Search for incidents by text.
    Returns list of incident IDs ranked by relevance.
    """
    conn = _get_raw_connection()
    cursor = conn.cursor()

    # Lowercase query for case-insensitive matching
    query_lower = query.lower()

    cursor.execute("""
        SELECT incident_id, bm25(fts_incidents)
        FROM fts_incidents
        WHERE content MATCH ?
        ORDER BY bm25(fts_incidents)
        LIMIT ?
    """, (query_lower, limit))

    results = cursor.fetchall()
    return [int(row[0]) for row in results]

