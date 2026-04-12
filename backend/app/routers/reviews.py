from fastapi import APIRouter, Depends, File, Query, Response, UploadFile, status
from sqlalchemy.orm import Session

from ..api_deps import get_session_user, require_session_user
from ..config import Settings, get_settings
from ..db import get_db
from ..models import CommentCreate, CommentOut, ReviewCreate, ReviewLikeResponse, ReviewOut, SessionUser, UploadResponse
from ..services.review_service import (
    create_comment_service,
    create_review_service,
    delete_comment_service,
    delete_review_service,
    read_review_comments_service,
    read_reviews_service,
    toggle_review_like_service,
)
from ..services.upload_service import upload_review_image_service

router = APIRouter(tags=["reviews"])


@router.get("/api/reviews", response_model=list[ReviewOut])
def read_reviews(
    place_id: str | None = Query(default=None, alias="placeId"),
    user_id: str | None = Query(default=None, alias="userId"),
    db: Session = Depends(get_db),
    session_user: SessionUser | None = Depends(get_session_user),
) -> list[ReviewOut]:
    return read_reviews_service(db, place_id, user_id, session_user)


@router.post("/api/reviews", response_model=ReviewOut, status_code=status.HTTP_201_CREATED)
def write_review(
    payload: ReviewCreate,
    db: Session = Depends(get_db),
    session_user: SessionUser = Depends(require_session_user),
) -> ReviewOut:
    return create_review_service(db, payload, session_user)


@router.delete("/api/reviews/{review_id}", status_code=status.HTTP_204_NO_CONTENT)
def remove_review(
    review_id: str,
    db: Session = Depends(get_db),
    session_user: SessionUser = Depends(require_session_user),
) -> Response:
    delete_review_service(db, review_id, session_user)
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.post("/api/reviews/{review_id}/like", response_model=ReviewLikeResponse)
def like_review(
    review_id: str,
    db: Session = Depends(get_db),
    session_user: SessionUser = Depends(require_session_user),
) -> ReviewLikeResponse:
    return toggle_review_like_service(db, review_id, session_user)


@router.get("/api/reviews/{review_id}/comments", response_model=list[CommentOut])
def read_review_comments(review_id: str, db: Session = Depends(get_db)) -> list[CommentOut]:
    return read_review_comments_service(db, review_id)


@router.post("/api/reviews/{review_id}/comments", response_model=list[CommentOut])
def write_review_comment(
    review_id: str,
    payload: CommentCreate,
    db: Session = Depends(get_db),
    session_user: SessionUser = Depends(require_session_user),
) -> list[CommentOut]:
    return create_comment_service(db, review_id, payload, session_user)


@router.delete("/api/reviews/{review_id}/comments/{comment_id}", response_model=list[CommentOut])
def remove_review_comment(
    review_id: str,
    comment_id: str,
    db: Session = Depends(get_db),
    session_user: SessionUser = Depends(require_session_user),
) -> list[CommentOut]:
    return delete_comment_service(db, review_id, comment_id, session_user)


@router.post("/api/reviews/upload", response_model=UploadResponse)
async def upload_review_image(
    file: UploadFile = File(...),
    thumbnail: UploadFile | None = File(default=None),
    session_user: SessionUser = Depends(require_session_user),
    app_settings: Settings = Depends(get_settings),
) -> UploadResponse:
    return await upload_review_image_service(file, thumbnail, session_user, app_settings)

