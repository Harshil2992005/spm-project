from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    DATABASE_URL: str = "postgresql://pharmacy_user:pharmacy_pass@localhost:5432/pharmacy_db"
    SECRET_KEY: str = "change-this-secret-in-production-2026"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60
    ADMIN_USERNAME: str = "admin"
    ADMIN_PASSWORD: str = "admin123"
    ADMIN_EMAIL: str = "admin@pharmacy.com"

    # Login-by-OTP / e-mail settings
    OTP_EXPIRE_MINUTES: int = 5
    OTP_DEBUG: bool = False  # only for local dev: return the OTP in the API response
    SMTP_HOST: str = ""
    SMTP_PORT: int = 587
    SMTP_USER: str = ""
    SMTP_PASSWORD: str = ""
    SMTP_FROM: str = "no-reply@pharmacy.com"
    SMTP_TLS: bool = True

    # Google Sign-In (OAuth 2.0 / Google Identity Services)
    GOOGLE_CLIENT_ID: str = ""
    GOOGLE_DEFAULT_ROLE_ID: int = 2  # role assigned to new Google accounts (2 = Customer)
    SEED_DEMO_DATA: bool = True


settings = Settings()