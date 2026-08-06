import logging
from typing import Dict, List, Any, Set
from src.database.db_manager import DatabaseManager
logger = logging.getLogger(__name__)
class EraBuilder:
    """
    Groups player tournament appearances into annual calendar-year 'Eras'.
    Identifies teams and roles per player per year.
    """
    def __init__(self, db_manager: DatabaseManager):
        self.db = db_manager
    def build_eras_for_player(self, player_id: str) -> List[Dict[str, Any]]:
        """
        Retrieves all tournament appearances for a player and groups them into yearly era structures.
        """
        appearances = self.db.get_player_appearances(player_id)
        if not appearances:
            logger.warning(f"No tournament appearances found for player '{player_id}'")
            return []
        year_map: Dict[int, List[Dict[str, Any]]] = {}
        for app in appearances:
            year = app["year"]
            year_map.setdefault(year, []).append(app)
        era_records = []
        for year, app_list in sorted(year_map.items()):
            teams: Set[str] = set()
            roles: Set[str] = set()
            for app in app_list:
                if app.get("team_name"):
                    teams.add(app["team_name"])
                if app.get("role"):
                    roles.add(app["role"])
            era_data = {
                "player_id": player_id.lower(),
                "year": year,
                "tournaments_count": len(app_list),
                "teams": sorted(list(teams)),
                "roles": sorted(list(roles)),
                "appearances": app_list
            }
            era_records.append(era_data)
        return era_records
