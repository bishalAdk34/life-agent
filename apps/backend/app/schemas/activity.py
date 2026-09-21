import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict

from app.models.activity import ActivitySource


class ActivityCreate(BaseModel):
    title: str
    category: str
    duration_minutes: int | None = None
    occurred_at: datetime


class ActivityOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    title: str
    category: str
    duration_minutes: int | None
    occurred_at: datetime
    source: ActivitySource
    created_at: datetime
