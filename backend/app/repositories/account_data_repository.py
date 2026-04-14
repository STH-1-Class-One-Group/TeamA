from sqlalchemy.orm import Session

from ..db_models import User


def delete_account(db: Session, user_id: str) -> None:
    user = db.get(User, user_id)
    if not user:
        raise ValueError("사용자 정보를 찾지 못했어요.")
    db.delete(user)
    db.commit()
