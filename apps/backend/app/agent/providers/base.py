from abc import ABC, abstractmethod
from dataclasses import dataclass


@dataclass
class LLMMessage:
    role: str  # "user" | "assistant"
    content: str


@dataclass
class LLMResponse:
    text: str


class LLMProvider(ABC):
    @abstractmethod
    def generate(
        self, messages: list[LLMMessage], system_instruction: str | None = None
    ) -> LLMResponse: ...
