import struct
from logging import getLogger

import sqlite_vec
from django.db import connection

logger = getLogger(__name__)

EMBEDDING_DIM = 3072  # text-embedding-3-large output dimension


def _get_raw_connection():
    """Get Django's sqlite3 connection with sqlite-vec extension loaded."""
    connection.ensure_connection()
    conn = connection.connection
    conn.enable_load_extension(True)
    sqlite_vec.load(conn)
    conn.enable_load_extension(False)
    return conn


def _serialize_embedding(embedding: list[float]) -> bytes:
    """Serialize embedding list to binary format for sqlite-vec."""
    return struct.pack(f"{len(embedding)}f", *embedding)


def init_vector_table():
    """Initialize the vec_incidents virtual table."""
    conn = _get_raw_connection()
    cursor = conn.cursor()
    cursor.execute(f"""
        CREATE VIRTUAL TABLE IF NOT EXISTS vec_incidents USING vec0(
            incident_id INTEGER PRIMARY KEY,
            embedding float[{EMBEDDING_DIM}]
        )
    """)
    conn.commit()
    logger.info("Vector table vec_incidents initialized")


def upsert_embedding(incident_id: int, embedding: list[float]):
    """Insert or update embedding for an incident."""
    conn = _get_raw_connection()
    cursor = conn.cursor()
    
    # Delete existing embedding if present
    cursor.execute("DELETE FROM vec_incidents WHERE incident_id = ?", (incident_id,))
    
    # Insert new embedding
    embedding_blob = _serialize_embedding(embedding)
    cursor.execute(
        "INSERT INTO vec_incidents (incident_id, embedding) VALUES (?, ?)",
        (incident_id, embedding_blob)
    )
    conn.commit()
    logger.info(f"Stored embedding for incident {incident_id}")


def delete_embedding(incident_id: int):
    """Delete embedding for an incident."""
    conn = _get_raw_connection()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM vec_incidents WHERE incident_id = ?", (incident_id,))
    conn.commit()


def get_embedded_incident_ids() -> set[int]:
    """Get set of incident IDs that have embeddings."""
    conn = _get_raw_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT incident_id FROM vec_incidents")
    return {row[0] for row in cursor.fetchall()}


def search_similar(query_embedding: list[float], limit: int = 10, exclude_id: int | None = None) -> list[tuple[int, float]]:
    """
    Search for similar incidents by embedding.
    Returns list of (incident_id, distance) tuples, sorted by similarity.
    """
    conn = _get_raw_connection()
    cursor = conn.cursor()
    
    embedding_blob = _serialize_embedding(query_embedding)
    
    if exclude_id is not None:
        cursor.execute("""
            SELECT incident_id, distance
            FROM vec_incidents
            WHERE embedding MATCH ? AND k = ? AND incident_id != ?
            ORDER BY distance
        """, (embedding_blob, limit + 1, exclude_id))
    else:
        cursor.execute("""
            SELECT incident_id, distance
            FROM vec_incidents
            WHERE embedding MATCH ? AND k = ?
            ORDER BY distance
        """, (embedding_blob, limit))
    
    results = cursor.fetchall()
    return results[:limit]

