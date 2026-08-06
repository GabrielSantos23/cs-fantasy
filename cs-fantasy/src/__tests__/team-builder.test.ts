import { describe, test, expect } from "bun:test";
import { buildFantasyTeam } from "../lib/engine/team-builder";
import type { GameDataset, PlayerEra } from "../lib/data/types";

/** Helper to create mock player eras inline */
function createMockEra(id: string, playerId: string, totalScore: number): PlayerEra {
  return {
    id,
    player_id: playerId,
    handle: playerId,
    real_name: playerId,
    nationality: "BR",
    language: "pt",
    birth_date: "1990-01-01",
    photo_url: "",
    year: 2020,
    total_score: totalScore,
    average_score: totalScore / 5,
    tournaments_count: 5,
    teams: [],
    roles: [],
    primary_role: "Rifler",
    breakdown: { team_summary: {}, tournaments: [] },
  };
}

/** Helper to construct a minimal GameDataset for testing */
function createMockDataset(): GameDataset {
  const eras = new Map<string, PlayerEra>();
  
  const mockEras = [
    createMockEra("p1_2020", "p1", 100),
    createMockEra("p2_2020", "p2", 200),
    createMockEra("p3_2020", "p3", 300),
    createMockEra("p4_2020", "p4", 400),
    createMockEra("p5_2020", "p5", 500),
    createMockEra("coach_2020", "coach", 50),
    createMockEra("p1_2021", "p1", 150),
  ];

  for (const era of mockEras) {
    eras.set(era.id, era);
  }

  return {
    eras,
    erasList: [],
    players: new Map(),
    realTeams: [],
    coPlayMatrix: new Map(),
    languages: {},
  };
}

describe("Team Builder Module", () => {
  const dataset = createMockDataset();

  test("Valid team with 5 players + 1 coach builds successfully", () => {
    const eraIds = ["p1_2020", "p2_2020", "p3_2020", "p4_2020", "p5_2020"];
    const coachEraId = "coach_2020";

    const team = buildFantasyTeam(eraIds, coachEraId, dataset);

    expect(team.players.length).toBe(5);
    expect(team.coach.id).toBe("coach_2020");
    expect(team.basePower).toBe(1500); // 100 + 200 + 300 + 400 + 500
    expect(team.finalPower).toBe(1500);
    expect(team.chemistry.totalModifier).toBe(0);
    expect(team.chemistry.factors.length).toBe(0);
    expect(team.varianceMultiplier).toBe(1.0);
  });

  test("Non-existent era ID throws error", () => {
    const eraIds = ["p1_2020", "p2_2020", "p3_2020", "p4_2020", "nonexistent_2020"];
    const coachEraId = "coach_2020";

    expect(() => buildFantasyTeam(eraIds, coachEraId, dataset)).toThrow("Player era ID not found in dataset: nonexistent_2020");
  });

  test("Duplicate player_id throws error", () => {
    // p1_2020 and p1_2021 have the same player_id ("p1")
    const eraIds = ["p1_2020", "p2_2020", "p3_2020", "p4_2020", "p1_2021"];
    const coachEraId = "coach_2020";

    expect(() => buildFantasyTeam(eraIds, coachEraId, dataset)).toThrow("Duplicate player ID found: p1");
  });

  test("Wrong number of players (4) throws error", () => {
    const eraIds = ["p1_2020", "p2_2020", "p3_2020", "p4_2020"];
    const coachEraId = "coach_2020";

    expect(() => buildFantasyTeam(eraIds, coachEraId, dataset)).toThrow("A fantasy team must have exactly 5 players");
  });

  test("Wrong number of players (6) throws error", () => {
    const eraIds = ["p1_2020", "p2_2020", "p3_2020", "p4_2020", "p5_2020", "p1_2021"];
    const coachEraId = "coach_2020";

    expect(() => buildFantasyTeam(eraIds, coachEraId, dataset)).toThrow("A fantasy team must have exactly 5 players");
  });

  test("Missing coach throws error", () => {
    const eraIds = ["p1_2020", "p2_2020", "p3_2020", "p4_2020", "p5_2020"];
    
    expect(() => buildFantasyTeam(eraIds, "", dataset)).toThrow("A coach era ID is required");
  });

  test("Coach same player_id as a player throws error", () => {
    const eraIds = ["p1_2020", "p2_2020", "p3_2020", "p4_2020", "p5_2020"];
    // Coach is p1_2021, same player_id as p1_2020
    const coachEraId = "p1_2021";

    expect(() => buildFantasyTeam(eraIds, coachEraId, dataset)).toThrow("Duplicate player ID found: p1. Coach cannot be a player on the team.");
  });
});
