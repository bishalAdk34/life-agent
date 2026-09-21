from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api import (
    activities,
    auth,
    budgets,
    chat,
    expenses,
    goals,
    interests,
    profile,
    routines,
    tasks,
    users,
)


def create_app() -> FastAPI:
    app = FastAPI(title="Life Agent API")

    # Dev-only: allow all origins so the Expo app (arbitrary LAN IP/port) can call the API.
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_methods=["*"],
        allow_headers=["*"],
    )

    @app.get("/health")
    def health() -> dict[str, str]:
        return {"status": "ok"}

    app.include_router(auth.router, prefix="/auth", tags=["auth"])
    app.include_router(users.router, prefix="/users", tags=["users"])
    app.include_router(profile.router, prefix="/profile", tags=["profile"])
    app.include_router(interests.router, prefix="/interests", tags=["interests"])
    app.include_router(goals.router, prefix="/goals", tags=["goals"])
    app.include_router(tasks.router, prefix="/tasks", tags=["tasks"])
    app.include_router(routines.router, prefix="/routines", tags=["routines"])
    app.include_router(chat.router, prefix="/chat", tags=["chat"])
    app.include_router(activities.router, prefix="/activities", tags=["activities"])
    app.include_router(expenses.router, prefix="/expenses", tags=["expenses"])
    app.include_router(budgets.router, prefix="/budgets", tags=["budgets"])

    return app


app = create_app()
