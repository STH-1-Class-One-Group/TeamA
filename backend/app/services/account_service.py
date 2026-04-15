from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from ..repositories.account_data_repository import delete_account as delete_account_entry

ACCOUNT_NOT_FOUND_MESSAGE = "사용자 정보를 찾지 못했어요."


def _map_account_not_found(_: ValueError) -> HTTPException:
    return HTTPException(
        status_code=status.HTTP_404_NOT_FOUND,
        detail=ACCOUNT_NOT_FOUND_MESSAGE,
    )


def delete_my_account_service(db: Session, user_id: str) -> None:
    try:
        delete_account_entry(db, user_id)
    except ValueError as error:
        raise _map_account_not_found(error) from error
