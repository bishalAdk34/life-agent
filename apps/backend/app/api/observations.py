import uuid

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.deps import get_current_user_id, get_db
from app.models.observation import Observation, ObservationKind
from app.schemas.observation import ObservationCreate, ObservationOut
from app.services.memory_service import create_observation, get_recent_observations

router = APIRouter()


@router.get("", response_model=list[ObservationOut])
def list_observations(
    kind: ObservationKind | None = Query(None, description="Filter by observation kind"),
    limit: int = Query(20, ge=1, le=100, description="Max observations to return"),
    user_id: uuid.UUID = Depends(get_current_user_id),
    db: Session = Depends(get_db),
) -> list[Observation]:
    query = db.query(Observation).filter(Observation.user_id == user_id)
    if kind is not None:
        query = query.filter(Observation.kind == kind)
    return query.order_by(Observation.created_at.desc()).limit(limit).all()


@router.post("", response_model=ObservationOut, status_code=status.HTTP_201_CREATED)
def create_observation_endpoint(
    payload: ObservationCreate,
    user_id: uuid.UUID = Depends(get_current_user_id),
    db: Session = Depends(get_db),
) -> Observation:
    return create_observation(
        db=db,
        user_id=user_id,
        kind=payload.kind,
        text=payload.text,
        source=payload.source,
        confidence=payload.confidence,
    )


@router.delete("/{observation_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_observation(
    observation_id: uuid.UUID,
    user_id: uuid.UUID = Depends(get_current_user_id),
    db: Session = Depends(get_db),
) -> None:
    observation = (
        db.query(Observation)
        .filter(Observation.id == observation_id, Observation.user_id == user_id)
        .first()
    )
    if observation is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Observation not found"
        )
    db.delete(observation)
    db.commit()
