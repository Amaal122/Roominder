"""Configuration and defaults for the backend services."""

from functools import lru_cache
from pydantic import AliasChoices, Field
from pydantic_settings import BaseSettings, SettingsConfigDict
from dotenv import load_dotenv

load_dotenv()


class Settings(BaseSettings):
	"""Runtime settings for the API layer."""

	# Default to Postgres using psycopg3 driver. Accept both ROOMINDER_DATABASE_URL and DATABASE_URL.
	database_url: str = Field(
		default="postgresql+psycopg://postgres:postgres@localhost:5432/roominderdb",
		description="SQLAlchemy connection string",
		validation_alias=AliasChoices("ROOMINDER_DATABASE_URL", "DATABASE_URL"),
	)
	jwt_secret: str = Field(default="change-me", description="Secret key for JWT signing")
	jwt_algorithm: str = Field(default="HS256", description="JWT signing algorithm")
	access_token_expire_minutes: int = Field(default=60 * 24, description="Token lifetime in minutes")

	# Pydantic v2 settings metadata
	model_config = SettingsConfigDict(
		env_prefix="",
		case_sensitive=False,
		env_file=".env",
		env_file_encoding="utf-8",
	)


@lru_cache()
def get_settings() -> Settings:
	"""Return a cached settings instance so we do not re-parse env vars repeatedly."""

	return Settings()


settings = get_settings()
