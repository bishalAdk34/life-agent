import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict

from app.models.task import TaskStatus


class TaskCreate(BaseModel):
    title: str
    description: str | None = None
    scheduled_for: datetime
    routine_id: uuid.UUID | None = None


class TaskUpdate(BaseModel):
    title: str | None = None
    description: str | None = None
    scheduled_for: datetime | None = None


class TaskReschedule(BaseModel):
    scheduled_for: datetime


class TaskOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    routine_id: uuid.UUID | None
    title: str
    description: str | None
    status: TaskStatus
    scheduled_for: datetime
    completed_at: datetime | None
    created_at: datetime
    updated_at: datetime
