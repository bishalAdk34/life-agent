import uuid
from typing import Any

from sqlalchemy.orm import Session

from app.agent.providers.base import ToolDeclaration
from app.services import activity_service

GET_RECENT_ACTIVITY = ToolDeclaration(
    name="get_recent_activity",
    description="Get the user's most recent logged/suggested activities, to see what they've done lately and avoid repeating suggestions.",
    parameters={"type": "object", "properties": {}},
)

SUGGEST_ACTIVITY = ToolDeclaration(
    name="suggest_activity",
    description=(
        "Record a proposed activity suggestion for the user (e.g. when they "
        "say they're bored). Call this once you've decided what to suggest; "
        "then phrase the suggestion to the user in your reply. Do not tell "
        "the user it was accepted/rejected yet — that happens via "
        "record_suggestion_feedback once they respond."
    ),
    parameters={
        "type": "object",
        "properties": {
            "activity_title": {"type": "string"},
            "category": {
                "type": "string",
                "description": "e.g. relax, study, exercise, social",
            },
            "duration_minutes": {"type": "integer"},
            "reasoning": {
                "type": "string",
                "description": "Why this suggestion fits the user right now.",
            },
        },
        "required": ["activity_title", "category", "reasoning"],
    },
)

RECORD_SUGGESTION_FEEDBACK = ToolDeclaration(
    name="record_suggestion_feedback",
    description=(
        "Record whether the user accepted or rejected a previously made "
        "suggestion (from suggest_activity). If accepted, it is logged as a "
        "real activity."
    ),
    parameters={
        "type": "object",
        "properties": {
            "suggestion_id": {"type": "string"},
            "accepted": {"type": "boolean"},
        },
        "required": ["suggestion_id", "accepted"],
    },
)


def handle_get_recent_activity(
    db: Session, user_id: uuid.UUID, args: dict[str, Any]
) -> dict:
    activities = activity_service.get_recent_activities(db, user_id)
    return {
        "activities": [
            {
                "id": str(a.id),
                "title": a.title,
                "category": a.category,
                "duration_minutes": a.duration_minutes,
                "occurred_at": a.occurred_at.isoformat(),
                "source": a.source.value,
            }
            for a in activities
        ]
    }


def handle_suggest_activity(
    db: Session, user_id: uuid.UUID, args: dict[str, Any]
) -> dict:
    suggestion = activity_service.create_suggestion(
        db,
        user_id,
        activity_title=args["activity_title"],
        category=args["category"],
        duration_minutes=args.get("duration_minutes"),
        reasoning=args["reasoning"],
    )
    return {
        "suggestion_id": str(suggestion.id),
        "activity_title": suggestion.activity_title,
        "category": suggestion.category,
        "status": suggestion.status.value,
    }


def handle_record_suggestion_feedback(
    db: Session, user_id: uuid.UUID, args: dict[str, Any]
) -> dict:
    suggestion = activity_service.respond_to_suggestion(
        db,
        user_id,
        suggestion_id=uuid.UUID(args["suggestion_id"]),
        accepted=bool(args["accepted"]),
    )
    return {
        "suggestion_id": str(suggestion.id),
        "status": suggestion.status.value,
        "responded_at": suggestion.responded_at.isoformat()
        if suggestion.responded_at
        else None,
    }
