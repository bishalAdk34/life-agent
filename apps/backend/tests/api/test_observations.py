"""Tests for observations API endpoints."""


def test_list_observations_empty(client):
    """Empty list when no observations exist."""
    response = client.get("/observations")
    assert response.status_code == 200
    assert response.json() == []


def test_create_observation_explicit(client):
    """Create explicit observation."""
    payload = {"kind": "explicit", "text": "I prefer morning workouts"}
    response = client.post("/observations", json=payload)
    assert response.status_code == 201
    data = response.json()
    assert data["kind"] == "explicit"
    assert data["text"] == "I prefer morning workouts"
    assert data["source"] is None
    assert data["confidence"] is None


def test_create_observation_derived_with_confidence(client):
    """Create derived observation with confidence score."""
    payload = {
        "kind": "derived",
        "text": "User seems to exercise on weekdays",
        "source": "activity_patterns",
        "confidence": 0.85,
    }
    response = client.post("/observations", json=payload)
    assert response.status_code == 201
    data = response.json()
    assert data["kind"] == "derived"
    assert data["confidence"] == 0.85
    assert data["source"] == "activity_patterns"


def test_list_observations_filter_by_kind(client):
    """Filter observations by kind."""
    # Create one explicit, one derived
    client.post("/observations", json={"kind": "explicit", "text": "Fact 1"})
    client.post("/observations", json={"kind": "derived", "text": "Pattern 1"})

    # Filter explicit
    response = client.get("/observations?kind=explicit")
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 1
    assert data[0]["kind"] == "explicit"

    # Filter derived
    response = client.get("/observations?kind=derived")
    data = response.json()
    assert len(data) == 1
    assert data[0]["kind"] == "derived"


def test_delete_observation(client):
    """Delete an observation."""
    # Create
    response = client.post("/observations", json={"kind": "explicit", "text": "To delete"})
    obs_id = response.json()["id"]

    # Delete
    response = client.delete(f"/observations/{obs_id}")
    assert response.status_code == 204

    # Verify gone
    response = client.get("/observations")
    assert response.json() == []


def test_delete_observation_not_found(client):
    """404 when deleting nonexistent observation."""
    import uuid
    fake_id = str(uuid.uuid4())
    response = client.delete(f"/observations/{fake_id}")
    assert response.status_code == 404
