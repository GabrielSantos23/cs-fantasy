import type { PlayerEra, CoPlayEntry } from "../data/types";
import { getCoPlayHistory } from "../data/types";
import type { ChemistryBreakdown, ChemistryFactor } from "./types";

export function calculateChemistry(
  players: PlayerEra[], // exactly 5
  coach: PlayerEra,
  coPlayMatrix: Map<string, CoPlayEntry>,
): ChemistryBreakdown {
  const factors: ChemistryFactor[] = [];
  let totalModifier = 0;

  const addFactor = (name: string, modifier: number, desc: string) => {
    factors.push({ name, modifier, description: desc });
    totalModifier += modifier;
  };

  // Factor 1: Language (LANGUAGE_BONUS)
  const langCounts = new Map<string, number>();
  for (const p of [...players, coach]) {
    langCounts.set(p.language, (langCounts.get(p.language) || 0) + 1);
  }
  let maxLangCount = 0;
  for (const count of langCounts.values()) {
    if (count > maxLangCount) maxLangCount = count;
  }
  if (maxLangCount === 6) {
    addFactor("LANGUAGE_BONUS", 0.08, "All 6 share same language");
  } else if (maxLangCount === 5) {
    addFactor("LANGUAGE_BONUS", 0.06, "5 share same language");
  } else if (maxLangCount === 4) {
    addFactor("LANGUAGE_BONUS", 0.04, "4 share same language");
  } else if (maxLangCount === 3) {
    addFactor("LANGUAGE_BONUS", 0.03, "3 share same language");
  } else if (maxLangCount < 2) {
    addFactor("LANGUAGE_BONUS", -0.06, "No pair shares a language");
  } else {
    addFactor("LANGUAGE_BONUS", 0, "Mixed languages");
  }

  // Factor 2: Co-Play History (COPLAY_BONUS)
  let coPlayMod = 0;
  for (let i = 0; i < players.length; i++) {
    for (let j = i + 1; j < players.length; j++) {
      const entry = getCoPlayHistory(coPlayMatrix, players[i].player_id, players[j].player_id);
      if (entry && entry.tournaments_together > 0) {
        coPlayMod += Math.min(0.05, entry.tournaments_together * 0.01);
      }
    }
  }
  coPlayMod = Math.min(0.15, coPlayMod);
  addFactor("COPLAY_BONUS", coPlayMod, "Co-play history among players");

  // Factor 3: Role Balance (ROLE_BALANCE)
  let iglCount = 0;
  let awperCount = 0;
  const roleCounts = new Map<string, number>();
  for (const p of players) {
    if (p.primary_role === "IGL") iglCount++;
    if (p.primary_role === "AWPer") awperCount++;
    roleCounts.set(p.primary_role, (roleCounts.get(p.primary_role) || 0) + 1);
  }

  let roleMod = 0;
  if (iglCount >= 1 && awperCount >= 1) {
    roleMod += 0.05;
  }
  if (iglCount === 0) {
    roleMod -= 0.08;
  }
  if (awperCount === 0) {
    roleMod -= 0.04;
  }

  let allSameRole = false;
  for (const count of roleCounts.values()) {
    if (count === 5) {
      allSameRole = true;
      break;
    }
  }

  if (allSameRole) {
    roleMod -= 0.15;
  } else {
    for (const count of roleCounts.values()) {
      if (count > 2) {
        roleMod -= 0.03 * (count - 2);
      }
    }
  }
  addFactor("ROLE_BALANCE", roleMod, "Role balance evaluation");

  // Factor 4: Era Compatibility (ERA_COMPAT)
  let minYear = Infinity;
  let maxYear = -Infinity;
  for (const p of players) {
    if (p.year < minYear) minYear = p.year;
    if (p.year > maxYear) maxYear = p.year;
  }
  const yearGap = maxYear - minYear;
  let eraMod = 0;
  if (yearGap <= 3) eraMod = 0.03;
  else if (yearGap >= 4 && yearGap <= 7) eraMod = 0;
  else if (yearGap >= 8 && yearGap <= 12) eraMod = -0.04;
  else if (yearGap > 12) eraMod = -0.08;
  addFactor("ERA_COMPAT", eraMod, `Era gap: ${yearGap} years`);

  // Factor 5: Tier Experience (TIER_EXPERIENCE)
  addFactor("TIER_EXPERIENCE", 0, "Tier experience sets variance multiplier");

  // Factor 6: Roster Stability (ROSTER_STABILITY)
  let pairsWithHistory = 0;
  for (let i = 0; i < players.length; i++) {
    for (let j = i + 1; j < players.length; j++) {
      const entry = getCoPlayHistory(coPlayMatrix, players[i].player_id, players[j].player_id);
      if (entry && entry.tournaments_together > 0) {
        pairsWithHistory++;
      }
    }
  }
  let stabilityMod = 0;
  if (pairsWithHistory === 0) stabilityMod = -0.06;
  else if (pairsWithHistory >= 1 && pairsWithHistory <= 3) stabilityMod = -0.02;
  else if (pairsWithHistory >= 4 && pairsWithHistory <= 6) stabilityMod = 0.02;
  else if (pairsWithHistory >= 7 && pairsWithHistory <= 9) stabilityMod = 0.04;
  else if (pairsWithHistory === 10) stabilityMod = 0.08;
  addFactor("ROSTER_STABILITY", stabilityMod, `Roster stability: ${pairsWithHistory} known pairs`);

  // Factor 7: Coach History (COACH_HISTORY)
  let coachMod = 0;
  for (const p of players) {
    const entry = getCoPlayHistory(coPlayMatrix, coach.player_id, p.player_id);
    if (entry && entry.tournaments_together > 0) {
      coachMod += 0.02;
    }
  }
  coachMod = Math.min(0.08, coachMod);
  addFactor("COACH_HISTORY", coachMod, "Coach familiarity with players");

  // Factor 8: Generation Gap (GENERATION_GAP)
  let minBirthYear = Infinity;
  let maxBirthYear = -Infinity;
  let skipGenGap = false;
  for (const p of players) {
    if (!p.birth_date) {
      skipGenGap = true;
      break;
    }
    const yearStr = p.birth_date.split(/[-/]/)[0];
    if (!yearStr) {
      skipGenGap = true;
      break;
    }
    const year = parseInt(yearStr, 10);
    if (isNaN(year)) {
      skipGenGap = true;
      break;
    }
    if (year < minBirthYear) minBirthYear = year;
    if (year > maxBirthYear) maxBirthYear = year;
  }

  if (skipGenGap) {
    addFactor("GENERATION_GAP", 0, "Missing or unparseable birth dates");
  } else {
    const ageGap = maxBirthYear - minBirthYear;
    let genMod = 0;
    if (ageGap <= 5) genMod = 0.02;
    else if (ageGap >= 6 && ageGap <= 10) genMod = 0;
    else if (ageGap > 10) genMod = -0.03;
    addFactor("GENERATION_GAP", genMod, `Generation gap: ${ageGap} years`);
  }

  return {
    factors,
    totalModifier: Number(totalModifier.toFixed(4)),
  };
}

export function calculateVarianceMultiplier(players: PlayerEra[]): number {
  let totalTierApps = 0;
  for (const p of players) {
    if (p.breakdown && p.breakdown.tournaments) {
      for (const t of p.breakdown.tournaments) {
        if (t.tier === "Major" || t.tier === "S-Tier") {
          totalTierApps++;
        }
      }
    }
  }
  if (totalTierApps < 3) return 1.2;
  if (totalTierApps >= 3 && totalTierApps <= 15) return 1.0;
  return 0.9;
}
