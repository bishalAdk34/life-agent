import uuid
from datetime import datetime, timezone

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.db.session import Base
from app.deps import get_db, get_current_user_id
from app.main import app


# In-memory SQLite for tests
SQLALCHEMY_DATABASE_URL = "sqlite:///:memory:"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


@pytest.fixture
def db_session():
    """Create tables and yield a session, then drop tables.

    Note: Skips 'routines' table which uses PostgreSQL ARRAY type unsupported in SQLite.
    """
    # Get all tables except routines (uses PostgreSQL ARRAY)
    tables_to_create = [
        t for t in Base.metadata.sorted_tables if t.name != "routines"
    ]
    for table in tables_to_create:
        table.create(bind=engine, checkfirst=True)

    session = TestingSessionLocal()
    try:
        yield session
    finally:
        session.close()
        for table in reversed(tables_to_create):
            table.drop(bind=engine, checkfirst=True)


@pytest.fixture
def test_user_id() -> uuid.UUID:
    """Fixed user ID for tests."""
    return uuid.UUID("12345678-1234-1234-1234-123456789abc")


@pytest.fixture
def client(db_session, test_user_id):
    """Test client with overridden dependencies."""
    def override_get_db():
        try:
            yield db_session
        finally:
            pass

    def override_get_current_user_id():
        return test_user_id

    app.dependency_overrides[get_db] = override_get_db
    app.dependency_overrides[get_current_user_id] = override_get_current_user_id

    with TestClient(app) as c:
        yield c

    app.dependency_overrides.clear()
