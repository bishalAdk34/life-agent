import uuid
from typing import Any

from sqlalchemy.orm import Session

from app.agent.providers.base import ToolDeclaration
from app.models.interest import Interest

GET_USER_INTERESTS = ToolDeclaration(
    name="get_user_interests",
    description="Get the user's stated interests/hobbies. Use this to ground activity suggestions in what the user actually likes.",
    parameters={"type": "object", "properties": {}},
)


def handle_get_user_interests(
    db: Session, user_id: uuid.UUID, args: dict[str, Any]
) -> dict:
    interests = (
        db.query(Interest)
        .filter(Interest.user_id == user_id)
        .order_by(Interest.created_at.desc())
        .all()
    )
    return {"interests": [i.label for i in interests]}
