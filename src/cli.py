import sys
import re
import json
import logging
import click
from typing import Optional

# Ensure stdout handles UTF-8 on Windows console
if sys.platform == "win32":
    sys.stdout.reconfigure(encoding="utf-8")

from src.database.db_manager import DatabaseManager
from src.collector.liquipedia_api import LiquipediaAPIClient
from src.collector.raw_storage import RawStorageManager
from src.collector.wikitext_parser import WikitextParser, get_team_placement
from src.processor.era_builder import EraBuilder
from src.processor.scorer import EraScorer
from src.processor.player_enricher import PlayerEnricher
from src.config import API_REQUEST_DELAY

logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(name)s - %(levelname)s - %(message)s")
logger = logging.getLogger("CSPlayerErasCLI")

def extract_year_from_title(title: str) -> Optional[int]:
    """Extracts a 4-digit year (1999-2029) from a tournament title string."""
    match = re.search(r"\b(20[0-2]\d|199\d)\b", title)
    if match:
        return int(match.group(1))
    return None

@click.group()
def cli():
    """CS Player Eras Historical Data Pipeline CLI"""
    pass

@cli.command()
def init_db():
    """Initialize SQLite database tables and schema."""
    db = DatabaseManager()
    click.echo("Database initialized successfully.")

@cli.command()
@click.option("--start-year", default=2013, type=int, help="Start year (default: 2013)")
@click.option("--end-year", default=2026, type=int, help="End year (default: 2026)")
@click.option("--delay", default=API_REQUEST_DELAY, type=float, help="Delay in seconds between API requests (default: 5.0)")
@click.option("--limit", default=None, type=int, help="Optional limit of tournaments to fetch")
@click.option("--force-refresh", is_flag=True, help="Force refresh from API instead of cache")
def fetch_s_tier_tournaments(start_year: int, end_year: int, delay: float, limit: Optional[int], force_refresh: bool):
    """
    Coleta TODOS os campeonatos S-Tier e Majors do Liquipedia entre start-year e end-year.
    """
    db = DatabaseManager()
    api_client = LiquipediaAPIClient(delay=delay)

    categories = ["S-Tier Tournaments", "Major Tournaments"]
    all_members = []
    seen_titles = set()

    for cat in categories:
        click.echo(f"Fetching category members for 'Category:{cat}'...")
        members = api_client.fetch_category_members(cat, limit=500)
        for m in members:
            if m["title"] not in seen_titles:
                seen_titles.add(m["title"])
                all_members.append(m)

    click.echo(f"Total unique S-Tier/Major tournament pages found: {len(all_members)} (Request Delay: {delay}s)")

    processed_count = 0
    skipped_count = 0

    for page in all_members:
        if limit and processed_count >= limit:
            click.echo(f"Reached limit of {limit} tournaments.")
            break

        title = page["title"]
        pagename = title.replace(" ", "_")

        title_year = extract_year_from_title(title)
        if title_year and not (start_year <= title_year <= end_year):
            skipped_count += 1
            continue

        cached_data = None if force_refresh else RawStorageManager.load_tournament_raw(pagename)

        if not cached_data:
            click.echo(f"Fetching wikitext for S-Tier tournament '{title}'...")
            wikitext = api_client.fetch_page_wikitext(title)
            if not wikitext:
                logger.warning(f"Could not retrieve wikitext for {title}")
                continue

            info = WikitextParser.parse_infobox_league(wikitext, title)
            team_cards = WikitextParser.parse_team_cards(wikitext)
            prize_pool = WikitextParser.parse_prize_pool(wikitext)

            cached_data = {
                "title": title,
                "pagename": pagename,
                "info": info,
                "team_cards": team_cards,
                "prize_pool": prize_pool,
                "wikitext": wikitext
            }
            RawStorageManager.save_tournament_raw(pagename, cached_data)

        info = cached_data.get("info", {})
        start_date = info.get("start_date")
        year = title_year or (int(start_date[:4]) if start_date and len(start_date) >= 4 else 2020)

        if not (start_year <= year <= end_year):
            skipped_count += 1
            continue

        tourney_record = {
            "id": pagename.lower(),
            "name": info.get("name", title),
            "start_date": start_date,
            "end_date": info.get("end_date"),
            "year": year,
            "tier": info.get("tier", "S-Tier"),
            "format": info.get("format"),
            "liquipedia_url": f"https://liquipedia.net/counterstrike/{pagename}",
            "raw_json_path": str(RawStorageManager._clean_filename(pagename))
        }
        db.upsert_tournament(tourney_record)

        # Always re-parse prize_pool from wikitext so the latest parser logic is applied,
        # regardless of what was cached previously (old caches may have stale/buggy placements).
        raw_wikitext = cached_data.get("wikitext", "")
        if raw_wikitext:
            prize_map = WikitextParser.parse_prize_pool(raw_wikitext)
            # Also re-parse team_cards to pick up any parser fixes
            team_cards_live = WikitextParser.parse_team_cards(raw_wikitext)
        else:
            prize_map = cached_data.get("prize_pool", {})
            team_cards_live = cached_data.get("team_cards", [])

        for tc in team_cards_live:
            team_name = tc["team_name"]
            placement = get_team_placement(team_name, prize_map)

            db.add_tournament_result({
                "tournament_id": pagename.lower(),
                "team_name": team_name,
                "placement": placement,
                "placement_numeric": None,
                "prize_money": None
            })

            for p in tc.get("players", []):
                p_id = p["player_id"]
                db.upsert_player({
                    "id": p_id,
                    "handle": p["handle"]
                })
                db.add_appearance({
                    "player_id": p_id,
                    "tournament_id": pagename.lower(),
                    "team_name": team_name,
                    "role": p.get("role", "Rifler"),
                    "placement": placement,
                    "year": year
                })

        processed_count += 1
        click.echo(f"[{processed_count}] Saved S-Tier Tournament '{title}' (Year {year}).")

    click.echo(f"Done. Processed {processed_count} S-Tier/Major tournament(s) between {start_year} and {end_year} (Skipped {skipped_count} outside range).")

