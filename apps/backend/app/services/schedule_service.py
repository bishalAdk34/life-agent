import uuid
from collections.abc import Iterable
from datetime import date, datetime, time, timedelta

from sqlalchemy.orm import Session

from app.models.routine import Routine
from app.models.task import Task

DEFAULT_DAY_START = time(7, 0)
DEFAULT_DAY_END = time(23, 0)


def _add_minutes(t: time, minutes: int) -> time:
    dt = datetime.combine(date.today(), t) + timedelta(minutes=minutes)
    return dt.time()


def compute_busy_intervals(
    blocks: Iterable[tuple[time, int]],
) -> list[tuple[time, time]]:
    """Merge (start_time, duration_minutes) blocks into sorted, non-overlapping intervals."""
    intervals = sorted(
        (start, _add_minutes(start, duration)) for start, duration in blocks
    )
    merged: list[tuple[time, time]] = []
    for start, end in intervals:
        if merged and start <= merged[-1][1]:
            merged[-1] = (merged[-1][0], max(merged[-1][1], end))
        else:
            merged.append((start, end))
    return merged


def compute_free_time(
    busy_intervals: list[tuple[time, time]],
    day_start: time = DEFAULT_DAY_START,
    day_end: time = DEFAULT_DAY_END,
) -> list[tuple[time, time]]:
    """Gaps within [day_start, day_end) not covered by busy_intervals.

    busy_intervals must be sorted and non-overlapping (see compute_busy_intervals).
    """
    free: list[tuple[time, time]] = []
    cursor = day_start
    for start, end in busy_intervals:
        if start > day_end:
            break
        if start > cursor:
            free.append((cursor, min(start, day_end)))
        cursor = max(cursor, end)
        if cursor >= day_end:
            break
    if cursor < day_end:
        free.append((cursor, day_end))
    return free


def get_routines_for_weekday(
    db: Session, user_id: uuid.UUID, weekday: int
) -> list[Routine]:
    return (
        db.query(Routine)
        .filter(
            Routine.user_id == user_id,
            Routine.is_active.is_(True),
            Routine.days_of_week.any(weekday),
        )
        .order_by(Routine.scheduled_time)
        .all()
    )


def get_tasks_for_day(db: Session, user_id: uuid.UUID, day: date) -> list[Task]:
    start = datetime.combine(day, time.min)
    end = datetime.combine(day, time.max)
    return (
        db.query(Task)
        .filter(
            Task.user_id == user_id,
            Task.scheduled_for >= start,
            Task.scheduled_for <= end,
        )
        .order_by(Task.scheduled_for)
        .all()
    )


def get_free_time_for_day(
    db: Session, user_id: uuid.UUID, day: date
) -> list[tuple[time, time]]:
    routines = get_routines_for_weekday(db, user_id, day.weekday())
    busy = compute_busy_intervals(
        (r.scheduled_time, r.duration_minutes) for r in routines
    )
    return compute_free_time(busy)


def get_today_schedule(
    db: Session, user_id: uuid.UUID, day: date
) -> dict[str, object]:
    routines = get_routines_for_weekday(db, user_id, day.weekday())
    tasks = get_tasks_for_day(db, user_id, day)
    busy = compute_busy_intervals((r.scheduled_time, r.duration_minutes) for r in routines)
    return {
        "routines": routines,
        "tasks": tasks,
        "free_time": compute_free_time(busy),
    }
