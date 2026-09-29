import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict

from app.models.observation import ObservationKind


class ObservationCreate(BaseModel):
    kind: ObservationKind
    text: str
    source: str | None = None
    confidence: float | None = None


class ObservationOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    kind: ObservationKind
    text: str
    source: str | None
    confidence: float | None
    created_at: datetime
    updated_at: datetime