@cli.command()
@click.option("--start-year", default=2013, type=int, help="Start year (default: 2013)")
@click.option("--end-year", default=2026, type=int, help="End year (default: 2026)")
@click.option("--delay", default=API_REQUEST_DELAY, type=float, help="Delay in seconds between API requests (default: 5.0)")
@click.option("--force-refresh", is_flag=True, help="Force refresh bio data from API")
def fetch_s_tier_players(start_year: int, end_year: int, delay: float, force_refresh: bool):
    """
    Busca os dados pessoais (bio, foto, nome real, nacionalidade, nascimento)
    de TODOS os jogadores que disputaram campeonatos S-Tier entre start-year e end-year.
    """
    db = DatabaseManager()
    api_client = LiquipediaAPIClient(delay=delay)
    enricher = PlayerEnricher(db, api_client=api_client)

    sql = """
        SELECT DISTINCT a.player_id
        FROM player_tournament_appearances a
        JOIN tournaments t ON a.tournament_id = t.id
        WHERE a.year >= ? AND a.year <= ? AND (t.tier LIKE '%S-Tier%' OR t.tier LIKE '%Major%')
    """
    with db.get_connection() as conn:
        cur = conn.execute(sql, (start_year, end_year))
        players = [row["player_id"] for row in cur.fetchall()]

    if not players:
        click.echo(f"No S-Tier players found in DB for years {start_year}-{end_year}. Run 'fetch-s-tier-tournaments' first.")
        return

    click.echo(f"Found {len(players)} unique S-Tier player(s) between {start_year} and {end_year}. (Delay: {delay}s)")

    for idx, p_id in enumerate(players, 1):
        click.echo(f"[{idx}/{len(players)}] Fetching bio for S-Tier player '{p_id}'...")
        bio = enricher.enrich_player(p_id, force_refresh=force_refresh)
        click.echo(f"   -> Name: {bio.get('real_name')}, Nat: {bio.get('nationality')}, Birth: {bio.get('birth_date')}")

    click.echo(f"Successfully enriched profiles for all {len(players)} S-Tier players ({start_year}-{end_year}).")

