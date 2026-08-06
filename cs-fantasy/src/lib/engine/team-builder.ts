import type { GameDataset, PlayerEra } from "../data/types";
import type { FantasyTeam } from "./types";

export function buildFantasyTeam(
  eraIds: string[],
  coachEraId: string,
  dataset: GameDataset,
): FantasyTeam {
  if (!Array.isArray(eraIds) || eraIds.length !== 5) {
    throw new Error(
      `A fantasy team must have exactly 5 players. Received ${eraIds?.length ?? 0}.`,
    );
  }

  if (!coachEraId || typeof coachEraId !== "string") {
    throw new Error("A coach era ID is required.");
  }

  const players: PlayerEra[] = [];
  const seenPlayerIds = new Set<string>();

  for (const eraId of eraIds) {
    const era = dataset.eras.get(eraId);
    if (!era) {
      throw new Error(`Player era ID not found in dataset: ${eraId}`);
    }

    if (seenPlayerIds.has(era.player_id)) {
      throw new Error(
        `Duplicate player ID found: ${era.player_id}. A player can only be selected once.`,
      );
    }

    seenPlayerIds.add(era.player_id);
    players.push(era);
  }

  const coach = dataset.eras.get(coachEraId);
  if (!coach) {
    throw new Error(`Coach era ID not found in dataset: ${coachEraId}`);
  }

  if (seenPlayerIds.has(coach.player_id)) {
    throw new Error(
      `Duplicate player ID found: ${coach.player_id}. Coach cannot be a player on the team.`,
    );
  }

  let basePower = 0;
  for (const p of players) {
    basePower += p.total_score;
  }

  const chemistry = {
    factors: [],
    totalModifier: 0,
  };

  return {
    players,
    coach,
    basePower,
    chemistry,
    finalPower: basePower,
    varianceMultiplier: 1.0,
  };
}
