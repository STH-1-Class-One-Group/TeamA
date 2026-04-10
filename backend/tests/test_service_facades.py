from app.config import Settings
from app.services import bootstrap_service, my_page_service, place_service, review_service, stamp_service


def test_bootstrap_service_passes_none_for_anonymous_user(monkeypatch):
    sentinel = {"places": [], "festivals": []}

    def fake_read_bootstrap_bundle(db, user_id):
        assert db == "db-session"
        assert user_id is None
        return sentinel

    monkeypatch.setattr(bootstrap_service, "read_bootstrap_bundle", fake_read_bootstrap_bundle)

    assert bootstrap_service.read_bootstrap_service("db-session", None) == sentinel


def test_place_list_service_delegates_category(monkeypatch):
    sentinel = [{"id": "place-1"}]

    def fake_list_place_entries(db, category):
        assert db == "db-session"
        assert category == "food"
        return sentinel

    monkeypatch.setattr(place_service, "list_place_entries", fake_list_place_entries)

    assert place_service.read_places_service("db-session", "food") == sentinel


def test_my_page_service_passes_admin_flag_from_settings(monkeypatch):
    sentinel = {"reviews": []}
    session_user = type("SessionUserLike", (), {"id": "admin-user"})()

    def fake_read_my_page_entry(db, user_id, is_admin):
        assert db == "db-session"
        assert user_id == "admin-user"
        assert is_admin is True
        return sentinel

    monkeypatch.setattr(my_page_service, "read_my_page_entry", fake_read_my_page_entry)

    assert my_page_service.read_my_page_service(
        "db-session",
        session_user,
        Settings(admin_user_ids="admin-user"),
    ) == sentinel


def test_review_read_service_uses_none_when_session_user_missing(monkeypatch):
    sentinel = [{"id": "review-1"}]

    def fake_list_review_entries(db, *, place_id=None, user_id=None, current_user_id=None):
        assert db == "db-session"
        assert place_id == "place-1"
        assert user_id is None
        assert current_user_id is None
        return sentinel

    monkeypatch.setattr(review_service, "list_review_entries", fake_list_review_entries)

    assert review_service.read_reviews_service("db-session", "place-1", None, None) == sentinel


def test_stamp_read_service_passes_none_for_anonymous_user(monkeypatch):
    sentinel = {"stamps": []}

    def fake_read_stamp_state(db, user_id):
        assert db == "db-session"
        assert user_id is None
        return sentinel

    monkeypatch.setattr(stamp_service, "read_stamp_state", fake_read_stamp_state)

    assert stamp_service.read_stamps_service("db-session", None) == sentinel
