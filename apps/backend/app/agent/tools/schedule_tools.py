import uuid
from datetime import date
from typing import Any

from sqlalchemy.orm import Session

from app.agent.providers.base import ToolDeclaration
from app.services import schedule_service

GET_FREE_TIME = ToolDeclaration(
    name="get_free_time",
    description=(
        "Get the user's free time intervals for a given day, based on their "
        "active routines. Use this to answer questions like 'am I free "
        "later' or 'when can I fit in X today'."
    ),
    parameters={
        "type": "object",
        "properties": {
            "date": {
                "type": "string",
                "description": "Date in YYYY-MM-DD format. Defaults to today if omitted.",
            }
        },
    },
)

GET_TASKS = ToolDeclaration(
    name="get_tasks",
    description="Get the user's tasks scheduled for a given day.",
    parameters={
        "type": "object",
        "properties": {
            "date": {
                "type": "string",
                "description": "Date in YYYY-MM-DD format. Defaults to today if omitted.",
            }
        },
    },
)


def _parse_date(args: dict[str, Any]) -> date:
    raw = args.get("date")
    if raw:
        return date.fromisoformat(raw)
    return date.today()


def handle_get_free_time(db: Session, user_id: uuid.UUID, args: dict[str, Any]) -> dict:
    day = _parse_date(args)
    free_time = schedule_service.get_free_time_for_day(db, user_id, day)
    return {
        "date": day.isoformat(),
        "free_time": [
            {"start": start.strftime("%H:%M"), "end": end.strftime("%H:%M")}
            for start, end in free_time
        ],
    }


def handle_get_tasks(db: Session, user_id: uuid.UUID, args: dict[str, Any]) -> dict:
    day = _parse_date(args)
    tasks = schedule_service.get_tasks_for_day(db, user_id, day)
    return {
        "date": day.isoformat(),
        "tasks": [
            {
                "id": str(t.id),
                "title": t.title,
                "status": t.status.value,
                "scheduled_for": t.scheduled_for.isoformat(),
            }
            for t in tasks
        ],
    }
