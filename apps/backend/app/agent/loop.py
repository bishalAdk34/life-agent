import uuid
from datetime import datetime, timezone

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.agent.providers.base import LLMMessage, LLMProvider
from app.models.conversation import Conversation, ConversationMessage, MessageRole

SYSTEM_INSTRUCTION = (
    "You are Life Agent, a helpful personal assistant. Respond concisely and "
    "conversationally. You do not yet have access to the user's tasks, "
    "routines, or other data — do not claim to know anything about them."
)


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

    llm_messages = [
        LLMMessage(role=m.role.value, content=m.content)
        for m in history
        if m.role in (MessageRole.user, MessageRole.assistant)
    ]
    llm_messages.append(LLMMessage(role="user", content=message))

    db.add(
        ConversationMessage(
            conversation_id=conversation.id, role=MessageRole.user, content=message
        )
    )

    response = provider.generate(llm_messages, system_instruction=SYSTEM_INSTRUCTION)

    db.add(
        ConversationMessage(
            conversation_id=conversation.id,
            role=MessageRole.assistant,
            content=response.text,
        )
    )
    conversation.last_message_at = datetime.now(timezone.utc)

    db.commit()
    return conversation.id, response.text
