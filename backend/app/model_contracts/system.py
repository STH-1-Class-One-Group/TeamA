"""System and health API models."""

from __future__ import annotations

from pydantic import Field

from .core import ApiModel


class HealthResponse(ApiModel):
    status: str
    env: str
    database_url: str = Field(alias='databaseUrl')
    database_provider: str = Field(alias='databaseProvider')
    storage_backend: str = Field(alias='storageBackend')
    storage_path: str = Field(alias='storagePath')
    supabase_configured: bool = Field(alias='supabaseConfigured')
