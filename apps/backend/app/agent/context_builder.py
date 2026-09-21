import uuid
from typing import Protocol

from sqlalchemy.orm import Session

from app.services import memory_service


class HasText(Protocol):
    text: str


def format_observations(observations: list[HasText]) -> str:
    if not observations:
        return ""
    lines = "\n".join(f"- {o.text}" for o in observations)
    return f"Known facts about the user (from memory):\n{lines}"


def build_context(db: Session, user_id: uuid.UUID) -> str:
    observations = memory_service.get_recent_observations(db, user_id)
    return format_observations(observations)
