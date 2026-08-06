import { describe, test, expect } from "bun:test";
import { calculateChemistry, calculateVarianceMultiplier } from "../lib/engine/chemistry";
import type { PlayerEra, CoPlayEntry } from "../lib/data/types";

function createMockPlayer(id: string, overrides: Partial<PlayerEra> = {}): PlayerEra {
  return {
    id: id,
    player_id: id,
    handle: `Player ${id}`,
    real_name: `Real ${id}`,
    nationality: "Unknown",
    year: 2020,
    total_score: 100,
    average_score: 50,
    tournaments_count: 2,
    teams: ["Mock Team"],
    roles: ["Rifler"],
    primary_role: "Rifler",
    language: "English",
    birth_date: "1995-01-01",
    photo_url: "",
    breakdown: {
      team_summary: {},
      tournaments: [],
    },
    ...overrides,
  };
}

describe("Chemistry Calculator", () => {
  const coPlayMatrix = new Map<string, CoPlayEntry>();

  test("LANGUAGE_BONUS: All same language → +0.08", () => {
    const p1 = createMockPlayer("p1", { language: "English" });
    const p2 = createMockPlayer("p2", { language: "English" });
    const p3 = createMockPlayer("p3", { language: "English" });
    const p4 = createMockPlayer("p4", { language: "English" });
    const p5 = createMockPlayer("p5", { language: "English" });
    const coach = createMockPlayer("c1", { language: "English" });

    const breakdown = calculateChemistry([p1, p2, p3, p4, p5], coach, coPlayMatrix);
    const factor = breakdown.factors.find((f) => f.name === "LANGUAGE_BONUS");
    expect(factor?.modifier).toBe(0.08);
  });

  test("LANGUAGE_BONUS: No shared language → -0.06", () => {
    const players = [
      createMockPlayer("p1", { language: "English" }),
      createMockPlayer("p2", { language: "Danish" }),
      createMockPlayer("p3", { language: "Swedish" }),
      createMockPlayer("p4", { language: "French" }),
      createMockPlayer("p5", { language: "Russian" }),
    ];
    const coach = createMockPlayer("c1", { language: "Portuguese" });

    const breakdown = calculateChemistry(players, coach, coPlayMatrix);
    const factor = breakdown.factors.find((f) => f.name === "LANGUAGE_BONUS");
    expect(factor?.modifier).toBe(-0.06);
  });

  test("ROLE_BALANCE: Balanced roles (IGL + AWPer) → +0.05", () => {
    const players = [
      createMockPlayer("p1", { primary_role: "IGL" }),
      createMockPlayer("p2", { primary_role: "AWPer" }),
      createMockPlayer("p3", { primary_role: "Rifler" }),
      createMockPlayer("p4", { primary_role: "Rifler" }),
      createMockPlayer("p5", { primary_role: "Support" }),
    ];
    const coach = createMockPlayer("c1");
    const breakdown = calculateChemistry(players, coach, coPlayMatrix);
    const factor = breakdown.factors.find((f) => f.name === "ROLE_BALANCE");
    expect(factor?.modifier).toBe(0.05);
  });

  test("ROLE_BALANCE: Missing IGL → -0.08 (and missing AWPer → -0.04)", () => {
    const players = [
      createMockPlayer("p1", { primary_role: "Rifler" }),
      createMockPlayer("p2", { primary_role: "AWPer" }),
      createMockPlayer("p3", { primary_role: "Lurker" }),
      createMockPlayer("p4", { primary_role: "Entry" }),
      createMockPlayer("p5", { primary_role: "Support" }),
    ];
    const coach = createMockPlayer("c1");
    const breakdown = calculateChemistry(players, coach, coPlayMatrix);
    const factor = breakdown.factors.find((f) => f.name === "ROLE_BALANCE");
    expect(factor?.modifier).toBe(-0.08);
  });

  test("ROLE_BALANCE: All same role → -0.27 (IGL miss + AWPer miss + 5-same)", () => {
    const players = [
      createMockPlayer("p1", { primary_role: "Rifler" }),
      createMockPlayer("p2", { primary_role: "Rifler" }),
      createMockPlayer("p3", { primary_role: "Rifler" }),
      createMockPlayer("p4", { primary_role: "Rifler" }),
      createMockPlayer("p5", { primary_role: "Rifler" }),
    ];
    const coach = createMockPlayer("c1");
    const breakdown = calculateChemistry(players, coach, coPlayMatrix);
    const factor = breakdown.factors.find((f) => f.name === "ROLE_BALANCE");
    // -0.08 (no IGL) + -0.04 (no AWPer) + -0.15 (5 same) = -0.27
    expect(factor?.modifier).toBeCloseTo(-0.27);
  });

  test("ERA_COMPAT: Close eras (gap ≤ 3) → +0.03", () => {
    const players = [
      createMockPlayer("p1", { year: 2020 }),
      createMockPlayer("p2", { year: 2021 }),
      createMockPlayer("p3", { year: 2019 }),
      createMockPlayer("p4", { year: 2022 }),
      createMockPlayer("p5", { year: 2020 }),
    ];
    const coach = createMockPlayer("c1");
    const breakdown = calculateChemistry(players, coach, coPlayMatrix);
    const factor = breakdown.factors.find((f) => f.name === "ERA_COMPAT");
    expect(factor?.modifier).toBe(0.03);
  });

  test("ERA_COMPAT: Wide era gap (> 12) → -0.08", () => {
    const players = [
      createMockPlayer("p1", { year: 2005 }),
      createMockPlayer("p2", { year: 2020 }),
      createMockPlayer("p3", { year: 2019 }),
      createMockPlayer("p4", { year: 2022 }),
      createMockPlayer("p5", { year: 2020 }),
    ];
    const coach = createMockPlayer("c1");
    const breakdown = calculateChemistry(players, coach, coPlayMatrix);
    const factor = breakdown.factors.find((f) => f.name === "ERA_COMPAT");
    expect(factor?.modifier).toBe(-0.08);
  });

  test("GENERATION_GAP: Close ages → +0.02", () => {
    const players = [
      createMockPlayer("p1", { birth_date: "1995-01-01" }),
      createMockPlayer("p2", { birth_date: "1996-01-01" }),
      createMockPlayer("p3", { birth_date: "1997-01-01" }),
      createMockPlayer("p4", { birth_date: "1994-01-01" }),
      createMockPlayer("p5", { birth_date: "1995-01-01" }),
    ];
    const coach = createMockPlayer("c1");
    const breakdown = calculateChemistry(players, coach, coPlayMatrix);
    const factor = breakdown.factors.find((f) => f.name === "GENERATION_GAP");
    expect(factor?.modifier).toBe(0.02);
  });

  test("TIER_EXPERIENCE: Few appearances → variance 1.2", () => {
    const players = [
      createMockPlayer("p1", { breakdown: { team_summary: {}, tournaments: [{ tournament_id: "t1", tournament_name: "M1", tier: "Major", team: "T", role: "R", placement: "1", score: 100 }] } }),
      createMockPlayer("p2", { breakdown: { team_summary: {}, tournaments: [{ tournament_id: "t2", tournament_name: "S1", tier: "S-Tier", team: "T", role: "R", placement: "2", score: 70 }] } }),
      createMockPlayer("p3", { breakdown: { team_summary: {}, tournaments: [] } }),
      createMockPlayer("p4", { breakdown: { team_summary: {}, tournaments: [] } }),
      createMockPlayer("p5", { breakdown: { team_summary: {}, tournaments: [] } }),
    ];
    expect(calculateVarianceMultiplier(players)).toBe(1.2);
  });

  test("ROSTER_STABILITY & COPLAY & COACH: History exists", () => {
    const mockMatrix = new Map<string, CoPlayEntry>();
    mockMatrix.set("p1___p2", { tournaments_together: 5, years_together: [2019, 2020], first_year: 2019, last_year: 2020 });
    mockMatrix.set("c1___p1", { tournaments_together: 2, years_together: [2020], first_year: 2020, last_year: 2020 });

    const players = [
      createMockPlayer("p1"),
      createMockPlayer("p2"),
      createMockPlayer("p3"),
      createMockPlayer("p4"),
      createMockPlayer("p5"),
    ];
    const coach = createMockPlayer("c1");

    const breakdown = calculateChemistry(players, coach, mockMatrix);
    const coplay = breakdown.factors.find((f) => f.name === "COPLAY_BONUS");
    const coachHistory = breakdown.factors.find((f) => f.name === "COACH_HISTORY");
    const stability = breakdown.factors.find((f) => f.name === "ROSTER_STABILITY");

    expect(coplay?.modifier).toBe(0.05); // 5 tournaments * 0.01, capped at 0.05
    expect(coachHistory?.modifier).toBe(0.02); // 1 player with history
    expect(stability?.modifier).toBe(-0.02); // 1 pair with history → range 1-3
  });

  test("FULL CALCULATION: Total modifier is correct sum", () => {
    const players = [
      createMockPlayer("p1", { language: "English", primary_role: "IGL", year: 2020 }),
      createMockPlayer("p2", { language: "English", primary_role: "AWPer", year: 2020 }),
      createMockPlayer("p3", { language: "English", primary_role: "Rifler", year: 2020 }),
      createMockPlayer("p4", { language: "English", primary_role: "Rifler", year: 2020 }),
      createMockPlayer("p5", { language: "English", primary_role: "Support", year: 2020 }),
    ];
    const coach = createMockPlayer("c1", { language: "English" });

    const breakdown = calculateChemistry(players, coach, coPlayMatrix);
    // Language: +0.08
    // Co-play: 0
    // Role balance: +0.05
    // Era compat: +0.03
    // Tier experience: 0
    // Roster stability: -0.06
    // Coach history: 0
    // Generation gap: +0.02
    // Expected total: 0.12
    expect(breakdown.totalModifier).toBeCloseTo(0.12);
  });
});
