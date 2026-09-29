import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.deps import get_current_user_id, get_db
from app.models.budget import Budget
from app.schemas.budget import BudgetOut, BudgetSet
from app.services import expense_service

router = APIRouter()


@router.get("", response_model=list[BudgetOut])
def list_budgets(
    user_id: uuid.UUID = Depends(get_current_user_id),
    db: Session = Depends(get_db),
) -> list[Budget]:
    return db.query(Budget).filter(Budget.user_id == user_id).all()


@router.put("", response_model=BudgetOut)
def set_budget(
    payload: BudgetSet,
    user_id: uuid.UUID = Depends(get_current_user_id),
    db: Session = Depends(get_db),
) -> Budget:
    return expense_service.upsert_budget(
        db,
        user_id,
        category=payload.category,
        period=payload.period,
        amount_limit=payload.amount_limit,
    )


@router.delete("/{budget_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_budget(
    budget_id: uuid.UUID,
    user_id: uuid.UUID = Depends(get_current_user_id),
    db: Session = Depends(get_db),
) -> None:
    budget = (
        db.query(Budget)
        .filter(Budget.id == budget_id, Budget.user_id == user_id)
        .first()
    )
    if budget is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Budget not found"
        )
    db.delete(budget)
    db.commit()
