"""Tests for tasks API endpoints."""
from datetime import datetime, timezone


def test_create_task_with_default_priority(client):
    """Tasks default to normal priority."""
    payload = {
        "title": "Test task",
        "scheduled_for": datetime.now(timezone.utc).isoformat(),
    }
    response = client.post("/tasks", json=payload)
    assert response.status_code == 201
    assert response.json()["priority"] == "normal"


def test_create_task_with_high_priority(client):
    """Create high priority task."""
    payload = {
        "title": "Urgent task",
        "scheduled_for": datetime.now(timezone.utc).isoformat(),
        "priority": "high",
    }
    response = client.post("/tasks", json=payload)
    assert response.status_code == 201
    assert response.json()["priority"] == "high"


def test_filter_tasks_by_priority(client):
    """Filter tasks by priority."""
    now = datetime.now(timezone.utc).isoformat()
    client.post("/tasks", json={"title": "Low", "scheduled_for": now, "priority": "low"})
    client.post("/tasks", json={"title": "High", "scheduled_for": now, "priority": "high"})
    client.post("/tasks", json={"title": "Normal", "scheduled_for": now, "priority": "normal"})

    # Filter high only
    response = client.get("/tasks?priority=high")
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 1
    assert data[0]["title"] == "High"


def test_update_task_priority(client):
    """Update task priority."""
    now = datetime.now(timezone.utc).isoformat()
    response = client.post("/tasks", json={"title": "Task", "scheduled_for": now})
    task_id = response.json()["id"]

    # Update to high
    response = client.put(f"/tasks/{task_id}", json={"priority": "high"})
    assert response.status_code == 200
    assert response.json()["priority"] == "high"


def test_delete_task(client):
    """Delete a task."""
    now = datetime.now(timezone.utc).isoformat()
    response = client.post("/tasks", json={"title": "To delete", "scheduled_for": now})
    task_id = response.json()["id"]

    response = client.delete(f"/tasks/{task_id}")
    assert response.status_code == 204

    # Verify gone
    response = client.get("/tasks")
    assert response.json() == []


def test_delete_task_not_found(client):
    """404 when deleting nonexistent task."""
    import uuid
    response = client.delete(f"/tasks/{uuid.uuid4()}")
    assert response.status_code == 404
