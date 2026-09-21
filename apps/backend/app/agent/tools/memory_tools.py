import uuid
from typing import Any

from sqlalchemy.orm import Session

from app.agent.providers.base import ToolDeclaration
from app.models.observation import ObservationKind
from app.services import memory_service

RECORD_OBSERVATION = ToolDeclaration(
    name="record_observation",
    description=(
        "Remember a fact or preference about the user for future "
        "personalization. Use kind='explicit' when the user directly states "
        "something about themselves (e.g. 'I love hiking'). Use "
        "kind='derived' when you infer a pattern yourself from their "
        "behavior, and include a confidence 0-1 and a source note."
    ),
    parameters={
        "type": "object",
        "properties": {
            "text": {
                "type": "string",
                "description": "The fact to remember, phrased plainly (e.g. 'Loves hiking').",
            },
            "kind": {"type": "string", "enum": ["explicit", "derived"]},
            "confidence": {
                "type": "number",
                "description": "0-1 confidence, only for kind='derived'.",
            },
            "source": {
                "type": "string",
                "description": "Brief note on where this came from, only for kind='derived'.",
            },
        },
        "required": ["text", "kind"],
    },
)


def handle_record_observation(
    db: Session, user_id: uuid.UUID, args: dict[str, Any]
) -> dict:
    observation = memory_service.create_observation(
        db,
        user_id,
        kind=ObservationKind(args["kind"]),
        text=args["text"],
        source=args.get("source"),
        confidence=args.get("confidence"),
    )
    return {
        "observation_id": str(observation.id),
        "kind": observation.kind.value,
        "text": observation.text,
    }