@cli.command()
@click.option("--category", default="S-Tier Tournaments", help="Liquipedia category")
@click.option("--limit", default=5, help="Maximum number of tournaments to process")
@click.option("--delay", default=API_REQUEST_DELAY, type=float, help="Delay in seconds between API requests")
@click.option("--force-refresh", is_flag=True, help="Force refresh from API")
def fetch_tournaments(category: str, limit: int, delay: float, force_refresh: bool):
    """Fase 1: Fetch raw tournament data & rosters from Liquipedia API / Cache."""
    db = DatabaseManager()
    api_client = LiquipediaAPIClient(delay=delay)

    click.echo(f"Fetching category members for 'Category:{category}' (limit: {limit})...")
    members = api_client.fetch_category_members(category, limit=limit)
    click.echo(f"Found {len(members)} tournament pages.")

    processed_count = 0
    for page in members[:limit]:
        title = page["title"]
        pagename = title.replace(" ", "_")

        cached_data = None if force_refresh else RawStorageManager.load_tournament_raw(pagename)

        if not cached_data:
            click.echo(f"Fetching wikitext for '{title}'...")
            wikitext = api_client.fetch_page_wikitext(title)
            if not wikitext:
                logger.warning(f"Could not retrieve wikitext for {title}")
                continue

            info = WikitextParser.parse_infobox_league(wikitext, title)
            team_cards = WikitextParser.parse_team_cards(wikitext)
            prize_pool = WikitextParser.parse_prize_pool(wikitext)

            cached_data = {
                "title": title,
                "pagename": pagename,
                "info": info,
                "team_cards": team_cards,
                "prize_pool": prize_pool,
                "wikitext": wikitext
            }
            RawStorageManager.save_tournament_raw(pagename, cached_data)

        info = cached_data.get("info", {})
        start_date = info.get("start_date")
        year = int(start_date[:4]) if start_date and len(start_date) >= 4 else 2020

        tourney_record = {
            "id": pagename.lower(),
            "name": info.get("name", title),
            "start_date": start_date,
            "end_date": info.get("end_date"),
            "year": year,
            "tier": info.get("tier", "S-Tier"),
            "format": info.get("format"),
            "liquipedia_url": f"https://liquipedia.net/counterstrike/{pagename}",
            "raw_json_path": str(RawStorageManager._clean_filename(pagename))
        }
        db.upsert_tournament(tourney_record)

        prize_map = cached_data.get("prize_pool", {})
        for tc in cached_data.get("team_cards", []):
            team_name = tc["team_name"]
            placement = get_team_placement(team_name, prize_map)

            db.add_tournament_result({
                "tournament_id": pagename.lower(),
                "team_name": team_name,
                "placement": placement,
                "placement_numeric": None,
                "prize_money": None
            })

            for p in tc.get("players", []):
                p_id = p["player_id"]
                db.upsert_player({
                    "id": p_id,
                    "handle": p["handle"]
                })
                db.add_appearance({
                    "player_id": p_id,
                    "tournament_id": pagename.lower(),
                    "team_name": team_name,
                    "role": p.get("role", "Rifler"),
                    "placement": placement,
                    "year": year
                })

        processed_count += 1
        click.echo(f"[{processed_count}/{limit}] Processed tournament '{title}' (Year {year}).")

    click.echo(f"Successfully collected and processed {processed_count} tournament(s).")

@cli.command()
@click.option("--player", type=str, help="Specific player ID (e.g., fallen, coldzera, s1mple)")
def process_eras(player: Optional[str]):
    """Fase 2: Structure player historical appearances into annual eras."""
    db = DatabaseManager()
    builder = EraBuilder(db)

    players_to_process = [player.lower()] if player else []
    if not players_to_process:
        with db.get_connection() as conn:
            cur = conn.execute("SELECT DISTINCT player_id FROM player_tournament_appearances")
            players_to_process = [row["player_id"] for row in cur.fetchall()]

    if not players_to_process:
        click.echo("No player appearances found in database to process. Run 'fetch-tournaments' or 'seed-sample-data' first.")
        return

    click.echo(f"Processing eras for {len(players_to_process)} player(s)...")
    for p_id in players_to_process:
        eras = builder.build_eras_for_player(p_id)
        click.echo(f"Player '{p_id}': Built {len(eras)} era(s).")

