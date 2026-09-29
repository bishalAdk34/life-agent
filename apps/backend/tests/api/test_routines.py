"""Tests for routines API endpoints.

NOTE: Skipped - Routine model uses PostgreSQL ARRAY type which SQLite doesn't support.
These tests require a PostgreSQL instance.
"""
import pytest

pytestmark = pytest.mark.skip(reason="Routine uses PostgreSQL ARRAY, not supported in SQLite tests")


def test_create_routine(client):
    """Create a routine."""
    payload = {
        "title": "Morning jog",
        "scheduled_time": "07:00:00",
        "days_of_week": [1, 3, 5],
        "duration_minutes": 30,
    }
    response = client.post("/routines", json=payload)
    assert response.status_code == 201
    data = response.json()
    assert data["title"] == "Morning jog"
    assert data["days_of_week"] == [1, 3, 5]


def test_delete_routine(client):
    """Delete a routine."""
    payload = {
        "title": "To delete",
        "scheduled_time": "08:00:00",
        "days_of_week": [1],
        "duration_minutes": 15,
    }
    response = client.post("/routines", json=payload)
    routine_id = response.json()["id"]

    response = client.delete(f"/routines/{routine_id}")
    assert response.status_code == 204

    response = client.get("/routines")
    assert response.json() == []


def test_delete_routine_not_found(client):
    """404 when deleting nonexistent routine."""
    import uuid
    response = client.delete(f"/routines/{uuid.uuid4()}")
    assert response.status_code == 404
