import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.agent.loop import handle_message
from app.agent.providers.base import LLMProvider
from app.agent.providers.gemini import GeminiProvider
from app.deps import get_current_user_id, get_db
from app.models.conversation import Conversation, ConversationMessage
from app.schemas.chat import ChatRequest, ChatResponse, ConversationOut

router = APIRouter()


def get_llm_provider() -> LLMProvider:
    return GeminiProvider()


@router.post("/message", response_model=ChatResponse)
def send_message(
    payload: ChatRequest,
    user_id: uuid.UUID = Depends(get_current_user_id),
    db: Session = Depends(get_db),
    provider: LLMProvider = Depends(get_llm_provider),
) -> ChatResponse:
    conversation_id, reply = handle_message(
        db, provider, user_id, payload.message, payload.conversation_id
    )
    return ChatResponse(conversation_id=conversation_id, reply=reply)


@router.get("/conversations/{conversation_id}", response_model=ConversationOut)
def get_conversation(
    conversation_id: uuid.UUID,
    user_id: uuid.UUID = Depends(get_current_user_id),
    db: Session = Depends(get_db),
) -> Conversation:
    conversation = (
        db.query(Conversation)
        .filter(Conversation.id == conversation_id, Conversation.user_id == user_id)
        .first()
    )
    if conversation is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Conversation not found"
        )
    conversation.messages = (
        db.query(ConversationMessage)
        .filter(ConversationMessage.conversation_id == conversation.id)
        .order_by(ConversationMessage.created_at)
        .all()
    )
    return conversation
