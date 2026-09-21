import uuid
from datetime import date, datetime, time, timezone

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.deps import get_current_user_id, get_db
from app.models.task import Task, TaskStatus
from app.schemas.task import TaskCreate, TaskOut, TaskReschedule, TaskUpdate

router = APIRouter()


def _get_owned_task(db: Session, task_id: uuid.UUID, user_id: uuid.UUID) -> Task:
    task = db.query(Task).filter(Task.id == task_id, Task.user_id == user_id).first()
    if task is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Task not found"
        )
    return task


@router.get("", response_model=list[TaskOut])
def list_tasks(
    date_filter: date | None = Query(None, alias="date"),
    user_id: uuid.UUID = Depends(get_current_user_id),
    db: Session = Depends(get_db),
) -> list[Task]:
    query = db.query(Task).filter(Task.user_id == user_id)
    if date_filter is not None:
        start = datetime.combine(date_filter, time.min, tzinfo=timezone.utc)
        end = datetime.combine(date_filter, time.max, tzinfo=timezone.utc)
        query = query.filter(Task.scheduled_for >= start, Task.scheduled_for <= end)
    return query.order_by(Task.scheduled_for).all()


@router.post("", response_model=TaskOut, status_code=status.HTTP_201_CREATED)
def create_task(
    payload: TaskCreate,
    user_id: uuid.UUID = Depends(get_current_user_id),
    db: Session = Depends(get_db),
) -> Task:
    task = Task(user_id=user_id, **payload.model_dump())
    db.add(task)
    db.commit()
    db.refresh(task)
    return task


@router.put("/{task_id}", response_model=TaskOut)
def update_task(
    task_id: uuid.UUID,
    payload: TaskUpdate,
    user_id: uuid.UUID = Depends(get_current_user_id),
    db: Session = Depends(get_db),
) -> Task:
    task = _get_owned_task(db, task_id, user_id)

    if payload.title is not None:
        task.title = payload.title
    if payload.description is not None:
        task.description = payload.description
    if payload.scheduled_for is not None:
        task.scheduled_for = payload.scheduled_for

    db.commit()
    db.refresh(task)
    return task


@router.post("/{task_id}/complete", response_model=TaskOut)
def complete_task(
    task_id: uuid.UUID,
    user_id: uuid.UUID = Depends(get_current_user_id),
    db: Session = Depends(get_db),
) -> Task:
    task = _get_owned_task(db, task_id, user_id)
    task.status = TaskStatus.completed
    task.completed_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(task)
    return task


@router.post("/{task_id}/reschedule", response_model=TaskOut)
def reschedule_task(
    task_id: uuid.UUID,
    payload: TaskReschedule,
    user_id: uuid.UUID = Depends(get_current_user_id),
    db: Session = Depends(get_db),
) -> Task:
    task = _get_owned_task(db, task_id, user_id)
    task.scheduled_for = payload.scheduled_for
    task.status = TaskStatus.rescheduled
    db.commit()
    db.refresh(task)
    return task
