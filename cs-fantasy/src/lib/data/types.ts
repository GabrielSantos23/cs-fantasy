export interface TournamentAppearance {
  tournament_id: string;
  tournament_name: string;
  tier: string;
  team: string;
  role: string;
  placement: string;
  score: number;
}

export interface TeamSummaryEntry {
  tournaments: number;
  score: number;
  placements: string[];
}

export interface EraBreakdown {
  team_summary: Record<string, TeamSummaryEntry>;
  tournaments: TournamentAppearance[];
}

export interface PlayerEra {
  id: string;
  player_id: string;
  handle: string;
  real_name: string;
  nationality: string;
  language: string;
  birth_date: string;
  photo_url: string;
  year: number;
  total_score: number;
  average_score: number;
  tournaments_count: number;
  teams: string[];
  roles: string[];
  primary_role: string;
  breakdown: EraBreakdown;
}

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

export interface RealTeam {
  id: string;
  name: string;
  year: number;
  roster_era_ids: string[];
  player_ids: string[];
  coach_id: string;
  base_power: number;
  valid_players_count: number;
}

export interface CoPlayEntry {
  tournaments_together: number;
  years_together: number[];
  first_year: number;
  last_year: number;
}

export type LanguageMap = Record<string, string>;

export interface GameDataset {
  eras: Map<string, PlayerEra>;
  erasList: PlayerEra[];
  players: Map<string, PlayerProfile>;
  realTeams: RealTeam[];
  coPlayMatrix: Map<string, CoPlayEntry>;
  languages: LanguageMap;
}

export function getCoPlayHistory(
  matrix: Map<string, CoPlayEntry>,
  playerA: string,
  playerB: string,
): CoPlayEntry | undefined {
  const sorted = [playerA, playerB].sort();
  const key = `${sorted[0]}___${sorted[1]}`;
  return matrix.get(key);
}
