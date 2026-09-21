from dataclasses import dataclass

from app.agent.context_builder import format_observations


@dataclass
class FakeObservation:
    text: str


def test_format_observations_empty_returns_empty_string():
    assert format_observations([]) == ""


def test_format_observations_lists_each_fact():
    observations = [FakeObservation(text="Loves hiking"), FakeObservation(text="Vegetarian")]

    result = format_observations(observations)

    assert result.startswith("Known facts about the user (from memory):")
    assert "- Loves hiking" in result
    assert "- Vegetarian" in result