@cli.command()
def calculate_scores():
    """Fase 3: Calculate score, average points, and team breakdowns for eras."""
    db = DatabaseManager()
    builder = EraBuilder(db)

    with db.get_connection() as conn:
        cur = conn.execute("SELECT DISTINCT player_id FROM player_tournament_appearances")
        players = [row["player_id"] for row in cur.fetchall()]

    if not players:
        click.echo("No players found in database. Please run 'process-eras' or 'seed-sample-data'.")
        return

    total_eras = 0
    for p_id in players:
        eras = builder.build_eras_for_player(p_id)
        for era_data in eras:
            scored = EraScorer.score_era(era_data)
            db.upsert_player_era(scored)
            total_eras += 1
            click.echo(f"Scored Era '{scored['player_id']}_{scored['year']}': Score = {scored['total_score']} pts ({scored['tournaments_count']} tournaments, Teams: {scored['teams']})")

    click.echo(f"Successfully calculated scores for {total_eras} era(s).")

@cli.command()
@click.option("--player", type=str, help="Specific player ID (e.g., fallen, s1mple)")
@click.option("--delay", default=API_REQUEST_DELAY, type=float, help="Delay in seconds between API requests")
def enrich_players(player: Optional[str], delay: float):
    """Fase 4: Enrich players with bio details (photo, real name, birth date, nationality)."""
    db = DatabaseManager()
    api_client = LiquipediaAPIClient(delay=delay)
    enricher = PlayerEnricher(db, api_client=api_client)

    players_to_enrich = [player.lower()] if player else []
    if not players_to_enrich:
        with db.get_connection() as conn:
            cur = conn.execute("SELECT id FROM players")
            players_to_enrich = [row["id"] for row in cur.fetchall()]

    click.echo(f"Enriching profile bio for {len(players_to_enrich)} player(s)... (Delay: {delay}s)")
    for p_id in players_to_enrich:
        bio = enricher.enrich_player(p_id)
        click.echo(f"Enriched '{p_id}': Name='{bio.get('real_name')}', Nat='{bio.get('nationality')}', Photo='{bio.get('photo_url')}'")

@cli.command()
@click.option("--player", required=True, type=str, help="Player ID (e.g. fallen)")
@click.option("--year", required=True, type=int, help="Year (e.g. 2017)")
def inspect_era(player: str, year: int):
    """Inspect era details stored in SQLite database."""
    db = DatabaseManager()
    era = db.get_player_era(player, year)
    if not era:
        click.echo(f"No era found for {player}_{year}")
        return

    click.echo("=" * 60)
    click.echo(f"ERA PROFILE: {era['id'].upper()}")
    click.echo("=" * 60)
    click.echo(f"Player ID         : {era['player_id']}")
    click.echo(f"Year              : {era['year']}")
    click.echo(f"Total Score       : {era['total_score']} pts")
    click.echo(f"Average Score     : {era['average_score']} pts")
    click.echo(f"Tournaments Count : {era['tournaments_count']}")
    click.echo(f"Teams Played      : {', '.join(era['teams'])}")
    click.echo(f"Roles             : {', '.join(era['roles'])}")
    click.echo("\n--- TEAM SUMMARY ---")
    click.echo(json.dumps(era['breakdown']['team_summary'], indent=2, ensure_ascii=False))
    click.echo("\n--- TOURNAMENT BREAKDOWN ---")
    click.echo(json.dumps(era['breakdown']['tournaments'], indent=2, ensure_ascii=False))
    click.echo("=" * 60)

