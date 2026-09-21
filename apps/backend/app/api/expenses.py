import uuid
from datetime import date

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from app.deps import get_current_user_id, get_db
from app.models.expense import Expense
from app.schemas.expense import ExpenseCreate, ExpenseOut
from app.services import expense_service

router = APIRouter()


@router.get("", response_model=list[ExpenseOut])
def list_expenses(
    range: str | None = Query(None, description="daily | weekly | monthly"),
    user_id: uuid.UUID = Depends(get_current_user_id),
    db: Session = Depends(get_db),
) -> list[Expense]:
    if range is None:
        return (
            db.query(Expense)
            .filter(Expense.user_id == user_id)
            .order_by(Expense.occurred_at.desc())
            .all()
        )
    start, end = expense_service.compute_period_bounds(range, date.today())
    return expense_service.get_expenses_in_range(db, user_id, start, end)


@router.post("", response_model=ExpenseOut, status_code=status.HTTP_201_CREATED)
def create_expense(
    payload: ExpenseCreate,
    user_id: uuid.UUID = Depends(get_current_user_id),
    db: Session = Depends(get_db),
) -> Expense:
    return expense_service.create_expense(
        db,
        user_id,
        amount=payload.amount,
        currency=payload.currency,
        category=payload.category,
        description=payload.description,
        occurred_at=payload.occurred_at,
    )
