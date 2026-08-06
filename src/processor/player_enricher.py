import logging
from typing import Dict, Any, Optional
from src.collector.liquipedia_api import LiquipediaAPIClient
from src.collector.raw_storage import RawStorageManager
from src.collector.wikitext_parser import WikitextParser, build_liquipedia_image_url
from src.database.db_manager import DatabaseManager

logger = logging.getLogger(__name__)

class PlayerEnricher:
    """
    Enriches player profile data (Fase 4: foto, nome real, data de nascimento, nacionalidade).
    Uses action=query (lightweight, 2s rate limit) via fetch_page_wikitext.
    """
    def __init__(self, db_manager: DatabaseManager, api_client: Optional[LiquipediaAPIClient] = None):
        self.db = db_manager
        self.api_client = api_client or LiquipediaAPIClient()

    def enrich_player(self, player_id: str, force_refresh: bool = False) -> Dict[str, Any]:
        """
        Fetches and updates bio metadata for a player by reading their Liquipedia page wikitext.
        Tries multiple title variants (original handle from DB, player_id, capitalized) to find the page.
        """
        player_id_clean = player_id.lower()
        
        # Check raw cache first
        raw_data = None if force_refresh else RawStorageManager.load_player_raw(player_id_clean)

        if not raw_data:
            logger.info(f"Fetching bio for player '{player_id}' from Liquipedia API...")

            existing = self.db.get_player(player_id_clean)
            handle = existing.get("handle", player_id) if existing else player_id

            title_variants = []
            if handle and handle not in title_variants:
                title_variants.append(handle)
            if player_id not in title_variants:
                title_variants.append(player_id)
            capitalized = player_id.capitalize()
            if capitalized not in title_variants:
                title_variants.append(capitalized)

            wikitext = None
            for variant in title_variants:
                wikitext = self.api_client.fetch_page_wikitext(variant)
                if wikitext and "Infobox player" in wikitext:
                    logger.info(f"Found player page with title variant '{variant}'")
                    break
                wikitext = None

            if wikitext:
                parsed = WikitextParser.parse_infobox_player(wikitext, player_id)
                raw_data = {
                    "source": "wikitext",
                    "handle": parsed.get("handle", player_id),
                    "real_name": parsed.get("real_name"),
                    "birth_date": parsed.get("birth_date"),
                    "nationality": parsed.get("nationality"),
                    "photo_url": parsed.get("photo_url"),
                    "role": parsed.get("role"),
                }
                RawStorageManager.save_player_raw(player_id_clean, raw_data)

        if not raw_data:
            logger.warning(f"Could not find biographical details for player '{player_id}'")
            basic_player = {
                "id": player_id_clean,
                "handle": player_id,
                "real_name": None,
                "birth_date": None,
                "nationality": None,
                "photo_url": None,
                "liquipedia_url": f"https://liquipedia.net/counterstrike/{player_id}"
            }
            self.db.upsert_player(basic_player)
            return basic_player

        # Convert photo_url if it uses old Special:FilePath format
        photo_url = raw_data.get("photo_url")
        if photo_url and "Special:FilePath/" in photo_url:
            image_filename = photo_url.split("Special:FilePath/")[-1]
            photo_url = build_liquipedia_image_url(image_filename)

        player_record = {
            "id": player_id_clean,
            "handle": raw_data.get("handle") or player_id,
            "real_name": raw_data.get("real_name"),
            "birth_date": raw_data.get("birth_date"),
            "nationality": raw_data.get("nationality"),
            "photo_url": photo_url,
            "liquipedia_url": f"https://liquipedia.net/counterstrike/{raw_data.get('handle', player_id)}"
        }

        self.db.upsert_player(player_record)
        return player_record
