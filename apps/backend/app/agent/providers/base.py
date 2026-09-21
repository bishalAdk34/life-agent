from abc import ABC, abstractmethod
from dataclasses import dataclass, field
from typing import Any


@dataclass
class ToolCall:
    name: str
    args: dict[str, Any]


@dataclass
class ToolDeclaration:
    name: str
    description: str
    parameters: dict[str, Any]  # JSON schema (OBJECT type)


@dataclass
class Turn:
    """One turn in the working conversation passed to the provider.

    - role="user": plain user text (`text` set)
    - role="assistant": either plain text (`text` set) or a request to call
      tools (`tool_calls` set)
    - role="tool": the result of executing one tool call (`tool_name` +
      `tool_response` set)
    """

    role: str
    text: str | None = None
    tool_calls: list[ToolCall] = field(default_factory=list)
    tool_name: str | None = None
    tool_response: dict[str, Any] | None = None
    # Opaque provider-specific representation of this turn (e.g. the raw
    # model Content, which may carry provider metadata like Gemini's
    # thought_signature that must be replayed verbatim on the next call).
    raw: Any = None


@dataclass
class LLMResponse:
    text: str | None
    tool_calls: list[ToolCall]
    raw: Any = None


class LLMProvider(ABC):
    @abstractmethod
    def generate(
        self,
        turns: list[Turn],
        tools: list[ToolDeclaration] | None = None,
        system_instruction: str | None = None,
    ) -> LLMResponse: ...
