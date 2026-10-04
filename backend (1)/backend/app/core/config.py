"""
Application settings, loaded from environment variables (or a local .env file
in development). Single source of configuration — nothing else in the app
should read os.environ directly.
"""

from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    PROJECT_NAME: str = "JalDrishti 2030 API"
    ENVIRONMENT: str = "local"
    API_V1_PREFIX: str = "/api/v1"

    DATABASE_URL: str = "postgresql+psycopg://localhost:5432/jaldrishti"

    # Comma-separated in the environment, e.g. "http://localhost:3000,https://example.com"
    CORS_ORIGINS: str = "http://localhost:3000"

    LOG_LEVEL: str = "INFO"

    @property
    def cors_origins_list(self) -> list[str]:
        return [origin.strip() for origin in self.CORS_ORIGINS.split(",") if origin.strip()]


@lru_cache
def get_settings() -> Settings:
    """Cached so Settings() is constructed once per process."""
    return Settings()
