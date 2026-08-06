import { describe, test, expect } from "bun:test";
import { simulateBracket } from "../lib/engine/bracket";
import { createRNG } from "../lib/utils/random";
import type { MatchTeam } from "../lib/engine/types";

function createTeam(id: string, power: number): MatchTeam {
  return {
    id,
    name: id,
    finalPower: power,
    varianceMultiplier: 1.0,
    isUserTeam: id === "user-team",
  };
}

function create16Teams(): MatchTeam[][] {
  const teams: MatchTeam[] = [
    createTeam("user-team", 1000),
    createTeam("team-02", 950),
    createTeam("team-03", 900),
    createTeam("team-04", 850),
    createTeam("team-05", 800),
    createTeam("team-06", 750),
    createTeam("team-07", 700),
    createTeam("team-08", 650),
    createTeam("team-09", 600),
    createTeam("team-10", 550),
    createTeam("team-11", 500),
    createTeam("team-12", 450),
    createTeam("team-13", 400),
    createTeam("team-14", 350),
    createTeam("team-15", 300),
    createTeam("team-16", 250),
  ];

  // Distribute into 4 groups of 4
  return [
    [teams[0], teams[7], teams[8], teams[15]],
    [teams[1], teams[6], teams[9], teams[14]],
    [teams[2], teams[5], teams[10], teams[13]],
    [teams[3], teams[4], teams[11], teams[12]],
  ];
}

describe("Bracket Simulation", () => {
  test("produces exactly 1 champion", () => {
    const rng = createRNG(42);
    const groups = create16Teams();
    const result = simulateBracket(groups, rng, "user-team");

    expect(result.champion).toBeDefined();
    expect(result.champion.id).toBeTruthy();
  });

  test("champion and runner-up are different teams", () => {
    const rng = createRNG(42);
    const groups = create16Teams();
    const result = simulateBracket(groups, rng, "user-team");

    expect(result.champion.id).not.toBe(result.runnerUp.id);
  });

  test("all 4 groups produce results", () => {
    const rng = createRNG(42);
    const groups = create16Teams();
    const result = simulateBracket(groups, rng, "user-team");

    expect(result.groups).toHaveLength(4);
    for (const group of result.groups) {
      expect(group.teams).toHaveLength(4);
      expect(group.advancing).toHaveLength(2);
      expect(group.eliminated).toHaveLength(2);
      // Round-robin = 6 matches per group
      expect(group.matches).toHaveLength(6);
    }
  });

  test("playoffs have 3 rounds (QF, SF, Final)", () => {
    const rng = createRNG(42);
    const groups = create16Teams();
    const result = simulateBracket(groups, rng, "user-team");

    expect(result.playoffs).toHaveLength(3);
    expect(result.playoffs[0].roundName).toBe("Quarterfinals");
    expect(result.playoffs[0].matches).toHaveLength(4);
    expect(result.playoffs[1].roundName).toBe("Semifinals");
    expect(result.playoffs[1].matches).toHaveLength(2);
    expect(result.playoffs[2].roundName).toBe("Grand Final");
    expect(result.playoffs[2].matches).toHaveLength(1);
  });

  test("user team path is tracked correctly", () => {
    const rng = createRNG(42);
    const groups = create16Teams();
    const result = simulateBracket(groups, rng, "user-team");

    // User team should appear in at least their group matches
    expect(result.userTeamPath.length).toBeGreaterThanOrEqual(3); // 3 group matches minimum
    for (const match of result.userTeamPath) {
      const hasUserTeam =
        match.teamA.id === "user-team" || match.teamB.id === "user-team";
      expect(hasUserTeam).toBe(true);
    }
  });

  test("total matches count is correct", () => {
    const rng = createRNG(42);
    const groups = create16Teams();
    const result = simulateBracket(groups, rng, "user-team");

    // 4 groups × 6 matches = 24 group matches
    // 4 QF + 2 SF + 1 Final = 7 playoff matches
    // Total = 31
    expect(result.allMatches).toHaveLength(31);
  });

  test("QF and SF are BO3, Grand Final is BO5", () => {
    const rng = createRNG(42);
    const groups = create16Teams();
    const result = simulateBracket(groups, rng, "user-team");

    for (const round of result.playoffs) {
      if (round.roundName === "Grand Final") {
        expect(round.matches[0].format).toBe("BO5");
      } else {
        for (const match of round.matches) {
          expect(match.format).toBe("BO3");
        }
      }
    }
  });

  test("all group matches are BO1", () => {
    const rng = createRNG(42);
    const groups = create16Teams();
    const result = simulateBracket(groups, rng, "user-team");

    for (const group of result.groups) {
      for (const match of group.matches) {
        expect(match.format).toBe("BO1");
      }
    }
  });

  test("stronger teams tend to advance more often", () => {
    // Run 50 brackets and check if top-seeded teams advance more
    let topTeamAdvanced = 0;
    for (let seed = 0; seed < 50; seed++) {
      const rng = createRNG(seed);
      const groups = create16Teams();
      const result = simulateBracket(groups, rng, "user-team");

      // Check if user-team (strongest) made it to playoffs
      const userInPlayoffs = result.playoffs.some(
        (round) =>
          round.matches.some(
            (m) => m.teamA.id === "user-team" || m.teamB.id === "user-team",
          ),
      );
      if (userInPlayoffs) topTeamAdvanced++;
    }

    // With 1000 power vs average ~600, user should advance most of the time
    expect(topTeamAdvanced).toBeGreaterThan(30);
  });
});
