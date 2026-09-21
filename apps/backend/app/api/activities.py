import uuid

from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.deps import get_current_user_id, get_db
from app.models.activity import Activity, ActivitySource
from app.schemas.activity import ActivityCreate, ActivityOut
from app.services import activity_service

router = APIRouter()


@router.get("/recent", response_model=list[ActivityOut])
def list_recent_activities(
    user_id: uuid.UUID = Depends(get_current_user_id),
    db: Session = Depends(get_db),
) -> list[Activity]:
    return activity_service.get_recent_activities(db, user_id)


@router.post("", response_model=ActivityOut, status_code=status.HTTP_201_CREATED)
def create_activity(
    payload: ActivityCreate,
    user_id: uuid.UUID = Depends(get_current_user_id),
    db: Session = Depends(get_db),
) -> Activity:
    return activity_service.create_activity(
        db,
        user_id,
        title=payload.title,
        category=payload.category,
        duration_minutes=payload.duration_minutes,
        occurred_at=payload.occurred_at,
        source=ActivitySource.manual,
    )
