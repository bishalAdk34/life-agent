import uuid
from datetime import datetime, timezone

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.agent.context_builder import build_context
from app.agent.providers.base import LLMProvider, Turn
from app.agent.tools.registry import TOOL_REGISTRY
from app.models.conversation import Conversation, ConversationMessage, MessageRole

SYSTEM_INSTRUCTION = (
    "You are Life Agent, a helpful personal assistant. Respond concisely and "
    "conversationally. Use the available tools to look up or modify the "
    "user's real tasks and schedule instead of guessing — never invent task "
    "or schedule details you did not get from a tool. When the user states "
    "an explicit fact or preference about themselves (e.g. 'I love hiking'), "
    "call record_observation with kind='explicit' to remember it. You may "
    "also record kind='derived' observations when you notice a pattern "
    "yourself, with a confidence and source note."
)

MAX_TOOL_ROUNDS = 5


def _get_or_create_conversation(
    db: Session, user_id: uuid.UUID, conversation_id: uuid.UUID | None
) -> Conversation:
    if conversation_id is None:
        conversation = Conversation(user_id=user_id)
        db.add(conversation)
        db.flush()
        return conversation

    conversation = (
        db.query(Conversation)
        .filter(Conversation.id == conversation_id, Conversation.user_id == user_id)
        .first()
    )
    if conversation is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Conversation not found"
        )
    return conversation


def handle_message(
    db: Session,
    provider: LLMProvider,
    user_id: uuid.UUID,
    message: str,
    conversation_id: uuid.UUID | None,
) -> tuple[uuid.UUID, str]:
    conversation = _get_or_create_conversation(db, user_id, conversation_id)

    history = (
        db.query(ConversationMessage)
        .filter(ConversationMessage.conversation_id == conversation.id)
        .order_by(ConversationMessage.created_at)
        .all()
    )

    turns = [
        Turn(role=m.role.value, text=m.content)
        for m in history
        if m.role in (MessageRole.user, MessageRole.assistant)
    ]
    turns.append(Turn(role="user", text=message))

    db.add(
        ConversationMessage(
            conversation_id=conversation.id, role=MessageRole.user, content=message
        )
    )
    db.commit()

    tool_declarations = [t.declaration for t in TOOL_REGISTRY.values()]

    context = build_context(db, user_id)
    system_instruction = (
        f"{SYSTEM_INSTRUCTION}\n\n{context}" if context else SYSTEM_INSTRUCTION
    )

    final_text = "Sorry, I couldn't complete that request."
    for _ in range(MAX_TOOL_ROUNDS):
        response = provider.generate(
            turns, tools=tool_declarations, system_instruction=system_instruction
        )
        if not response.tool_calls:
            final_text = response.text or ""
            break

        turns.append(
            Turn(role="assistant", tool_calls=response.tool_calls, raw=response.raw)
        )
        for call in response.tool_calls:
            tool = TOOL_REGISTRY.get(call.name)
            if tool is None:
                result = {"error": f"unknown tool '{call.name}'"}
            else:
                try:
                    result = tool.handler(db, user_id, call.args)
                except Exception as exc:
                    db.rollback()
                    result = {"error": f"tool '{call.name}' failed: {exc}"}
            turns.append(
                Turn(role="tool", tool_name=call.name, tool_response=result)
            )

    db.add(
        ConversationMessage(
            conversation_id=conversation.id,
            role=MessageRole.assistant,
            content=final_text,
        )
    )
    conversation.last_message_at = datetime.now(timezone.utc)

    db.commit()
    return conversation.id, final_text
