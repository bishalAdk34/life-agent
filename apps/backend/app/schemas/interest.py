import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict


class InterestCreate(BaseModel):
    label: str


class InterestOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    label: str
    created_at: datetime
