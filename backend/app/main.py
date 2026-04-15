"""JamIssue FastAPI 애플리케이션 진입점입니다."""

from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from starlette.middleware.sessions import SessionMiddleware

from .config import get_settings
from .public_event_api import router as public_event_router
from .routers.admin import router as admin_router
from .routers.auth import router as auth_router
from .routers.content import router as content_router
from .routers.my import router as my_router
from .routers.reviews import router as reviews_router
from .storage import (
    FileTooLargeError,
    InvalidFileTypeError,
    StorageConfigurationError,
    StorageUploadError,
    mount_storage_backend,
)
from .startup import run_startup_bootstrap

settings = get_settings()
app = FastAPI(
    title="JamIssue API",
    version="1.0.0",
    summary="JamIssue API server.",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.add_middleware(
    SessionMiddleware,
    secret_key=settings.session_secret,
    same_site="lax",
    https_only=settings.session_https,
    max_age=60 * 60,
)

mount_storage_backend(app, settings)

app.include_router(public_event_router)
app.include_router(auth_router)
app.include_router(content_router)
app.include_router(reviews_router)
app.include_router(my_router)
app.include_router(admin_router)


@app.exception_handler(InvalidFileTypeError)
async def handle_invalid_file_type(_: Request, exc: InvalidFileTypeError) -> JSONResponse:
    return JSONResponse(status_code=status.HTTP_400_BAD_REQUEST, content={"detail": str(exc)})


@app.exception_handler(FileTooLargeError)
async def handle_file_too_large(_: Request, exc: FileTooLargeError) -> JSONResponse:
    return JSONResponse(status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE, content={"detail": str(exc)})


@app.exception_handler(StorageConfigurationError)
@app.exception_handler(StorageUploadError)
async def handle_storage_errors(_: Request, exc: ValueError) -> JSONResponse:
    return JSONResponse(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, content={"detail": str(exc)})


@app.on_event("startup")
def on_startup() -> None:
    """로컬 개발 환경에서는 업로드 경로와 데이터베이스를 준비합니다."""

    run_startup_bootstrap(settings)
