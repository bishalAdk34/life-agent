import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.deps import get_current_user_id, get_db
from app.models.routine import Routine
from app.schemas.routine import RoutineCreate, RoutineOut, RoutineUpdate

router = APIRouter()


@router.get("", response_model=list[RoutineOut])
def list_routines(
    user_id: uuid.UUID = Depends(get_current_user_id),
    db: Session = Depends(get_db),
) -> list[Routine]:
    return (
        db.query(Routine)
        .filter(Routine.user_id == user_id)
        .order_by(Routine.scheduled_time)
        .all()
    )


@router.post("", response_model=RoutineOut, status_code=status.HTTP_201_CREATED)
def create_routine(
    payload: RoutineCreate,
    user_id: uuid.UUID = Depends(get_current_user_id),
    db: Session = Depends(get_db),
) -> Routine:
    routine = Routine(user_id=user_id, **payload.model_dump())
    db.add(routine)
    db.commit()
    db.refresh(routine)
    return routine


@router.put("/{routine_id}", response_model=RoutineOut)
def update_routine(
    routine_id: uuid.UUID,
    payload: RoutineUpdate,
    user_id: uuid.UUID = Depends(get_current_user_id),
    db: Session = Depends(get_db),
) -> Routine:
    routine = (
        db.query(Routine)
        .filter(Routine.id == routine_id, Routine.user_id == user_id)
        .first()
    )
    if routine is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Routine not found"
        )

    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(routine, field, value)

    db.commit()
    db.refresh(routine)
    return routine
