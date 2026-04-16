from sqlalchemy.orm import Session

from ..models import CourseMood
from ..repositories.content_query_repository import list_courses as list_course_entries


def read_courses_service(db: Session, mood: CourseMood | None):
    return list_course_entries(db, mood)
