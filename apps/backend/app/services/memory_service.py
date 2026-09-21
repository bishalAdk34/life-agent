import uuid

from sqlalchemy.orm import Session

from app.models.observation import Observation, ObservationKind


def create_observation(
    db: Session,
    user_id: uuid.UUID,
    kind: ObservationKind,
    text: str,
    source: str | None = None,
    confidence: float | None = None,
) -> Observation:
    observation = Observation(
        user_id=user_id,
        kind=kind,
        text=text,
        source=source,
        confidence=confidence,
    )
    db.add(observation)
    db.commit()
    db.refresh(observation)
    return observation


def get_recent_observations(
    db: Session, user_id: uuid.UUID, limit: int = 20
) -> list[Observation]:
    return (
        db.query(Observation)
        .filter(Observation.user_id == user_id)
        .order_by(Observation.created_at.desc())
        .limit(limit)
        .all()
    )
