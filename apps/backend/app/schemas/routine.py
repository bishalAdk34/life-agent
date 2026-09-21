import uuid
from datetime import datetime, time

from pydantic import BaseModel, ConfigDict, Field


class RoutineCreate(BaseModel):
    title: str
    description: str | None = None
    scheduled_time: time
    days_of_week: list[int] = Field(..., description="0=Monday .. 6=Sunday")
    duration_minutes: int


class RoutineUpdate(BaseModel):
    title: str | None = None
    description: str | None = None
    scheduled_time: time | None = None
    days_of_week: list[int] | None = None
    duration_minutes: int | None = None
    is_active: bool | None = None


class RoutineOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    title: str
    description: str | None
    scheduled_time: time
    days_of_week: list[int]
    duration_minutes: int
    is_active: bool
    created_at: datetime
    updated_at: datetime
