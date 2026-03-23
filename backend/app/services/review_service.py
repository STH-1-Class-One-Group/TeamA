from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from ..models import CommentCreate, ReviewCreate, ReviewLikeResponse, ReviewOut, SessionUser
from ..repository_normalized import (
    create_comment,
    create_review,
    delete_comment,
    delete_review,
    get_review_comments,
    toggle_review_like,
)


def create_review_service(db: Session, payload: ReviewCreate, session_user: SessionUser) -> ReviewOut:
    try:
        return create_review(db, payload, session_user.id, session_user.nickname)
    except ValueError as error:
        detail = str(error)
        status_code = status.HTTP_400_BAD_REQUEST
        if "장소" in detail:
            status_code = status.HTTP_404_NOT_FOUND
        raise HTTPException(status_code=status_code, detail=detail) from error


def delete_review_service(db: Session, review_id: str, session_user: SessionUser) -> None:
    try:
        delete_review(db, review_id, session_user.id, is_admin=session_user.is_admin)
    except ValueError as error:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(error)) from error
    except PermissionError as error:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=str(error)) from error


def toggle_review_like_service(db: Session, review_id: str, session_user: SessionUser) -> ReviewLikeResponse:
    try:
        return toggle_review_like(db, review_id, session_user.id, session_user.nickname)
    except ValueError as error:
        detail = str(error)
        status_code = status.HTTP_400_BAD_REQUEST
        if "찾지 못" in detail:
            status_code = status.HTTP_404_NOT_FOUND
        raise HTTPException(status_code=status_code, detail=detail) from error


def read_review_comments_service(db: Session, review_id: str):
    try:
        return get_review_comments(db, review_id)
    except ValueError as error:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(error)) from error


def create_comment_service(db: Session, review_id: str, payload: CommentCreate, session_user: SessionUser):
    try:
        return create_comment(db, review_id, payload, session_user.id, session_user.nickname)
    except ValueError as error:
        detail = str(error)
        status_code = status.HTTP_400_BAD_REQUEST
        if "후기" in detail:
            status_code = status.HTTP_404_NOT_FOUND
        raise HTTPException(status_code=status_code, detail=detail) from error


def delete_comment_service(db: Session, review_id: str, comment_id: str, session_user: SessionUser):
    try:
        return delete_comment(db, review_id, comment_id, session_user.id, is_admin=session_user.is_admin)
    except ValueError as error:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(error)) from error
    except PermissionError as error:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=str(error)) from error
