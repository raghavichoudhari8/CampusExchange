from typing import List
from pydantic_settings import BaseSettings, SettingsConfigDict
import os
import base64

class Settings(BaseSettings):
    ENVIRONMENT: str = "development"
    PORT: int = 8000
    HOST: str = "0.0.0.0"
    CORS_ORIGINS: List[str] = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:8000",
    ]

    # Security
    APP_SECRET_KEY: str = "campus-swap-development-app-secret-jwt-key-2026"
    # 32-byte base64 key for AES-256-GCM contact encryption
    ENCRYPTION_KEY: str = "wG5k93pQZ99b4m2qG9YkL+X1dF5nZ1yF8eK2eL9kM2s="

    # Supabase (Optional for local/in-memory mode, required for cloud production)
    SUPABASE_URL: str = ""
    SUPABASE_KEY: str = ""
    SUPABASE_ANON_KEY: str = ""
    SUPABASE_JWT_SECRET: str = ""

    # Transactional Email (Resend)
    RESEND_API_KEY: str = ""
    RESEND_FROM_EMAIL: str = "notifications@campusswap.local"

    # Search (Meilisearch)
    MEILISEARCH_URL: str = "http://localhost:7700"
    MEILISEARCH_MASTER_KEY: str = "campusSwapMeiliMasterKey123"

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore"
    )

    def get_encryption_key_bytes(self) -> bytes:
        try:
            raw = base64.b64decode(self.ENCRYPTION_KEY)
            if len(raw) == 32:
                return raw
        except Exception:
            pass
        # Fallback predictable 32-byte key if decoding fails
        return b"12345678901234567890123456789012"

settings = Settings()
