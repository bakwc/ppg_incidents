import pytest

import ppg_incidents.vector_store as vector_store
from ppg_incidents.fts_store import init_fts_table, _get_raw_connection as fts_get_conn
from ppg_incidents.vector_store import init_vector_table, _get_raw_connection as vec_get_conn


@pytest.fixture(scope="function", autouse=True)
def setup_virtual_tables(db):
    from incidents.models import Incident
    
    Incident.all_objects.all().delete()
    
    vector_store._vec_loaded = False
    init_vector_table()
    init_fts_table()
    
    conn = fts_get_conn()
    conn.execute("DELETE FROM fts_incidents")
    conn.commit()
    
    conn = vec_get_conn()
    conn.execute("DELETE FROM vec_incidents")
    conn.commit()
