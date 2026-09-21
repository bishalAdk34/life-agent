import uuid
from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel, ConfigDict


class ExpenseCreate(BaseModel):
    amount: Decimal
    currency: str = "USD"
    category: str
    description: str | None = None
    occurred_at: datetime


class ExpenseOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    amount: Decimal
    currency: str
    category: str
    description: str | None
    occurred_at: datetime
    created_at: datetime
