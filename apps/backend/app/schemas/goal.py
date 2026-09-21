import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict

from app.models.goal import GoalStatus


class GoalCreate(BaseModel):
    title: str
    description: str | None = None


class GoalUpdate(BaseModel):
    title: str | None = None
    description: str | None = None
    status: GoalStatus | None = None


class GoalOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    title: str
    description: str | None
    status: GoalStatus
    created_at: datetime
    updated_at: datetime
