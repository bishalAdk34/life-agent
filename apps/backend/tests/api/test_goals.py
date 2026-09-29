"""Tests for goals API endpoints."""


def test_create_goal_with_category_and_quarter(client):
    """Create goal with category and quarter."""
    payload = {
        "title": "Get promoted",
        "category": "Career",
        "quarter": "Q4 2026",
    }
    response = client.post("/goals", json=payload)
    assert response.status_code == 201
    data = response.json()
    assert data["category"] == "Career"
    assert data["quarter"] == "Q4 2026"


def test_create_goal_without_category_quarter(client):
    """Category and quarter are optional."""
    response = client.post("/goals", json={"title": "Simple goal"})
    assert response.status_code == 201
    data = response.json()
    assert data["category"] is None
    assert data["quarter"] is None


def test_filter_goals_by_category(client):
    """Filter goals by category."""
    client.post("/goals", json={"title": "Career goal", "category": "Career"})
    client.post("/goals", json={"title": "Health goal", "category": "Health"})

    response = client.get("/goals?category=Career")
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 1
    assert data[0]["category"] == "Career"


def test_filter_goals_by_quarter(client):
    """Filter goals by quarter."""
    client.post("/goals", json={"title": "Q1 goal", "quarter": "Q1 2026"})
    client.post("/goals", json={"title": "Q2 goal", "quarter": "Q2 2026"})

    response = client.get("/goals?quarter=Q1%202026")
    data = response.json()
    assert len(data) == 1
    assert data[0]["quarter"] == "Q1 2026"


def test_update_goal_category_quarter(client):
    """Update goal category and quarter."""
    response = client.post("/goals", json={"title": "Goal"})
    goal_id = response.json()["id"]

    response = client.put(f"/goals/{goal_id}", json={"category": "Wealth", "quarter": "Q3 2026"})
    assert response.status_code == 200
    data = response.json()
    assert data["category"] == "Wealth"
    assert data["quarter"] == "Q3 2026"


def test_delete_goal(client):
    """Delete a goal."""
    response = client.post("/goals", json={"title": "To delete"})
    goal_id = response.json()["id"]

    response = client.delete(f"/goals/{goal_id}")
    assert response.status_code == 204

    response = client.get("/goals")
    assert response.json() == []


def test_delete_goal_not_found(client):
    """404 when deleting nonexistent goal."""
    import uuid
    response = client.delete(f"/goals/{uuid.uuid4()}")
    assert response.status_code == 404
