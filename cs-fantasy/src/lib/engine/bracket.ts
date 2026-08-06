// ─────────────────────────────────────────────────────────────
// Bracket Simulation — runs a complete Major-style tournament
// from group stage to grand final.
// ─────────────────────────────────────────────────────────────

import type {
  MatchTeam,
  MatchResult,
  GroupResult,
  PlayoffRound,
  BracketResult,
} from "./types";
import { simulateMatch, generateMatchId } from "./match-sim";

// ── Group Stage ──────────────────────────────────────────────

/**
 * Simulate a single group (4 teams, round-robin, BO1).
 * Each team plays 3 matches. Top 2 advance.
 */
function simulateGroup(
  groupName: string,
  teams: MatchTeam[],
  rng: () => number,
  matchCounter: { value: number },
): GroupResult {
  if (teams.length !== 4) {
    throw new Error(`Group must have exactly 4 teams, got ${teams.length}`);
  }

  const standings: Record<string, { wins: number; losses: number }> = {};
  for (const t of teams) {
    standings[t.id] = { wins: 0, losses: 0 };
  }

  const matches: MatchResult[] = [];

  // Round-robin: every team plays every other team (6 matches per group)
  // Matchups: 0v1, 2v3, 0v2, 1v3, 0v3, 1v2
  const pairings: [number, number][] = [
    [0, 1],
    [2, 3],
    [0, 2],
    [1, 3],
    [0, 3],
    [1, 2],
  ];

  for (const [i, j] of pairings) {
    const matchId = generateMatchId(`group-${groupName}`, matchCounter.value++);
    const result = simulateMatch(teams[i], teams[j], "BO1", rng, matchId);
    matches.push(result);

    standings[result.winner].wins++;
    standings[result.loser].losses++;
  }

  // Sort teams by wins (descending), then tiebreak by finalPower
  const sorted = [...teams].sort((a, b) => {
    const sA = standings[a.id];
    const sB = standings[b.id];
    if (sB.wins !== sA.wins) return sB.wins - sA.wins;
    return b.finalPower - a.finalPower;
  });

  const advancing = sorted.slice(0, 2);
  const eliminated = sorted.slice(2);

  return {
    groupName,
    teams,
    matches,
    advancing,
    eliminated,
    standings,
  };
}

// ── Playoffs ─────────────────────────────────────────────────

/**
 * Simulate a single elimination playoff bracket (BO3).
 * Takes 8 teams, runs quarterfinals → semifinals → final.
 * Returns rounds and the champion.
 */
function simulatePlayoffs(
  advancingTeams: MatchTeam[],
  rng: () => number,
  matchCounter: { value: number },
): { rounds: PlayoffRound[]; champion: MatchTeam; runnerUp: MatchTeam } {
  if (advancingTeams.length !== 8) {
    throw new Error(`Playoffs require exactly 8 teams, got ${advancingTeams.length}`);
  }

  // Seed: sort by finalPower descending, then pair 1v8, 2v7, 3v6, 4v5
  const seeded = [...advancingTeams].sort((a, b) => b.finalPower - a.finalPower);
  const qfMatchups: [MatchTeam, MatchTeam][] = [
    [seeded[0], seeded[7]], // 1 vs 8
    [seeded[3], seeded[4]], // 4 vs 5
    [seeded[1], seeded[6]], // 2 vs 7
    [seeded[2], seeded[5]], // 3 vs 6
  ];

  // Quarterfinals
  const qfMatches: MatchResult[] = [];
  const qfWinners: MatchTeam[] = [];

  for (const [teamA, teamB] of qfMatchups) {
    const matchId = generateMatchId("qf", matchCounter.value++);
    const result = simulateMatch(teamA, teamB, "BO3", rng, matchId);
    qfMatches.push(result);
    qfWinners.push(result.winner === teamA.id ? teamA : teamB);
  }

  const quarterfinals: PlayoffRound = {
    roundName: "Quarterfinals",
    matches: qfMatches,
  };

  // Semifinals: winners of QF1 vs QF2, QF3 vs QF4
  const sfMatchups: [MatchTeam, MatchTeam][] = [
    [qfWinners[0], qfWinners[1]],
    [qfWinners[2], qfWinners[3]],
  ];

  const sfMatches: MatchResult[] = [];
  const sfWinners: MatchTeam[] = [];

  for (const [teamA, teamB] of sfMatchups) {
    const matchId = generateMatchId("sf", matchCounter.value++);
    const result = simulateMatch(teamA, teamB, "BO3", rng, matchId);
    sfMatches.push(result);
    sfWinners.push(result.winner === teamA.id ? teamA : teamB);
  }

  const semifinals: PlayoffRound = {
    roundName: "Semifinals",
    matches: sfMatches,
  };

  // Grand Final
  const finalMatchId = generateMatchId("final", matchCounter.value++);
  const finalResult = simulateMatch(sfWinners[0], sfWinners[1], "BO5", rng, finalMatchId);

  const champion = finalResult.winner === sfWinners[0].id ? sfWinners[0] : sfWinners[1];
  const runnerUp = finalResult.winner === sfWinners[0].id ? sfWinners[1] : sfWinners[0];

  const grandFinal: PlayoffRound = {
    roundName: "Grand Final",
    matches: [finalResult],
  };

  return {
    rounds: [quarterfinals, semifinals, grandFinal],
    champion,
    runnerUp,
  };
}

// ── Full Bracket ─────────────────────────────────────────────

/**
 * Simulate a complete Major bracket.
 *
 * @param groups - 4 groups of 4 teams (from seedIntoGroups)
 * @param rng - seeded random number generator
 * @param userTeamId - the user's team ID to track their journey
 */
export function simulateBracket(
  groups: MatchTeam[][],
  rng: () => number,
  userTeamId: string,
): BracketResult {
  if (groups.length !== 4) {
    throw new Error(`Bracket requires exactly 4 groups, got ${groups.length}`);
  }

  const matchCounter = { value: 1 };

  // Stage 1: Group stage
  const groupNames = ["A", "B", "C", "D"];
  const groupResults: GroupResult[] = [];
  const allAdvancing: MatchTeam[] = [];

  for (let i = 0; i < 4; i++) {
    const result = simulateGroup(groupNames[i], groups[i], rng, matchCounter);
    groupResults.push(result);
    allAdvancing.push(...result.advancing);
  }

  // Stage 2: Playoffs
  const { rounds: playoffRounds, champion, runnerUp } = simulatePlayoffs(
    allAdvancing,
    rng,
    matchCounter,
  );

  // Collect all matches
  const allMatches: MatchResult[] = [];
  for (const group of groupResults) {
    allMatches.push(...group.matches);
  }
  for (const round of playoffRounds) {
    allMatches.push(...round.matches);
  }

  // Extract user team's journey
  const userTeamPath = allMatches.filter(
    (m) => m.teamA.id === userTeamId || m.teamB.id === userTeamId,
  );

  return {
    champion,
    runnerUp,
    groups: groupResults,
    playoffs: playoffRounds,
    allMatches,
    userTeamPath,
  };
}
