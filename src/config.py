import os
from pydantic_settings import BaseSettings, SettingsConfigDict


ENV_FILE = os.getenv("ENV_FILE", ".env")


class Config(BaseSettings):

    strava_client_secret: str = ""
    strava_client_id: str = ""
    strava_access_token: str = ""

    model_config = SettingsConfigDict(env_file=ENV_FILE, env_file_encoding="utf-8")
