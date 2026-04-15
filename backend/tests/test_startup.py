from app.config import Settings
from app import startup as startup_module


class DummySessionContext:
    def __init__(self, session):
        self._session = session

    def __enter__(self):
        return self._session

    def __exit__(self, exc_type, exc, tb):
        return False


class DummySessionFactory:
    def __init__(self, session):
        self._session = session

    def __call__(self):
        return DummySessionContext(self._session)


def test_run_startup_bootstrap_skips_worker_env(monkeypatch):
    settings = Settings(env='worker')
    called = {'create_all': False, 'seed': False}

    monkeypatch.setattr(startup_module, 'initialize_database_schema', lambda _settings: called.__setitem__('create_all', True))
    monkeypatch.setattr(startup_module, 'seed_application_data', lambda _settings: called.__setitem__('seed', True))

    ran = startup_module.run_startup_bootstrap(settings)

    assert ran is False
    assert called == {'create_all': False, 'seed': False}


def test_run_startup_bootstrap_initializes_schema_and_seed(monkeypatch):
    settings = Settings()
    calls: list[tuple[str, object]] = []
    session = object()

    def fake_get_engine(app_settings):
        calls.append(('get_engine', app_settings))
        return 'engine'

    def fake_create_all(*, bind):
        calls.append(('create_all', bind))

    def fake_get_session_factory(app_settings):
        calls.append(('get_session_factory', app_settings))
        return DummySessionFactory(session)

    def fake_seed_database(db, app_settings):
        calls.append(('seed_database', db))
        calls.append(('seed_settings', app_settings))

    monkeypatch.setattr(startup_module, 'get_engine', fake_get_engine)
    monkeypatch.setattr(startup_module.Base.metadata, 'create_all', fake_create_all)
    monkeypatch.setattr(startup_module, 'get_session_factory', fake_get_session_factory)
    monkeypatch.setattr(startup_module, 'seed_database', fake_seed_database)

    ran = startup_module.run_startup_bootstrap(settings)

    assert ran is True
    assert calls == [
        ('get_engine', settings),
        ('create_all', 'engine'),
        ('get_session_factory', settings),
        ('seed_database', session),
        ('seed_settings', settings),
    ]
