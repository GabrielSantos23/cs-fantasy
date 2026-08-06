import { describe, test, expect, mock } from "bun:test";
import { selectOpponents, seedIntoGroups } from "../lib/engine/opponent-pool";
import type { GameDataset, PlayerEra, RealTeam, CoPlayEntry } from "../lib/data/types";
import type { MatchTeam } from "../lib/engine/types";
import { createRNG } from "../lib/utils/random";

mock.module("../lib/engine/chemistry", () => ({
  calculateChemistry: () => ({
    factors: [],
    totalModifier: 0.1,
  }),
  calculateVarianceMultiplier: () => 1.0,
}));

describe("Opponent Pool", () => {
  const generateMockDataset = (): GameDataset => {
    const eras = new Map<string, PlayerEra>();
    const realTeams: RealTeam[] = [];

    for (let i = 1; i <= 30; i++) {
      const teamId = `team_${i}`;
      const year = 2020;
      
      const roster_era_ids: string[] = [];
      const player_ids: string[] = [];
      
      let basePower = 0;
      
      for (let p = 1; p <= 5; p++) {
        const playerId = `player_${i}_${p}`;
        const eraId = `${playerId}_${year}`;
        
        roster_era_ids.push(eraId);
        player_ids.push(playerId);
        
        const score = 1000 + i * 10;
        basePower += score;
        
        eras.set(eraId, {
          id: eraId,
          player_id: playerId,
          handle: playerId,
          real_name: `Name ${playerId}`,
          nationality: "US",
          language: "en",
          birth_date: "1990-01-01",
          photo_url: "",
          year,
          total_score: score,
          average_score: score / 10,
          tournaments_count: 10,
          teams: [teamId],
          roles: ["rifler"],
          primary_role: "rifler",
          breakdown: { team_summary: {}, tournaments: [] }
        });
      }

      realTeams.push({
        id: teamId,
        name: `Team ${i}`,
        year,
        roster_era_ids,
        player_ids,
        coach_id: `coach_${i}`,
        base_power: basePower,
        valid_players_count: 5,
      });
    }
    
    realTeams.push({
      id: "invalid_team_1",
      name: "Invalid Team 1",
      year: 2020,
      roster_era_ids: [],
      player_ids: [],
      coach_id: "",
      base_power: 0,
      valid_players_count: 4,
    });
    
    realTeams.push({
      id: "invalid_team_2",
      name: "Invalid Team 2",
      year: 2020,
      roster_era_ids: ["missing_era_1", "missing_era_2", "missing_era_3", "missing_era_4", "missing_era_5"],
      player_ids: ["p1", "p2", "p3", "p4", "p5"],
      coach_id: "",
      base_power: 5000,
      valid_players_count: 5,
    });

    return {
      eras,
      erasList: Array.from(eras.values()),
      players: new Map(),
      realTeams,
      coPlayMatrix: new Map<string, CoPlayEntry>(),
      languages: {},
    };
  };

  test("selectOpponents returns exact requested number of valid teams", () => {
    const dataset = generateMockDataset();
    const rng = createRNG(12345);
    const opponents = selectOpponents(dataset, [], 15, rng);

    expect(opponents.length).toBe(15);
    
    for (const opp of opponents) {
      expect(opp.playerEras.length).toBe(5);
      expect(opp.source.valid_players_count).toBeGreaterThanOrEqual(5);
    }
  });

  test("selectOpponents excludes teams with user's players", () => {
    const dataset = generateMockDataset();
    const rng = createRNG(12345);
    
    const userTeamPlayerIds = ["player_1_1", "player_2_1"];
    
    const opponents = selectOpponents(dataset, userTeamPlayerIds, 15, rng);
    
    const opponentTeamIds = opponents.map(o => o.source.id);
    expect(opponentTeamIds).not.toContain("team_1");
    expect(opponentTeamIds).not.toContain("team_2");
  });
  
  test("selectOpponents balances tiers correctly without duplicates", () => {
    const dataset = generateMockDataset();
    const rng = createRNG(12345);
    const opponents = selectOpponents(dataset, [], 15, rng);
    
    expect(opponents.length).toBe(15);
    const uniqueIds = new Set(opponents.map(o => o.source.id));
    expect(uniqueIds.size).toBe(15);
  });

  test("seedIntoGroups serpentine logic works for 16 teams", () => {
    const rng = createRNG(12345);
    
    const createTeam = (id: string, power: number): MatchTeam => ({
      id,
      name: `Team ${id}`,
      finalPower: power,
      varianceMultiplier: 1,
      isUserTeam: false
    });

    const opponents: MatchTeam[] = Array.from({ length: 15 }).map((_, i) => createTeam(`opp_${i}`, 1500 - i * 10));
    const userTeam: MatchTeam = { ...createTeam("user_team", 2000), isUserTeam: true };
    
    const groups = seedIntoGroups(userTeam, opponents, rng);
    
    expect(groups.length).toBe(4);
    for (const group of groups) {
      expect(group.length).toBe(4);
    }

    const group0Ids = groups[0].map(t => t.id);
    expect(group0Ids).toContain("user_team"); 
    expect(group0Ids).toContain("opp_6");
    expect(group0Ids).toContain("opp_7");
    expect(group0Ids).toContain("opp_14");
    
    const group1Ids = groups[1].map(t => t.id);
    expect(group1Ids).toContain("opp_0"); 
    expect(group1Ids).toContain("opp_5"); 
    expect(group1Ids).toContain("opp_8"); 
    expect(group1Ids).toContain("opp_13"); 
  });
});
