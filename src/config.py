import os
from pathlib import Path

# Base paths
BASE_DIR = Path(__file__).resolve().parent.parent
DATA_DIR = BASE_DIR / "data"
RAW_DATA_DIR = DATA_DIR / "raw"
RAW_TOURNAMENTS_DIR = RAW_DATA_DIR / "tournaments"
RAW_PLAYERS_DIR = RAW_DATA_DIR / "players"
DB_PATH = DATA_DIR / "cs_eras.db"

# Create directories if they don't exist
for d in [DATA_DIR, RAW_DATA_DIR, RAW_TOURNAMENTS_DIR, RAW_PLAYERS_DIR]:
    d.mkdir(parents=True, exist_ok=True)

# Liquipedia API settings
LIQUIPEDIA_API_URL = "https://liquipedia.net/counterstrike/api.php"
DEFAULT_USER_AGENT = "CSPlayerEras/1.0 (contact@data-cs.local; CounterStrike Historical Data Pipeline)"
API_REQUEST_DELAY = 3.0  # action=query requires 2s min; using 3s for safety margin

# Tournament Placement Base Points
PLACEMENT_POINTS = {
    "1": 100.0,
    "1st": 100.0,
    "2": 70.0,
    "2nd": 70.0,
    "3": 50.0,
    "3rd": 50.0,
    "3-4": 50.0,
    "3rd-4th": 50.0,
    "4": 40.0,
    "4th": 40.0,
    "5-6": 30.0,
    "5th-6th": 30.0,
    "5-8": 30.0,
    "5th-8th": 30.0,
    "7-8": 25.0,
    "7th-8th": 25.0,
    "9-12": 15.0,
    "9th-12th": 15.0,
    "13-16": 5.0,
    "13th-16th": 5.0,
}
DEFAULT_PLACEMENT_POINTS = 2.0

# Tier Multipliers
TIER_MULTIPLIERS = {
    "Major": 2.5,
    "S-Tier": 2.0,
    "S": 2.0,
    "A-Tier": 1.2,
    "A": 1.2,
    "B-Tier": 0.7,
    "B": 0.7,
    "C-Tier": 0.3,
    "C": 0.3,
    "Showmatch": 0.1,
    "Monthly": 0.4,
    "Weekly": 0.2,
}
DEFAULT_TIER_MULTIPLIER = 0.5
