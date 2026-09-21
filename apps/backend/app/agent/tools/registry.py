import uuid
from collections.abc import Callable
from dataclasses import dataclass
from typing import Any

from sqlalchemy.orm import Session

from app.agent.providers.base import ToolDeclaration
from app.agent.tools.activity_tools import (
    GET_RECENT_ACTIVITY,
    RECORD_SUGGESTION_FEEDBACK,
    SUGGEST_ACTIVITY,
    handle_get_recent_activity,
    handle_record_suggestion_feedback,
    handle_suggest_activity,
)
from app.agent.tools.expense_tools import (
    GET_BUDGET_STATUS,
    RECORD_EXPENSE,
    handle_get_budget_status,
    handle_record_expense,
)
from app.agent.tools.memory_tools import RECORD_OBSERVATION, handle_record_observation
from app.agent.tools.profile_tools import GET_USER_INTERESTS, handle_get_user_interests
from app.agent.tools.schedule_tools import (
    GET_FREE_TIME,
    GET_TASKS,
    handle_get_free_time,
    handle_get_tasks,
)
from app.agent.tools.task_tools import CREATE_TASK, handle_create_task

ToolHandler = Callable[[Session, uuid.UUID, dict[str, Any]], dict[str, Any]]


@dataclass
class ToolDef:
    declaration: ToolDeclaration
    handler: ToolHandler


TOOL_REGISTRY: dict[str, ToolDef] = {
    "get_free_time": ToolDef(GET_FREE_TIME, handle_get_free_time),
    "get_tasks": ToolDef(GET_TASKS, handle_get_tasks),
    "create_task": ToolDef(CREATE_TASK, handle_create_task),
    "get_user_interests": ToolDef(GET_USER_INTERESTS, handle_get_user_interests),
    "get_recent_activity": ToolDef(GET_RECENT_ACTIVITY, handle_get_recent_activity),
    "suggest_activity": ToolDef(SUGGEST_ACTIVITY, handle_suggest_activity),
    "record_suggestion_feedback": ToolDef(
        RECORD_SUGGESTION_FEEDBACK, handle_record_suggestion_feedback
    ),
    "record_expense": ToolDef(RECORD_EXPENSE, handle_record_expense),
    "get_budget_status": ToolDef(GET_BUDGET_STATUS, handle_get_budget_status),
    "record_observation": ToolDef(RECORD_OBSERVATION, handle_record_observation),
}
