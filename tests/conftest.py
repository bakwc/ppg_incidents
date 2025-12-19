import pytest

import ppg_incidents.vector_store as vector_store


@pytest.fixture(scope="function", autouse=True)
def setup_virtual_tables(db):
    from ppg_incidents.vector_store import init_vector_table
    from ppg_incidents.fts_store import init_fts_table
    
    vector_store._vec_loaded = False
    init_vector_table()
    init_fts_table()
