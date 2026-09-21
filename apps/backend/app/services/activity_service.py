import uuid
from datetime import datetime, timezone

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.activity import Activity, ActivitySource
from app.models.suggestion import Suggestion, SuggestionStatus


def get_recent_activities(
    db: Session, user_id: uuid.UUID, limit: int = 20
) -> list[Activity]:
    return (
        db.query(Activity)
        .filter(Activity.user_id == user_id)
        .order_by(Activity.occurred_at.desc())
        .limit(limit)
        .all()
    )


def create_activity(
    db: Session,
    user_id: uuid.UUID,
    title: str,
    category: str,
    duration_minutes: int | None,
    occurred_at: datetime,
    source: ActivitySource = ActivitySource.manual,
) -> Activity:
    activity = Activity(
        user_id=user_id,
        title=title,
        category=category,
        duration_minutes=duration_minutes,
        occurred_at=occurred_at,
        source=source,
    )
    db.add(activity)
    db.commit()
    db.refresh(activity)
    return activity


def create_suggestion(
    db: Session,
    user_id: uuid.UUID,
    activity_title: str,
    category: str,
    duration_minutes: int | None,
    reasoning: str,
) -> Suggestion:
    suggestion = Suggestion(
        user_id=user_id,
        activity_title=activity_title,
        category=category,
        duration_minutes=duration_minutes,
        reasoning=reasoning,
    )
    db.add(suggestion)
    db.commit()
    db.refresh(suggestion)
    return suggestion


def respond_to_suggestion(
    db: Session, user_id: uuid.UUID, suggestion_id: uuid.UUID, accepted: bool
) -> Suggestion:
    suggestion = (
        db.query(Suggestion)
        .filter(Suggestion.id == suggestion_id, Suggestion.user_id == user_id)
        .first()
    )
    if suggestion is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Suggestion not found"
        )

    suggestion.status = (
        SuggestionStatus.accepted if accepted else SuggestionStatus.rejected
    )
    suggestion.responded_at = datetime.now(timezone.utc)

    if accepted:
        db.add(
            Activity(
                user_id=user_id,
                title=suggestion.activity_title,
                category=suggestion.category,
                duration_minutes=suggestion.duration_minutes,
                occurred_at=suggestion.responded_at,
                source=ActivitySource.suggested,
            )
        )

    db.commit()
    db.refresh(suggestion)
    return suggestion
