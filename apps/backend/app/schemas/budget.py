import uuid
from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel, ConfigDict

from app.models.budget import BudgetPeriod


class BudgetSet(BaseModel):
    category: str | None = None  # null = overall budget
    period: BudgetPeriod
    amount_limit: Decimal


class BudgetOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    category: str | None
    period: BudgetPeriod
    amount_limit: Decimal
    created_at: datetime
    updated_at: datetime
