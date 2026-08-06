import sqlite3
import json
from pathlib import Path
from typing import Dict, List, Any, Optional
from src.config import DB_PATH
class DatabaseManager:
    """
    Manages SQLite database connections, schema initialization, and operations.
    """
    def __init__(self, db_path: Path = DB_PATH):
        self.db_path = db_path
        self.init_db()
    def get_connection(self) -> sqlite3.Connection:
        conn = sqlite3.connect(self.db_path)
        conn.row_factory = sqlite3.Row
        return conn
    def init_db(self):
        schema_path = Path(__file__).resolve().parent / "schema.sql"
        if not schema_path.exists():
            raise FileNotFoundError(f"Schema file not found at {schema_path}")
        with open(schema_path, "r", encoding="utf-8") as f:
            sql_script = f.read()
        with self.get_connection() as conn:
            conn.executescript(sql_script)
            conn.commit()
    def upsert_player(self, player_data: Dict[str, Any]) -> str:
        player_id = player_data["id"].lower()
        handle = player_data.get("handle") or player_data.get("id")
        sql = """
            INSERT INTO players (id, handle, real_name, birth_date, nationality, photo_url, liquipedia_url)
            VALUES (:id, :handle, :real_name, :birth_date, :nationality, :photo_url, :liquipedia_url)
            ON CONFLICT(id) DO UPDATE SET
                handle = COALESCE(EXCLUDED.handle, players.handle),
                real_name = COALESCE(EXCLUDED.real_name, players.real_name),
                birth_date = COALESCE(EXCLUDED.birth_date, players.birth_date),
                nationality = COALESCE(EXCLUDED.nationality, players.nationality),
                photo_url = COALESCE(EXCLUDED.photo_url, players.photo_url),
                liquipedia_url = COALESCE(EXCLUDED.liquipedia_url, players.liquipedia_url);
        """
        params = {
            "id": player_id,
            "handle": handle,
            "real_name": player_data.get("real_name"),
            "birth_date": player_data.get("birth_date"),
            "nationality": player_data.get("nationality"),
            "photo_url": player_data.get("photo_url"),
            "liquipedia_url": player_data.get("liquipedia_url", f"https://liquipedia.net/counterstrike/{player_id}")
        }
        with self.get_connection() as conn:
            conn.execute(sql, params)
            conn.commit()
        return player_id
    def get_player(self, player_id: str) -> Optional[Dict[str, Any]]:
        sql = "SELECT * FROM players WHERE id = ?"
        with self.get_connection() as conn:
            cur = conn.execute(sql, (player_id.lower(),))
            row = cur.fetchone()
            return dict(row) if row else None
    def upsert_tournament(self, tourney: Dict[str, Any]) -> str:
        tourney_id = tourney["id"].lower()
        sql = """
            INSERT INTO tournaments (id, name, start_date, end_date, year, tier, format, liquipedia_url, raw_json_path)
            VALUES (:id, :name, :start_date, :end_date, :year, :tier, :format, :liquipedia_url, :raw_json_path)
            ON CONFLICT(id) DO UPDATE SET
                name = EXCLUDED.name,
                start_date = EXCLUDED.start_date,
                end_date = EXCLUDED.end_date,
                year = EXCLUDED.year,
                tier = EXCLUDED.tier,
                format = EXCLUDED.format,
                liquipedia_url = EXCLUDED.liquipedia_url,
                raw_json_path = EXCLUDED.raw_json_path;
        """
        params = {
            "id": tourney_id,
            "name": tourney["name"],
            "start_date": tourney.get("start_date"),
            "end_date": tourney.get("end_date"),
            "year": tourney.get("year"),
            "tier": tourney.get("tier"),
            "format": tourney.get("format"),
            "liquipedia_url": tourney.get("liquipedia_url"),
            "raw_json_path": str(tourney.get("raw_json_path", ""))
        }
        with self.get_connection() as conn:
            conn.execute(sql, params)
            conn.commit()
        return tourney_id
    def add_tournament_result(self, result: Dict[str, Any]):
        sql = """
            INSERT INTO tournament_results (tournament_id, team_name, placement, placement_numeric, prize_money)
            VALUES (:tournament_id, :team_name, :placement, :placement_numeric, :prize_money)
        """
        with self.get_connection() as conn:
            conn.execute(sql, result)
            conn.commit()
    def add_appearance(self, appearance: Dict[str, Any]):
        sql = """
            INSERT INTO player_tournament_appearances (player_id, tournament_id, team_name, role, placement, year)
            VALUES (:player_id, :tournament_id, :team_name, :role, :placement, :year)
        """
        params = {
            "player_id": appearance["player_id"].lower(),
            "tournament_id": appearance["tournament_id"].lower(),
            "team_name": appearance["team_name"],
            "role": appearance.get("role", "Rifler"),
            "placement": appearance["placement"],
            "year": appearance["year"]
        }
        with self.get_connection() as conn:
            conn.execute(sql, params)
            conn.commit()
    def get_player_appearances(self, player_id: str, year: Optional[int] = None) -> List[Dict[str, Any]]:
        if year:
            sql = """
                SELECT a.*, t.name as tournament_name, t.tier as tournament_tier
                FROM player_tournament_appearances a
                JOIN tournaments t ON a.tournament_id = t.id
                WHERE a.player_id = ? AND a.year = ?
                ORDER BY t.start_date ASC
            """
            args = (player_id.lower(), year)
        else:
            sql = """
                SELECT a.*, t.name as tournament_name, t.tier as tournament_tier
                FROM player_tournament_appearances a
                JOIN tournaments t ON a.tournament_id = t.id
                WHERE a.player_id = ?
                ORDER BY a.year ASC, t.start_date ASC
            """
            args = (player_id.lower(),)
        with self.get_connection() as conn:
            cur = conn.execute(sql, args)
            return [dict(row) for row in cur.fetchall()]
    def upsert_player_era(self, era: Dict[str, Any]):
        sql = """
            INSERT INTO player_eras (id, player_id, year, total_score, average_score, tournaments_count, teams_json, roles_json, breakdown_json)
            VALUES (:id, :player_id, :year, :total_score, :average_score, :tournaments_count, :teams_json, :roles_json, :breakdown_json)
            ON CONFLICT(id) DO UPDATE SET
                total_score = EXCLUDED.total_score,
                average_score = EXCLUDED.average_score,
                tournaments_count = EXCLUDED.tournaments_count,
                teams_json = EXCLUDED.teams_json,
                roles_json = EXCLUDED.roles_json,
                breakdown_json = EXCLUDED.breakdown_json,
                updated_at = CURRENT_TIMESTAMP;
        """
        params = {
            "id": f"{era['player_id'].lower()}_{era['year']}",
            "player_id": era["player_id"].lower(),
            "year": era["year"],
            "total_score": era["total_score"],
            "average_score": era["average_score"],
            "tournaments_count": era["tournaments_count"],
            "teams_json": json.dumps(era.get("teams", []), ensure_ascii=False),
            "roles_json": json.dumps(era.get("roles", []), ensure_ascii=False),
            "breakdown_json": json.dumps(era.get("breakdown", {}), ensure_ascii=False)
        }
        with self.get_connection() as conn:
            conn.execute(sql, params)
            conn.commit()
    def get_player_era(self, player_id: str, year: int) -> Optional[Dict[str, Any]]:
        era_id = f"{player_id.lower()}_{year}"
        sql = "SELECT * FROM player_eras WHERE id = ?"
        with self.get_connection() as conn:
            cur = conn.execute(sql, (era_id,))
            row = cur.fetchone()
            if row:
                d = dict(row)
                d["teams"] = json.loads(d["teams_json"])
                d["roles"] = json.loads(d["roles_json"])
                d["breakdown"] = json.loads(d["breakdown_json"])
                return d
            return None
