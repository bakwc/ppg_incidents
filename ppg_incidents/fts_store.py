from logging import getLogger

from django.db import connection

logger = getLogger(__name__)


def _get_raw_connection():
    """Get Django's sqlite3 connection."""
    connection.ensure_connection()
    return connection.connection


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

    # Lowercase and wrap in quotes to escape special chars like colons
    query_escaped = '"' + query.lower().replace('"', '""') + '"'

    cursor.execute("""
        SELECT incident_id, bm25(fts_incidents)
        FROM fts_incidents
        WHERE content MATCH ?
        ORDER BY bm25(fts_incidents)
        LIMIT ?
    """, (query_escaped, limit))

    results = cursor.fetchall()
    return [int(row[0]) for row in results]

