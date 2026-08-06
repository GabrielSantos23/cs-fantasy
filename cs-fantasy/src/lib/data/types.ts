// ─────────────────────────────────────────────────────────────
// Data types — mirror the exported JSON structures from
// the CS Player Eras Database.
// ─────────────────────────────────────────────────────────────

/** A single tournament appearance inside an era breakdown. */
export interface TournamentAppearance {
  tournament_id: string;
  tournament_name: string;
  tier: string; // "Major" | "S-Tier" | "A-Tier" | "B-Tier" | "C-Tier" | "Showmatch"
  team: string;
  role: string;
  placement: string;
  score: number;
}

/** Per-team aggregation inside an era breakdown. */
export interface TeamSummaryEntry {
  tournaments: number;
  score: number;
  placements: string[];
}

/** Full breakdown of a player era (tournaments + team summaries). */
export interface EraBreakdown {
  team_summary: Record<string, TeamSummaryEntry>;
  tournaments: TournamentAppearance[];
}

/**
 * A player era — one player in one specific year.
 * Source: `eras.json`
 */
export interface PlayerEra {
  /** Unique ID, e.g. "coldzera_2016" */
  id: string;
  /** Lowercase player id, e.g. "coldzera" */
  player_id: string;
  /** Display handle, e.g. "coldzera" */
  handle: string;
  real_name: string;
  nationality: string;
  language: string;
  birth_date: string;
  photo_url: string;
  year: number;
  /** Sum of weighted tournament points in this year */
  total_score: number;
  /** Mean score per tournament */
  average_score: number;
  tournaments_count: number;
  teams: string[];
  roles: string[];
  /** Most common role in this era */
  primary_role: string;
  breakdown: EraBreakdown;
}

/**
 * Player profile summary.
 * Source: `players.json`
 */
export interface PlayerProfile {
  player_id: string;
  handle: string;
  real_name: string;
  nationality: string;
  language: string;
  birth_date: string;
  photo_url: string;
  eras_count: number;
  eras: number[];
}

/**
 * A real team from a specific year with full roster.
 * Source: `real_teams.json`
 */
export interface RealTeam {
  /** Unique ID, e.g. "Natus_Vincere_2021" */
  id: string;
  /** Team display name, e.g. "Natus Vincere" */
  name: string;
  year: number;
  /** Era IDs of the 5 players, e.g. ["s1mple_2021", ...] */
  roster_era_ids: string[];
  /** Player IDs, e.g. ["s1mple", ...] */
  player_ids: string[];
  /** Player ID of the coach */
  coach_id: string;
  /** Sum of era scores of roster players */
  base_power: number;
  valid_players_count: number;
}

/**
 * Co-play history between two players.
 * Source: `co_play_matrix.json`
 * Key format: "playerA___playerB" (alphabetical order)
 */
export interface CoPlayEntry {
  tournaments_together: number;
  years_together: number[];
  first_year: number;
  last_year: number;
}

/** Country → language mapping. Source: `languages.json` */
export type LanguageMap = Record<string, string>;

/** Full dataset loaded into memory. */
export interface GameDataset {
  eras: Map<string, PlayerEra>;
  erasList: PlayerEra[];
  players: Map<string, PlayerProfile>;
  realTeams: RealTeam[];
  coPlayMatrix: Map<string, CoPlayEntry>;
  languages: LanguageMap;
}

/**
 * Look up co-play history between two players.
 * The key is always sorted alphabetically: "playerA___playerB".
 */
export function getCoPlayHistory(
  matrix: Map<string, CoPlayEntry>,
  playerA: string,
  playerB: string,
): CoPlayEntry | undefined {
  const sorted = [playerA, playerB].sort();
  const key = `${sorted[0]}___${sorted[1]}`;
  return matrix.get(key);
}
