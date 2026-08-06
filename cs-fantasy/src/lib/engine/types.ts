import type { PlayerEra, RealTeam } from "../data/types";

export interface ChemistryFactor {
  name: string;
  modifier: number;
  description: string;
}

export interface ChemistryBreakdown {
  factors: ChemistryFactor[];
  totalModifier: number;
}

export interface FantasyTeam {
  players: PlayerEra[];
  coach: PlayerEra;
  basePower: number;
  chemistry: ChemistryBreakdown;
  finalPower: number;
  varianceMultiplier: number;
}

export interface OpponentTeam {
  source: RealTeam;
  playerEras: PlayerEra[];
  coachEra: PlayerEra | null;
  basePower: number;
  chemistry: ChemistryBreakdown;
  finalPower: number;
  varianceMultiplier: number;
}

export type MatchTeam = {
  id: string;
  name: string;
  finalPower: number;
  varianceMultiplier: number;
  isUserTeam: boolean;
};

export interface MapResult {
  mapNumber: number;
  winnerTeamId: string;
  loserTeamId: string;
  winnerRounds: number;
  loserRounds: number;
}

export interface MatchResult {
  matchId: string;
  teamA: MatchTeam;
  teamB: MatchTeam;
  winner: string;
  loser: string;
  scoreA: number;
  scoreB: number;
  powerDifference: number;
  isUpset: boolean;
  dominantChemistryFactor: string;
  maps: MapResult[];
  format: "BO1" | "BO3" | "BO5";
}

export interface GroupResult {
  groupName: string;
  teams: MatchTeam[];
  matches: MatchResult[];
  advancing: MatchTeam[];
  eliminated: MatchTeam[];
  standings: Record<string, { wins: number; losses: number }>;
}

export interface PlayoffRound {
  roundName: string;
  matches: MatchResult[];
}

export interface BracketResult {
  champion: MatchTeam;
  runnerUp: MatchTeam;
  groups: GroupResult[];
  playoffs: PlayoffRound[];
  allMatches: MatchResult[];
  userTeamPath: MatchResult[];
}

export type SeedTier = "strong" | "medium" | "weak";

export interface SeededTeam {
  team: MatchTeam;
  tier: SeedTier;
}
