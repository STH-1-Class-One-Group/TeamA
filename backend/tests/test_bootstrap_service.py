from app.services import bootstrap_service


def test_read_bootstrap_service_delegates_to_repository(monkeypatch):
    sentinel = {"places": [], "festivals": []}

    def fake_read_bootstrap_bundle(db, user_id):
        assert db == "db-session"
        assert user_id == "user-1"
        return sentinel

    monkeypatch.setattr(bootstrap_service, "read_bootstrap_bundle", fake_read_bootstrap_bundle)

    session_user = type("SessionUserLike", (), {"id": "user-1"})()

    assert bootstrap_service.read_bootstrap_service("db-session", session_user) == sentinel
