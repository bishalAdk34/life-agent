import uuid
from datetime import datetime, timezone
from decimal import Decimal
from typing import Any

from sqlalchemy.orm import Session

from app.agent.providers.base import ToolDeclaration
from app.services import expense_service

RECORD_EXPENSE = ToolDeclaration(
    name="record_expense",
    description=(
        "Record a real expense the user made. Amounts and budget math are "
        "computed deterministically server-side — always report back the "
        "exact numbers returned by this tool, never estimate them yourself."
    ),
    parameters={
        "type": "object",
        "properties": {
            "amount": {"type": "number"},
            "category": {"type": "string", "description": "e.g. food, transport, rent"},
            "currency": {"type": "string", "description": "Defaults to USD."},
            "description": {"type": "string"},
        },
        "required": ["amount", "category"],
    },
)

GET_BUDGET_STATUS = ToolDeclaration(
    name="get_budget_status",
    description=(
        "Get the user's current spending vs. budget for a category (or "
        "overall if category omitted). All numbers are computed "
        "server-side — report them exactly, never estimate."
    ),
    parameters={
        "type": "object",
        "properties": {
            "category": {
                "type": "string",
                "description": "Omit for the overall (all-category) budget.",
            }
        },
    },
)


def _budget_dict_to_json(status: dict) -> dict:
    out = dict(status)
    for key in ("spent", "limit", "remaining"):
        if key in out and isinstance(out[key], Decimal):
            out[key] = float(out[key])
    return out


def handle_record_expense(db: Session, user_id: uuid.UUID, args: dict[str, Any]) -> dict:
    expense = expense_service.create_expense(
        db,
        user_id,
        amount=Decimal(str(args["amount"])),
        currency=args.get("currency", "USD"),
        category=args["category"],
        description=args.get("description"),
        occurred_at=datetime.now(timezone.utc),
    )
    category_budget = expense_service.get_budget_status(db, user_id, args["category"])
    overall_budget = expense_service.get_budget_status(db, user_id, None)
    return {
        "expense": {
            "id": str(expense.id),
            "amount": float(expense.amount),
            "currency": expense.currency,
            "category": expense.category,
        },
        "category_budget": _budget_dict_to_json(category_budget),
        "overall_budget": _budget_dict_to_json(overall_budget),
    }


def handle_get_budget_status(
    db: Session, user_id: uuid.UUID, args: dict[str, Any]
) -> dict:
    status = expense_service.get_budget_status(db, user_id, args.get("category"))
    return _budget_dict_to_json(status)
