from fastapi import FastAPI


def create_app() -> FastAPI:
    app = FastAPI(title="Life Agent API")

    @app.get("/health")
    def health() -> dict[str, str]:
        return {"status": "ok"}

    # Routers registered here as slices land, e.g.:
    # from app.api import auth
    # app.include_router(auth.router, prefix="/auth", tags=["auth"])

    return app


app = create_app()