@cli.command()
def seed_sample_data():
    """Seed offline historical sample data (Fallen 2017 SK Gaming, Coldzera 2018 MIBR/SK, S1mple 2021 NaVi)."""
    db = DatabaseManager()
    
    sample_tournaments = [
        {
            "id": "eleague_major_atlanta_2017",
            "name": "ELEAGUE Major: Atlanta 2017",
            "start_date": "2017-01-22",
            "end_date": "2017-01-29",
            "year": 2017,
            "tier": "Major",
            "format": "Swiss + Single Elimination",
            "liquipedia_url": "https://liquipedia.net/counterstrike/ELEAGUE/2017/Major"
        },
        {
            "id": "pgl_major_krakow_2017",
            "name": "PGL Major Kraków 2017",
            "start_date": "2017-07-16",
            "end_date": "2017-07-23",
            "year": 2017,
            "tier": "Major",
            "format": "Swiss + Single Elimination",
            "liquipedia_url": "https://liquipedia.net/counterstrike/PGL/2017/Krakow"
        },
        {
            "id": "esl_one_cologne_2017",
            "name": "ESL One Cologne 2017",
            "start_date": "2017-07-04",
            "end_date": "2017-07-09",
            "year": 2017,
            "tier": "S-Tier",
            "format": "Swiss + Single Elimination",
            "liquipedia_url": "https://liquipedia.net/counterstrike/ESL/One/2017/Cologne"
        },
        {
            "id": "iem_katowice_2018",
            "name": "IEM Katowice 2018",
            "start_date": "2018-02-27",
            "end_date": "2018-03-04",
            "year": 2018,
            "tier": "S-Tier",
            "format": "GSL + Single Elimination",
            "liquipedia_url": "https://liquipedia.net/counterstrike/IEM/Katowice/2018"
        },
        {
            "id": "faceit_major_london_2018",
            "name": "FACEIT Major: London 2018",
            "start_date": "2018-09-05",
            "end_date": "2018-09-23",
            "year": 2018,
            "tier": "Major",
            "format": "Swiss + Single Elimination",
            "liquipedia_url": "https://liquipedia.net/counterstrike/FACEIT/2018/Major"
        }
    ]

    for t in sample_tournaments:
        db.upsert_tournament(t)

    db.upsert_player({
        "id": "fallen",
        "handle": "FalleN",
        "real_name": "Gabriel Toledo",
        "birth_date": "1991-05-30",
        "nationality": "Brazil",
        "photo_url": "https://liquipedia.net/commons/Special:FilePath/FalleN_at_IEM_Katowice_2020.jpg"
    })
    
    db.upsert_player({
        "id": "coldzera",
        "handle": "coldzera",
        "real_name": "Marcelo David",
        "birth_date": "1994-10-31",
        "nationality": "Brazil",
        "photo_url": "https://liquipedia.net/commons/Special:FilePath/Coldzera_2019.jpg"
    })

    sample_appearances = [
        {"player_id": "fallen", "tournament_id": "eleague_major_atlanta_2017", "team_name": "SK Gaming", "role": "IGL / AWPer", "placement": "3-4", "year": 2017},
        {"player_id": "fallen", "tournament_id": "esl_one_cologne_2017", "team_name": "SK Gaming", "role": "IGL / AWPer", "placement": "1", "year": 2017},
        {"player_id": "fallen", "tournament_id": "pgl_major_krakow_2017", "team_name": "SK Gaming", "role": "IGL / AWPer", "placement": "5-8", "year": 2017},

        {"player_id": "coldzera", "tournament_id": "iem_katowice_2018", "team_name": "SK Gaming", "role": "Rifler", "placement": "5-6", "year": 2018},
        {"player_id": "coldzera", "tournament_id": "faceit_major_london_2018", "team_name": "MIBR", "role": "Rifler", "placement": "3-4", "year": 2018},
    ]

    for app in sample_appearances:
        db.add_appearance(app)

    click.echo("Seeded sample historical tournaments, players, and appearances into SQLite database.")

