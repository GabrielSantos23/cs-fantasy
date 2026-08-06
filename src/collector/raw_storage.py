import json
from pathlib import Path
from typing import Any, Optional, Dict
from src.config import RAW_TOURNAMENTS_DIR, RAW_PLAYERS_DIR
class RawStorageManager:
    """
    Manages local raw JSON storage for caching API responses.
    """
    @staticmethod
    def _clean_filename(key: str) -> str:
        safe_key = "".join([c if c.isalnum() or c in ("-", "_") else "_" for c in key])
        return safe_key.lower()
    @classmethod
    def save_tournament_raw(cls, tournament_id: str, data: Any) -> Path:
        file_name = f"{cls._clean_filename(tournament_id)}.json"
        path = RAW_TOURNAMENTS_DIR / file_name
        with open(path, "w", encoding="utf-8") as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
        return path
    @classmethod
    def load_tournament_raw(cls, tournament_id: str) -> Optional[Any]:
        file_name = f"{cls._clean_filename(tournament_id)}.json"
        path = RAW_TOURNAMENTS_DIR / file_name
        if path.exists():
            with open(path, "r", encoding="utf-8") as f:
                return json.load(f)
        return None
    @classmethod
    def save_player_raw(cls, player_id: str, data: Any) -> Path:
        file_name = f"{cls._clean_filename(player_id)}.json"
        path = RAW_PLAYERS_DIR / file_name
        with open(path, "w", encoding="utf-8") as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
        return path
    @classmethod
    def load_player_raw(cls, player_id: str) -> Optional[Any]:
        file_name = f"{cls._clean_filename(player_id)}.json"
        path = RAW_PLAYERS_DIR / file_name
        if path.exists():
            with open(path, "r", encoding="utf-8") as f:
                return json.load(f)
        return None
