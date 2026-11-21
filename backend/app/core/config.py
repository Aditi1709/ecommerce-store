from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    DATABASE_URL: str
    JWT_SECRET: str
    YOUPI_API_URL: str = "http://localhost:6100"
    YOUPI_API_KEY: str = ""
    YOUPI_WEBHOOK_SECRET: str = ""

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")


settings = Settings()