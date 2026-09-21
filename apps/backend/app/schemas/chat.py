import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict

from app.models.conversation import MessageRole


class ChatRequest(BaseModel):
    conversation_id: uuid.UUID | None = None
    message: str


class ChatResponse(BaseModel):
    conversation_id: uuid.UUID
    reply: str


class MessageOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    role: MessageRole
    content: str
    created_at: datetime


class ConversationOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    started_at: datetime
    last_message_at: datetime
    messages: list[MessageOut]
