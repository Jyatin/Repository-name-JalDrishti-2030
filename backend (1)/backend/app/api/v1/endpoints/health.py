from fastapi import APIRouter

from app.core.config import get_settings
from app.core.database import database_is_reachable
from app.schemas.health import HealthResponse

router = APIRouter()
settings = get_settings()


@router.get("/health", response_model=HealthResponse)
def health() -> HealthResponse:
    """Liveness + database reachability. Never 500s on a DB outage — a down
    database is reported in the payload, not raised as a server error."""
    return HealthResponse(
        status="ok",
        environment=settings.ENVIRONMENT,
        database="ok" if database_is_reachable() else "unreachable",
    )
