"""
Configuration settings for the Ultimate Hedge Fund & Advanced Trading Application.
"""
import os
from dotenv import load_dotenv
from pydantic import BaseSettings

# Load environment variables from .env file
load_dotenv()

class Settings(BaseSettings):
    # API Keys
    FMP_API_KEY: str = os.getenv("FMP_API_KEY", "PAOLJkXcsmkAE64dnOQiqalcNAoyKSAp")
    
    # API Rate Limits
    FMP_RATE_LIMIT: int = 300  # 300 calls per minute
    
    # Database Settings
    DATABASE_URL: str = os.getenv("DATABASE_URL", "postgresql://postgres:postgres@localhost:5432/hedge_fund_app")
    TIMESCALE_DATABASE_URL: str = os.getenv("TIMESCALE_DATABASE_URL", "postgresql://postgres:postgres@localhost:5432/hedge_fund_timeseries")
    
    # Redis Settings
    REDIS_URL: str = os.getenv("REDIS_URL", "redis://localhost:6379/0")
    
    # Application Settings
    APP_NAME: str = "Ultimate Hedge Fund & Trading Application"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = os.getenv("DEBUG", "False").lower() == "true"
    
    # JWT Settings
    JWT_SECRET: str = os.getenv("JWT_SECRET", "supersecretkey")
    JWT_ALGORITHM: str = "HS256"
    JWT_EXPIRATION: int = 60 * 24  # 24 hours
    
    # ML Model Settings
    MODEL_UPDATE_FREQUENCY: str = "daily"  # How often to retrain models
    
    # Paths
    ML_MODELS_PATH: str = "src/ml_models"
    DATA_CACHE_PATH: str = "data/cache"
    
    # Database Connection Pool Settings
    DB_POOL_SIZE: int = 20
    DB_MAX_OVERFLOW: int = 10
    DB_POOL_TIMEOUT: int = 30
    
    # TimescaleDB Settings
    TIMESCALE_CHUNK_INTERVAL: str = "1 day"  # Default chunk interval for hypertables
    
    class Config:
        env_file = ".env"
        case_sensitive = True

# Create settings instance
settings = Settings()