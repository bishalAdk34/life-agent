from google import genai
from google.genai import types

from app.agent.providers.base import (
    LLMProvider,
    LLMResponse,
    ToolCall,
    ToolDeclaration,
    Turn,
)
from app.core.config import settings

_MODEL = "gemini-3.6-flash"


def _turn_to_content(turn: Turn) -> types.Content:
    if turn.role == "user":
        return types.Content(role="user", parts=[types.Part.from_text(text=turn.text or "")])
    if turn.role == "assistant":
        if turn.tool_calls:
            # Gemini requires the original Content (with thought_signature
            # on each function_call part) to be replayed verbatim.
            if turn.raw is not None:
                return turn.raw
            parts = [
                types.Part.from_function_call(name=tc.name, args=tc.args)
                for tc in turn.tool_calls
            ]
            return types.Content(role="model", parts=parts)
        return types.Content(
            role="model", parts=[types.Part.from_text(text=turn.text or "")]
        )
    if turn.role == "tool":
        return types.Content(
            role="user",
            parts=[
                types.Part.from_function_response(
                    name=turn.tool_name or "", response=turn.tool_response or {}
                )
            ],
        )
    raise ValueError(f"Unknown turn role: {turn.role}")


class GeminiProvider(LLMProvider):
    def __init__(self) -> None:
        self._client = genai.Client(api_key=settings.gemini_api_key)

    def generate(
        self,
        turns: list[Turn],
        tools: list[ToolDeclaration] | None = None,
        system_instruction: str | None = None,
    ) -> LLMResponse:
        contents = [_turn_to_content(t) for t in turns]

        gemini_tools = None
        if tools:
            gemini_tools = [
                types.Tool(
                    function_declarations=[
                        types.FunctionDeclaration(
                            name=t.name,
                            description=t.description,
                            parameters_json_schema=t.parameters,
                        )
                        for t in tools
                    ]
                )
            ]

        config = types.GenerateContentConfig(
            system_instruction=system_instruction,
            tools=gemini_tools,
        )

        response = self._client.models.generate_content(
            model=_MODEL, contents=contents, config=config
        )

        calls = response.function_calls
        if calls:
            raw_content = response.candidates[0].content
            return LLMResponse(
                text=None,
                tool_calls=[ToolCall(name=c.name, args=dict(c.args or {})) for c in calls],
                raw=raw_content,
            )
        return LLMResponse(text=response.text or "", tool_calls=[])
