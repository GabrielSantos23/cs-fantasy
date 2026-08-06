import type { GameDataset, PlayerEra } from "../data/types";
import type { FantasyTeam } from "./types";

/**
 * Validates and assembles a user's fantasy team.
 * 
 * @param eraIds - Array of 5 player era IDs
 * @param coachEraId - A single coach era ID
 * @param dataset - The full GameDataset to lookup era objects
 * @returns An assembled FantasyTeam with base powers calculated (chemistry deferred)
 */
export function buildFantasyTeam(
  eraIds: string[],
  coachEraId: string,
  dataset: GameDataset
): FantasyTeam {
  // Validate exact number of players
  if (!Array.isArray(eraIds) || eraIds.length !== 5) {
    throw new Error(`A fantasy team must have exactly 5 players. Received ${eraIds?.length ?? 0}.`);
  }

  // Validate coach is provided
  if (!coachEraId || typeof coachEraId !== "string") {
    throw new Error("A coach era ID is required.");
  }

  const players: PlayerEra[] = [];
  const seenPlayerIds = new Set<string>();

  // Validate and accumulate the 5 players
  for (const eraId of eraIds) {
    const era = dataset.eras.get(eraId);
    if (!era) {
      throw new Error(`Player era ID not found in dataset: ${eraId}`);
    }
    
    if (seenPlayerIds.has(era.player_id)) {
      throw new Error(`Duplicate player ID found: ${era.player_id}. A player can only be selected once.`);
    }
    
    seenPlayerIds.add(era.player_id);
    players.push(era);
  }

  // Validate the coach
  const coach = dataset.eras.get(coachEraId);
  if (!coach) {
    throw new Error(`Coach era ID not found in dataset: ${coachEraId}`);
  }

  if (seenPlayerIds.has(coach.player_id)) {
    throw new Error(`Duplicate player ID found: ${coach.player_id}. Coach cannot be a player on the team.`);
  }

  // Calculate basePower (sum of total_score of the 5 players)
  let basePower = 0;
  for (const p of players) {
    basePower += p.total_score;
  }

  // Initial chemistry is empty (to be filled by the chemistry module)
  const chemistry = {
    factors: [],
    totalModifier: 0,
  };

  return {
    players,
    coach,
    basePower,
    chemistry,
    finalPower: basePower, // finalPower is basePower until chemistry is applied
    varianceMultiplier: 1.0,
  };
}
