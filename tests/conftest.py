import pytest


@pytest.fixture(scope="session", autouse=True)
def django_db_setup(django_db_setup, django_db_blocker):
    with django_db_blocker.unblock():
        from ppg_incidents.vector_store import init_vector_table
        from ppg_incidents.fts_store import init_fts_table
        
        init_vector_table()
        init_fts_table()

