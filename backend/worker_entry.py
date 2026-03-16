from workers import WorkerEntrypoint, patch_env

import asgi

_worker_app = None


def get_worker_app(env):
    global _worker_app
    if _worker_app is None:
        patch_env(env)
        from app.config import get_settings

        get_settings.cache_clear()

        from app.main import app

        _worker_app = app
    return _worker_app


class Default(WorkerEntrypoint):
    async def fetch(self, request):
        return await asgi.fetch(get_worker_app(self.env), request, self.env)
