// ─────────────────────────────────────────────────────────────
// Engine types — fantasy team, match results, bracket, etc.
// ─────────────────────────────────────────────────────────────

import type { PlayerEra, RealTeam } from "../data/types";

// ── Chemistry ────────────────────────────────────────────────

/** Individual chemistry factor result. */
export interface ChemistryFactor {
  name: string;
  modifier: number; // e.g. +0.08, -0.06
  description: string; // human-readable explanation
}

/** Full chemistry breakdown for a team. */
export interface ChemistryBreakdown {
  factors: ChemistryFactor[];
  totalModifier: number; // sum of all factor modifiers
}

// ── Teams ────────────────────────────────────────────────────

/** A user-assembled fantasy team. */
export interface FantasyTeam {
  players: PlayerEra[]; // exactly 5
  coach: PlayerEra; // 1 coach
  basePower: number; // sum of total_score for the 5 players
  chemistry: ChemistryBreakdown;
  finalPower: number; // basePower * (1 + chemistry.totalModifier)
  varianceMultiplier: number; // from tier-experience factor
}

/** An opponent team derived from real historical data. */
export interface OpponentTeam {
  source: RealTeam;
  playerEras: PlayerEra[]; // resolved era objects for the roster
  coachEra: PlayerEra | null; // resolved coach era (if available)
  basePower: number;
  chemistry: ChemistryBreakdown;
  finalPower: number;
  varianceMultiplier: number;
}

/** Union type for any team in a match. */
export type MatchTeam = {
  id: string;
  name: string;
  finalPower: number;
  varianceMultiplier: number;
  isUserTeam: boolean;
};

// ── Match Simulation ─────────────────────────────────────────

/** Result of a single map. */
export interface MapResult {
  mapNumber: number;
  winnerTeamId: string;
  loserTeamId: string;
  /** Simulated round score, e.g. 16-12 */
  winnerRounds: number;
  loserRounds: number;
}

/** Result of a full match (BO1 or BO3). */
export interface MatchResult {
  matchId: string;
  teamA: MatchTeam;
  teamB: MatchTeam;
  winner: string; // team id
  loser: string; // team id
  /** Maps won by each side */
  scoreA: number;
  scoreB: number;
  powerDifference: number;
  isUpset: boolean;
  /** Which chemistry factor had the largest impact */
  dominantChemistryFactor: string;
  maps: MapResult[];
  format: "BO1" | "BO3" | "BO5";
}

// ── Bracket ──────────────────────────────────────────────────

/** Result of a single group. */
export interface GroupResult {
  groupName: string; // "A", "B", "C", "D"
  teams: MatchTeam[];
  matches: MatchResult[];
  /** Teams advancing (top 2) */
  advancing: MatchTeam[];
  /** Teams eliminated */
  eliminated: MatchTeam[];
  /** Standings: team id → { wins, losses } */
  standings: Record<string, { wins: number; losses: number }>;
}

/** A round in the playoff bracket. */
export interface PlayoffRound {
  roundName: string; // "Quarterfinals", "Semifinals", "Grand Final"
  matches: MatchResult[];
}

/** Complete bracket result. */
export interface BracketResult {
  champion: MatchTeam;
  runnerUp: MatchTeam;
  groups: GroupResult[];
  playoffs: PlayoffRound[];
  allMatches: MatchResult[];
  /** The user team's journey through the bracket. */
  userTeamPath: MatchResult[];
}

// ── Seeding Tiers ────────────────────────────────────────────

export type SeedTier = "strong" | "medium" | "weak";

export interface SeededTeam {
  team: MatchTeam;
  tier: SeedTier;
}
