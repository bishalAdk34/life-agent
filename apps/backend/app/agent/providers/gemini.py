from google import genai
from google.genai import types

from app.agent.providers.base import LLMMessage, LLMProvider, LLMResponse
from app.core.config import settings

_MODEL = "gemini-3.6-flash"

# Gemini uses "model" instead of "assistant" for the assistant role.
_ROLE_MAP = {"user": "user", "assistant": "model"}


class GeminiProvider(LLMProvider):
    def __init__(self) -> None:
        self._client = genai.Client(api_key=settings.gemini_api_key)

    def generate(
        self, messages: list[LLMMessage], system_instruction: str | None = None
    ) -> LLMResponse:
        contents = [
            types.Content(
                role=_ROLE_MAP[m.role], parts=[types.Part.from_text(text=m.content)]
            )
            for m in messages
        ]
        config = (
            types.GenerateContentConfig(system_instruction=system_instruction)
            if system_instruction
            else None
        )
        response = self._client.models.generate_content(
            model=_MODEL, contents=contents, config=config
        )
        return LLMResponse(text=response.text or "")
