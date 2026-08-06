-- Database Schema for Counter-Strike Player Eras

CREATE TABLE IF NOT EXISTS players (
    id TEXT PRIMARY KEY,
    handle TEXT NOT NULL,
    real_name TEXT,
    birth_date TEXT,
    nationality TEXT,
    photo_url TEXT,
    liquipedia_url TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS tournaments (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    start_date TEXT,
    end_date TEXT,
    year INTEGER,
    tier TEXT,
    format TEXT,
    liquipedia_url TEXT,
    raw_json_path TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS tournament_results (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    tournament_id TEXT NOT NULL,
    team_name TEXT NOT NULL,
    placement TEXT NOT NULL,
    placement_numeric INTEGER,
    prize_money REAL,
    FOREIGN KEY (tournament_id) REFERENCES tournaments (id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS player_tournament_appearances (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    player_id TEXT NOT NULL,
    tournament_id TEXT NOT NULL,
    team_name TEXT NOT NULL,
    role TEXT,
    placement TEXT NOT NULL,
    year INTEGER NOT NULL,
    FOREIGN KEY (player_id) REFERENCES players (id) ON DELETE CASCADE,
    FOREIGN KEY (tournament_id) REFERENCES tournaments (id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS player_eras (
    id TEXT PRIMARY KEY, -- e.g. fallen_2017
    player_id TEXT NOT NULL,
    year INTEGER NOT NULL,
    total_score REAL NOT NULL DEFAULT 0.0,
    average_score REAL NOT NULL DEFAULT 0.0,
    tournaments_count INTEGER NOT NULL DEFAULT 0,
    teams_json TEXT NOT NULL, -- JSON array of teams
    roles_json TEXT NOT NULL, -- JSON array of roles
    breakdown_json TEXT NOT NULL, -- Detailed breakdown per tournament & team
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (player_id) REFERENCES players (id) ON DELETE CASCADE,
    UNIQUE(player_id, year)
);

CREATE INDEX IF NOT EXISTS idx_appearances_player_year ON player_tournament_appearances (player_id, year);
CREATE INDEX IF NOT EXISTS idx_tournaments_year ON tournaments (year);
