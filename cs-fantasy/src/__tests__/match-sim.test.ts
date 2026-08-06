import { describe, test, expect } from "bun:test";
import { simulateMatch, generateMatchId } from "../lib/engine/match-sim";
import { createRNG } from "../lib/utils/random";
import type { MatchTeam } from "../lib/engine/types";

describe("Match Simulation", () => {
  const createTeam = (id: string, power: number, variance: number): MatchTeam => ({
    id,
    name: `Team ${id}`,
    finalPower: power,
    varianceMultiplier: variance,
    isUserTeam: false,
  });

  test("generateMatchId creates correct format", () => {
    expect(generateMatchId("grpA", 1)).toBe("grpA-1");
  });

  test("Favorite wins more often than underdog over 1000 BO1 simulations (55-70% range)", () => {
    const rng = createRNG(42);
    const favorite = createTeam("FAV", 140, 1.0);
    const underdog = createTeam("UND", 100, 1.0);

    let favWins = 0;
    const iters = 1000;
    for (let i = 0; i < iters; i++) {
      const result = simulateMatch(favorite, underdog, "BO1", rng);
      if (result.winner === "FAV") favWins++;
    }

    const winRate = favWins / iters;
    expect(winRate).toBeGreaterThanOrEqual(0.55);
    expect(winRate).toBeLessThanOrEqual(0.70);
  });

  test("BO3 is more consistent than BO1", () => {
    const rng = createRNG(42);
    const favorite = createTeam("FAV", 140, 1.0);
    const underdog = createTeam("UND", 100, 1.0);

    let favWinsBO1 = 0;
    let favWinsBO3 = 0;
    const iters = 1000;

    for (let i = 0; i < iters; i++) {
      if (simulateMatch(favorite, underdog, "BO1", rng).winner === "FAV") favWinsBO1++;
      if (simulateMatch(favorite, underdog, "BO3", rng).winner === "FAV") favWinsBO3++;
    }

    expect(favWinsBO3 / iters).toBeGreaterThan(favWinsBO1 / iters);
  });

  test("Upsets can happen", () => {
    const rng = createRNG(123);
    const favorite = createTeam("FAV", 120, 1.0);
    const underdog = createTeam("UND", 100, 1.0);

    let hasUpset = false;
    for (let i = 0; i < 1000; i++) {
      const result = simulateMatch(favorite, underdog, "BO1", rng);
      if (result.isUpset) {
        hasUpset = true;
        break;
      }
    }
    expect(hasUpset).toBe(true);
  });

  test("Match result has all required fields populated and scores are valid", () => {
    const rng = createRNG(42);
    const teamA = createTeam("A", 110, 1.0);
    const teamB = createTeam("B", 110, 1.0);

    // BO1
    const resultBO1 = simulateMatch(teamA, teamB, "BO1", rng, "match-1");
    expect(resultBO1.matchId).toBe("match-1");
    expect(resultBO1.teamA).toEqual(teamA);
    expect(resultBO1.teamB).toEqual(teamB);
    expect(["A", "B"]).toContain(resultBO1.winner);
    expect(["A", "B"]).toContain(resultBO1.loser);
    expect(resultBO1.winner).not.toBe(resultBO1.loser);
    expect(resultBO1.scoreA + resultBO1.scoreB).toBe(1);
    expect(resultBO1.maps.length).toBe(1);
    expect(resultBO1.format).toBe("BO1");
    expect(resultBO1.dominantChemistryFactor).toBe("N/A");
    expect(typeof resultBO1.powerDifference).toBe("number");
    expect(typeof resultBO1.isUpset).toBe("boolean");

    // Check round scores
    const map = resultBO1.maps[0];
    expect(map.winnerRounds).toBeGreaterThanOrEqual(16);
    expect(map.loserRounds).toBeGreaterThanOrEqual(3);
    if (map.winnerRounds === 16) {
      expect(map.loserRounds).toBeLessThanOrEqual(14);
    } else {
      expect(map.winnerRounds).toBe(map.loserRounds + 4);
    }

    // BO3
    const resultBO3 = simulateMatch(teamA, teamB, "BO3", rng, "match-2");
    const totalMaps = resultBO3.scoreA + resultBO3.scoreB;
    expect([2, 3]).toContain(totalMaps);
    expect(resultBO3.maps.length).toBe(totalMaps);
    if (resultBO3.winner === "A") {
      expect(resultBO3.scoreA).toBe(2);
      expect(resultBO3.scoreB).toBeLessThan(2);
    } else {
      expect(resultBO3.scoreB).toBe(2);
      expect(resultBO3.scoreA).toBeLessThan(2);
    }
  });

  test("Two evenly matched teams win roughly 50/50", () => {
    const rng = createRNG(42);
    const teamA = createTeam("A", 100, 1.0);
    const teamB = createTeam("B", 100, 1.0);

    let winsA = 0;
    const iters = 1000;
    for (let i = 0; i < iters; i++) {
      if (simulateMatch(teamA, teamB, "BO1", rng).winner === "A") {
        winsA++;
      }
    }
    const winRateA = winsA / iters;
    expect(winRateA).toBeGreaterThan(0.45);
    expect(winRateA).toBeLessThan(0.55);
  });

  test("Very mismatched teams: strong team wins >80% in BO3", () => {
    const rng = createRNG(42);
    const strong = createTeam("STRONG", 300, 1.0);
    const weak = createTeam("WEAK", 80, 1.0);

    let strongWins = 0;
    const iters = 1000;
    for (let i = 0; i < iters; i++) {
      if (simulateMatch(strong, weak, "BO3", rng).winner === "STRONG") {
        strongWins++;
      }
    }
    const winRate = strongWins / iters;
    expect(winRate).toBeGreaterThan(0.80);
  });
});
