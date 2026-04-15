from sqlalchemy.orm import Session

from .my_page_data_repository import get_my_page


def read_my_page_entry(db: Session, user_id: str, is_admin: bool):
    return get_my_page(db, user_id, is_admin)
