from sqlalchemy import select
from sqlalchemy.orm import Session, joinedload

from ..db_models import Course, CoursePlace, MapPlace
from ..models import BootstrapResponse, CategoryFilter, CourseMood, CourseOut, PlaceOut
from ..repository_support import to_place_out
from .review_query_repository import list_reviews as list_reviews_entry
from .stamp_data_repository import get_stamps as get_stamps_entry


def to_course_out(course: Course) -> CourseOut:
    ordered_places = sorted(course.course_places, key=lambda item: item.stop_order)
    return CourseOut(
        id=course.slug,
        title=course.title,
        mood=course.mood,
        duration=course.duration,
        note=course.note,
        color=course.color,
        placeIds=[item.place.slug for item in ordered_places],
    )


def list_places(db: Session, category: CategoryFilter = "all") -> list[PlaceOut]:
    stmt = select(MapPlace).where(MapPlace.is_active.is_(True)).order_by(MapPlace.position_id.asc())
    if category != "all":
        stmt = stmt.where(MapPlace.category == category)
    return [to_place_out(place) for place in db.scalars(stmt).all()]


def get_place(db: Session, place_id: str) -> PlaceOut:
    place = db.scalars(select(MapPlace).where(MapPlace.slug == place_id, MapPlace.is_active.is_(True))).first()
    if not place:
        raise ValueError("장소를 찾을 수 없어요.")
    return to_place_out(place)


def list_courses(db: Session, mood: CourseMood | None = None) -> list[CourseOut]:
    stmt = (
        select(Course)
        .options(joinedload(Course.course_places).joinedload(CoursePlace.place))
        .order_by(Course.display_order.asc(), Course.course_id.asc())
    )
    if mood and mood != "전체":
        stmt = stmt.where(Course.mood == mood)
    return [to_course_out(course) for course in db.scalars(stmt).unique().all()]


def get_bootstrap(db: Session, user_id: str | None) -> BootstrapResponse:
    places = list_places(db)
    return BootstrapResponse(
        places=places,
        reviews=list_reviews_entry(db, current_user_id=user_id, include_comments=False),
        courses=list_courses(db),
        stamps=get_stamps_entry(db, user_id),
        hasRealData=bool(places),
    )

