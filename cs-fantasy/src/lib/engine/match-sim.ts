import type { MatchTeam, MatchResult, MapResult } from "./types";
import { gaussianRandom } from "../utils/random";

export function generateMatchId(prefix: string, index: number): string {
  return `${prefix}-${index}`;
}

function clamp(val: number, min: number, max: number): number {
  return Math.min(Math.max(val, min), max);
}

export function simulateMatch(
  teamA: MatchTeam,
  teamB: MatchTeam,
  format: "BO1" | "BO3" | "BO5",
  rng: () => number,
  matchId?: string,
): MatchResult {
  const totalPower = teamA.finalPower + teamB.finalPower;
  const ratioA = totalPower > 0 ? teamA.finalPower / totalPower : 0.5;

  const dampingFactor = format === "BO1" ? 0.7 : format === "BO3" ? 0.85 : 0.92;
  const baseWinProbA = 0.5 + (ratioA - 0.5) * dampingFactor;

  const avgVariance = (teamA.varianceMultiplier + teamB.varianceMultiplier) / 2;

  let scoreA = 0;
  let scoreB = 0;
  const targetWins = format === "BO1" ? 1 : format === "BO3" ? 2 : 3;
  const maxMaps = format === "BO1" ? 1 : format === "BO3" ? 3 : 5;
  const maps: MapResult[] = [];

  for (let i = 0; i < maxMaps; i++) {
    if (scoreA === targetWins || scoreB === targetWins) {
      break;
    }

    const noise = gaussianRandom(rng, 0, 0.08 * avgVariance);
    const mapWinProbA = clamp(baseWinProbA + noise, 0.1, 0.9);

    const aWinsMap = rng() < mapWinProbA;
    const closeness = Math.min(mapWinProbA, 1 - mapWinProbA) * 2;
    
    let loserRounds = Math.floor(3 + closeness * 11 + gaussianRandom(rng, 0, 2));
    let winnerRounds = 16;
    
    if (loserRounds >= 15) {
      winnerRounds = loserRounds + 4;
    } else {
      loserRounds = clamp(loserRounds, 3, 14);
    }

    const mapWinnerId = aWinsMap ? teamA.id : teamB.id;
    const mapLoserId = aWinsMap ? teamB.id : teamA.id;

    maps.push({
      mapNumber: i + 1,
      winnerTeamId: mapWinnerId,
      loserTeamId: mapLoserId,
      winnerRounds,
      loserRounds
    });

    if (aWinsMap) {
      scoreA++;
    } else {
      scoreB++;
    }
  }

  const aWinsMatch = scoreA > scoreB;
  const winner = aWinsMatch ? teamA.id : teamB.id;
  const loser = aWinsMatch ? teamB.id : teamA.id;
  const powerDifference = teamA.finalPower - teamB.finalPower;
  
  let isUpset = false;
  if (aWinsMatch) {
    isUpset = teamA.finalPower < teamB.finalPower;
  } else {
    isUpset = teamB.finalPower < teamA.finalPower;
  }

  return {
    matchId: matchId || generateMatchId("match", Math.floor(rng() * 100000)),
    teamA,
    teamB,
    winner,
    loser,
    scoreA,
    scoreB,
    powerDifference,
    isUpset,
    dominantChemistryFactor: "N/A",
    maps,
    format
  };
}
