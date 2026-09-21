import uuid
from datetime import datetime
from typing import Any

from sqlalchemy.orm import Session

from app.agent.providers.base import ToolDeclaration
from app.models.task import Task

CREATE_TASK = ToolDeclaration(
    name="create_task",
    description="Create a new task for the user at a specific date/time.",
    parameters={
        "type": "object",
        "properties": {
            "title": {"type": "string", "description": "Short title of the task."},
            "scheduled_for": {
                "type": "string",
                "description": "ISO 8601 datetime the task is scheduled for, e.g. 2026-09-22T10:00:00Z.",
            },
            "description": {
                "type": "string",
                "description": "Optional longer description.",
            },
        },
        "required": ["title", "scheduled_for"],
    },
)


def handle_create_task(db: Session, user_id: uuid.UUID, args: dict[str, Any]) -> dict:
    task = Task(
        user_id=user_id,
        title=args["title"],
        description=args.get("description"),
        scheduled_for=datetime.fromisoformat(args["scheduled_for"]),
    )
    db.add(task)
    db.commit()
    db.refresh(task)
    return {
        "id": str(task.id),
        "title": task.title,
        "scheduled_for": task.scheduled_for.isoformat(),
        "status": task.status.value,
    }
