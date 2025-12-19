import pytest


@pytest.fixture(scope="session", autouse=True)
def django_db_setup(django_db_setup, django_db_blocker):
    with django_db_blocker.unblock():
        from ppg_incidents.vector_store import init_vector_table
        from ppg_incidents.fts_store import init_fts_table
        
        init_vector_table()
        init_fts_table()


@pytest.fixture(autouse=True)
def reset_db_connections():
    yield
    import ppg_incidents.vector_store as vector_store
    import ppg_incidents.fts_store as fts_store
    
    if vector_store._connection:
        vector_store._connection.close()
        vector_store._connection = None
    if fts_store._connection:
        fts_store._connection.close()
        fts_store._connection = None

