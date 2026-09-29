import uuid

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.deps import get_current_user_id, get_db
from app.models.goal import Goal
from app.schemas.goal import GoalCreate, GoalOut, GoalUpdate

router = APIRouter()


@router.get("", response_model=list[GoalOut])
def list_goals(
    category: str | None = Query(None),
    quarter: str | None = Query(None),
    user_id: uuid.UUID = Depends(get_current_user_id),
    db: Session = Depends(get_db),
) -> list[Goal]:
    query = db.query(Goal).filter(Goal.user_id == user_id)
    if category is not None:
        query = query.filter(Goal.category == category)
    if quarter is not None:
        query = query.filter(Goal.quarter == quarter)
    return query.order_by(Goal.created_at.desc()).all()


@router.post("", response_model=GoalOut, status_code=status.HTTP_201_CREATED)
def create_goal(
    payload: GoalCreate,
    user_id: uuid.UUID = Depends(get_current_user_id),
    db: Session = Depends(get_db),
) -> Goal:
    goal = Goal(user_id=user_id, **payload.model_dump())
    db.add(goal)
    db.commit()
    db.refresh(goal)
    return goal


@router.put("/{goal_id}", response_model=GoalOut)
def update_goal(
    goal_id: uuid.UUID,
    payload: GoalUpdate,
    user_id: uuid.UUID = Depends(get_current_user_id),
    db: Session = Depends(get_db),
) -> Goal:
    goal = (
        db.query(Goal).filter(Goal.id == goal_id, Goal.user_id == user_id).first()
    )
    if goal is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Goal not found"
        )

    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(goal, field, value)

    db.commit()
    db.refresh(goal)
    return goal


@router.delete("/{goal_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_goal(
    goal_id: uuid.UUID,
    user_id: uuid.UUID = Depends(get_current_user_id),
    db: Session = Depends(get_db),
) -> None:
    goal = (
        db.query(Goal).filter(Goal.id == goal_id, Goal.user_id == user_id).first()
    )
    if goal is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Goal not found"
        )
    db.delete(goal)
    db.commit()
