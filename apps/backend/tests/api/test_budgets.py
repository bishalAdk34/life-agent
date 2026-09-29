"""Tests for budgets API endpoints."""


def test_set_budget(client):
    """Create/upsert a budget."""
    payload = {
        "category": "Food",
        "period": "monthly",
        "amount_limit": 500.0,
    }
    response = client.put("/budgets", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["category"] == "Food"
    assert data["period"] == "monthly"


def test_delete_budget(client):
    """Delete a budget."""
    # Create
    response = client.put("/budgets", json={
        "category": "Entertainment",
        "period": "weekly",
        "amount_limit": 100.0,
    })
    budget_id = response.json()["id"]

    # Delete
    response = client.delete(f"/budgets/{budget_id}")
    assert response.status_code == 204

    # Verify gone
    response = client.get("/budgets")
    assert response.json() == []


def test_delete_budget_not_found(client):
    """404 when deleting nonexistent budget."""
    import uuid
    response = client.delete(f"/budgets/{uuid.uuid4()}")
    assert response.status_code == 404
