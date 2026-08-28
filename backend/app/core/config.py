from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    DATABASE_URL: str = "postgresql+asyncpg://postgres:postgres@localhost:5432/bhumimitra"
    JWT_SECRET_KEY: str = "supersecret"
    JWT_ALGORITHM: str = "HS256"
    JWT_EXPIRY_MINUTES: int = 480
    MINIO_ENDPOINT: str = "localhost:9000"
    MINIO_ACCESS_KEY: str = "minioadmin"
    MINIO_SECRET_KEY: str = "minioadmin"
    MINIO_BUCKET_NAME: str = "bhumimitra"
    FRONTEND_ORIGIN: str = "http://localhost:3000"

    ENABLE_BLOCKCHAIN_AUDIT: bool = False
    ENABLE_DELAY_PREDICTION: bool = False
    ENABLE_DOCUMENT_AI: bool = False
    ENABLE_NL_QUERY: bool = False
    ENABLE_ACQUISITION_TREE_UI: bool = False

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8")

settings = Settings()
