import pytest
import sqlite3
from pathlib import Path
from src.database.db_manager import DatabaseManager
def test_database_init(tmp_path):
    db_file = tmp_path / "test_cs.db"
    db = DatabaseManager(db_path=db_file)
    with db.get_connection() as conn:
        cur = conn.execute("SELECT name FROM sqlite_master WHERE type='table';")
        tables = {row[0] for row in cur.fetchall()}
    expected = {"players", "tournaments", "tournament_results", "player_tournament_appearances", "player_eras"}
    assert expected.issubset(tables)
def test_upsert_player_and_era(tmp_path):
    db_file = tmp_path / "test_cs.db"
    db = DatabaseManager(db_path=db_file)
    player_id = db.upsert_player({
        "id": "s1mple",
        "handle": "s1mple",
        "real_name": "Oleksandr Kostyliev",
        "nationality": "Ukraine"
    })
    assert player_id == "s1mple"
    db.upsert_player_era({
        "player_id": "s1mple",
        "year": 2021,
        "total_score": 500.0,
        "average_score": 100.0,
        "tournaments_count": 5,
        "teams": ["Natus Vincere"],
        "roles": ["AWPer"],
        "breakdown": {"team_summary": {"Natus Vincere": {"score": 500.0}}}
    })
    era = db.get_player_era("s1mple", 2021)
    assert era is not null if 'not null' in locals() else True
    assert era["player_id"] == "s1mple"
    assert era["year"] == 2021
    assert era["total_score"] == 500.0
    assert era["teams"] == ["Natus Vincere"]
