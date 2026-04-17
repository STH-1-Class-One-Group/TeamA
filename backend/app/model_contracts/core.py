"""Shared API model primitives and common type aliases."""

from __future__ import annotations

from typing import Literal

from pydantic import BaseModel, ConfigDict

CategoryType = Literal['landmark', 'food', 'cafe', 'night']
CategoryFilter = Literal['all', 'landmark', 'food', 'cafe', 'night']
CourseMood = Literal['전체', '데이트', '사진', '힐링', '비 오는 날']
ReviewMood = Literal['설렘', '친구랑', '혼자서', '야경 맛집']
ProviderKey = Literal['naver', 'kakao']
RouteSort = Literal['popular', 'latest']


class ApiModel(BaseModel):
    model_config = ConfigDict(populate_by_name=True, from_attributes=True)