@cli.command()
@click.confirmation_option(prompt="This will DELETE the database and rebuild from cached raw JSON. Continue?")
def reset_db():
    """
    Apaga o banco SQLite e reconstroi tudo do zero a partir dos JSONs em data/raw/tournaments/.
    Usa o parser corrigido para gerar IDs de jogadores limpos.
    NÃO faz nenhuma chamada à API — usa apenas o cache local.
    """
    import os
    from pathlib import Path
    from src.config import DB_PATH, RAW_TOURNAMENTS_DIR, RAW_PLAYERS_DIR

    # 1. Delete old DB
    if DB_PATH.exists():
        os.remove(DB_PATH)
        click.echo(f"Deleted old database: {DB_PATH}")

    # 2. Delete old player raw cache (IDs were corrupted)
    player_files = list(RAW_PLAYERS_DIR.glob("*.json"))
    for f in player_files:
        os.remove(f)
    click.echo(f"Cleared {len(player_files)} cached player file(s).")

    # 3. Re-init DB
    db = DatabaseManager()
    click.echo("Re-initialized database schema.")

    # 4. Re-process all cached tournament JSONs inside a single transaction (instant execution)
    tournament_files = sorted(RAW_TOURNAMENTS_DIR.glob("*.json"))
    click.echo(f"Found {len(tournament_files)} cached tournament file(s) to reprocess.")

    with db.get_connection() as conn:
        conn.execute("BEGIN TRANSACTION;")
        for tf in tournament_files:
            with open(tf, "r", encoding="utf-8") as f:
                cached_data = json.load(f)

            wikitext = cached_data.get("wikitext")
            title = cached_data.get("title", tf.stem)
            pagename = cached_data.get("pagename", title.replace(" ", "_"))

            if wikitext:
                info = WikitextParser.parse_infobox_league(wikitext, title)
                team_cards = WikitextParser.parse_team_cards(wikitext)
                prize_pool = WikitextParser.parse_prize_pool(wikitext)
            else:
                info = cached_data.get("info", {})
                team_cards = cached_data.get("team_cards", [])
                prize_pool = cached_data.get("prize_pool", {})

            cached_data["info"] = info
            cached_data["team_cards"] = team_cards
            cached_data["prize_pool"] = prize_pool
            with open(tf, "w", encoding="utf-8") as f:
                json.dump(cached_data, f, ensure_ascii=False, indent=2)

            start_date = info.get("start_date")
            year_val = int(start_date[:4]) if start_date and len(start_date) >= 4 else 2020
            title_year = extract_year_from_title(title)
            if title_year:
                year_val = title_year

            conn.execute("""
                INSERT INTO tournaments (id, name, start_date, end_date, year, tier, format, liquipedia_url, raw_json_path)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                ON CONFLICT(id) DO UPDATE SET name=EXCLUDED.name, year=EXCLUDED.year
            """, (pagename.lower(), info.get("name", title), start_date, info.get("end_date"), year_val, info.get("tier", "S-Tier"), info.get("format"), f"https://liquipedia.net/counterstrike/{pagename}", str(tf)))

            for tc in team_cards:
                team_name = tc["team_name"]
                placement = get_team_placement(team_name, prize_pool)

                conn.execute("""
                    INSERT INTO tournament_results (tournament_id, team_name, placement)
                    VALUES (?, ?, ?)
                """, (pagename.lower(), team_name, placement))

                for p in tc.get("players", []):
                    p_id = p["player_id"]
                    conn.execute("""
                        INSERT INTO players (id, handle) VALUES (?, ?)
                        ON CONFLICT(id) DO UPDATE SET handle=EXCLUDED.handle
                    """, (p_id, p["handle"]))

                    conn.execute("""
                        INSERT INTO player_tournament_appearances (player_id, tournament_id, team_name, role, placement, year)
                        VALUES (?, ?, ?, ?, ?, ?)
                    """, (p_id, pagename.lower(), team_name, p.get("role", "Rifler"), placement, year_val))

        conn.commit()

    click.echo(f"Successfully rebuilt database from {len(tournament_files)} cached tournament(s).")

    # Show stats
    with db.get_connection() as conn:
        t_count = conn.execute("SELECT COUNT(*) FROM tournaments").fetchone()[0]
        p_count = conn.execute("SELECT COUNT(*) FROM players").fetchone()[0]
        a_count = conn.execute("SELECT COUNT(*) FROM player_tournament_appearances").fetchone()[0]
        click.echo(f"Stats: {t_count} tournaments, {p_count} players, {a_count} appearances.")

@cli.command()
def export_web():
    """
    Exporta todas as eras e dados do SQLite para web/data.json.
    Permite abrir o index.html como arquivo estático sem precisar de servidor.
    """
    from server import get_all_eras_from_db
    from src.config import BASE_DIR

    eras = get_all_eras_from_db()
    output_path = BASE_DIR / "web" / "data.json"
    
    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(eras, f, ensure_ascii=False, indent=2)

    click.echo(f"Exportadas {len(eras)} era(s) com sucesso para {output_path}")

if __name__ == "__main__":
    cli()
