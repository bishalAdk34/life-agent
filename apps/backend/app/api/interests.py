import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.deps import get_current_user_id, get_db
from app.models.interest import Interest
from app.schemas.interest import InterestCreate, InterestOut

router = APIRouter()


@router.get("", response_model=list[InterestOut])
def list_interests(
    user_id: uuid.UUID = Depends(get_current_user_id),
    db: Session = Depends(get_db),
) -> list[Interest]:
    return (
        db.query(Interest)
        .filter(Interest.user_id == user_id)
        .order_by(Interest.created_at.desc())
        .all()
    )


@router.post("", response_model=InterestOut, status_code=status.HTTP_201_CREATED)
def create_interest(
    payload: InterestCreate,
    user_id: uuid.UUID = Depends(get_current_user_id),
    db: Session = Depends(get_db),
) -> Interest:
    interest = Interest(user_id=user_id, label=payload.label)
    db.add(interest)
    db.commit()
    db.refresh(interest)
    return interest


@router.delete("/{interest_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_interest(
    interest_id: uuid.UUID,
    user_id: uuid.UUID = Depends(get_current_user_id),
    db: Session = Depends(get_db),
) -> None:
    interest = (
        db.query(Interest)
        .filter(Interest.id == interest_id, Interest.user_id == user_id)
        .first()
    )
    if interest is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Interest not found"
        )
    db.delete(interest)
    db.commit()
