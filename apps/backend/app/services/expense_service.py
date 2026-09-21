import uuid
from datetime import date, datetime, time, timedelta
from decimal import Decimal

from sqlalchemy.orm import Session

from app.models.budget import Budget, BudgetPeriod
from app.models.expense import Expense


def compute_period_bounds(period: str, reference: date) -> tuple[date, date]:
    """Return the (start, end) inclusive date bounds for a budget period."""
    if period == "daily":
        return (reference, reference)
    if period == "weekly":
        start = reference - timedelta(days=reference.weekday())
        end = start + timedelta(days=6)
        return (start, end)
    if period == "monthly":
        start = reference.replace(day=1)
        if start.month == 12:
            next_month = start.replace(year=start.year + 1, month=1)
        else:
            next_month = start.replace(month=start.month + 1)
        end = next_month - timedelta(days=1)
        return (start, end)
    raise ValueError(f"Unknown period: {period}")


def compute_budget_summary(spent: Decimal, limit: Decimal) -> dict:
    """Pure budget math: remaining, percent used, exceeded. No LLM involved."""
    remaining = limit - spent
    pct_used = float(spent / limit * 100) if limit != 0 else 0.0
    return {
        "spent": spent,
        "limit": limit,
        "remaining": remaining,
        "pct_used": round(pct_used, 1),
        "exceeded": spent > limit,
    }


def _category_filter(category: str | None):
    return Expense.category.is_(None) if category is None else Expense.category == category


def _budget_category_filter(category: str | None):
    return Budget.category.is_(None) if category is None else Budget.category == category


def create_expense(
    db: Session,
    user_id: uuid.UUID,
    amount: Decimal,
    currency: str,
    category: str,
    description: str | None,
    occurred_at: datetime,
) -> Expense:
    expense = Expense(
        user_id=user_id,
        amount=amount,
        currency=currency,
        category=category,
        description=description,
        occurred_at=occurred_at,
    )
    db.add(expense)
    db.commit()
    db.refresh(expense)
    return expense


def get_expenses_in_range(
    db: Session,
    user_id: uuid.UUID,
    start: date,
    end: date,
    category: str | None = None,
) -> list[Expense]:
    range_start = datetime.combine(start, time.min)
    range_end = datetime.combine(end, time.max)
    query = db.query(Expense).filter(
        Expense.user_id == user_id,
        Expense.occurred_at >= range_start,
        Expense.occurred_at <= range_end,
    )
    if category is not None:
        query = query.filter(Expense.category == category)
    return query.order_by(Expense.occurred_at.desc()).all()


def upsert_budget(
    db: Session,
    user_id: uuid.UUID,
    category: str | None,
    period: BudgetPeriod,
    amount_limit: Decimal,
) -> Budget:
    budget = (
        db.query(Budget)
        .filter(
            Budget.user_id == user_id,
            _budget_category_filter(category),
            Budget.period == period,
        )
        .first()
    )
    if budget is None:
        budget = Budget(
            user_id=user_id, category=category, period=period, amount_limit=amount_limit
        )
        db.add(budget)
    else:
        budget.amount_limit = amount_limit
    db.commit()
    db.refresh(budget)
    return budget


def get_budget_status(db: Session, user_id: uuid.UUID, category: str | None) -> dict:
    budget = (
        db.query(Budget)
        .filter(Budget.user_id == user_id, _budget_category_filter(category))
        .first()
    )
    if budget is None:
        return {"has_budget": False, "category": category}

    start, end = compute_period_bounds(budget.period.value, date.today())
    expenses = get_expenses_in_range(db, user_id, start, end, category=category)
    spent = sum((e.amount for e in expenses), Decimal("0"))
    summary = compute_budget_summary(spent, budget.amount_limit)
    return {
        "has_budget": True,
        "category": category,
        "period": budget.period.value,
        "start": start.isoformat(),
        "end": end.isoformat(),
        **summary,
    }
