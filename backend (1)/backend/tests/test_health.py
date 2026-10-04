def test_health_returns_ok_status(client):
    response = client.get("/api/v1/health")
    assert response.status_code == 200
    body = response.json()
    assert body["status"] == "ok"
    assert "database" in body


def test_root_points_at_docs(client):
    response = client.get("/")
    assert response.status_code == 200
    assert "docs" in response.json()
