"""Admin and import-related API models."""

from __future__ import annotations

from pydantic import Field

from .core import ApiModel, CategoryType


class PlaceVisibilityUpdate(ApiModel):
    is_active: bool | None = Field(default=None, alias='isActive')
    is_manual_override: bool | None = Field(default=None, alias='isManualOverride')


class AdminPlaceOut(ApiModel):
    id: str
    name: str
    district: str
    category: CategoryType
    is_active: bool = Field(alias='isActive')
    is_manual_override: bool = Field(alias='isManualOverride')
    review_count: int = Field(alias='reviewCount')
    updated_at: str = Field(alias='updatedAt')


class AdminSummaryResponse(ApiModel):
    user_count: int = Field(alias='userCount')
    place_count: int = Field(alias='placeCount')
    review_count: int = Field(alias='reviewCount')
    comment_count: int = Field(alias='commentCount')
    stamp_count: int = Field(alias='stampCount')
    source_ready: bool = Field(alias='sourceReady')
    places: list[AdminPlaceOut]


class UploadResponse(ApiModel):
    url: str
    file_name: str = Field(alias='fileName')
    content_type: str = Field(alias='contentType')
    thumbnail_url: str | None = Field(default=None, alias='thumbnailUrl')


class PublicImportResponse(ApiModel):
    imported_places: int = Field(alias='importedPlaces')
    imported_courses: int = Field(alias='importedCourses')
