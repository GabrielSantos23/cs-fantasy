import type { GameDataset, PlayerEra, RealTeam } from "../data/types";
import type { OpponentTeam, MatchTeam } from "./types";
import { calculateChemistry, calculateVarianceMultiplier } from "./chemistry";
import { shuffle } from "../utils/random";

export function selectOpponents(
  dataset: GameDataset,
  userTeamPlayerIds: string[],
  count: number = 15,
  rng: () => number
): OpponentTeam[] {
  const validTeams = dataset.realTeams.filter(team => {
    if (team.valid_players_count < 5) return false;
    return !team.player_ids.some(pid => userTeamPlayerIds.includes(pid));
  });

  const opponentCandidates: OpponentTeam[] = [];
  for (const team of validTeams) {
    const playerEras: PlayerEra[] = [];
    let validRoster = true;
    
    for (const eraId of team.roster_era_ids) {
      const era = dataset.eras.get(eraId);
      if (era) {
        playerEras.push(era);
      } else {
        validRoster = false;
        break;
      }
    }
    
    if (!validRoster || playerEras.length < 5) continue;
    
    const roster = playerEras.slice(0, 5);
    
    let coachEra: PlayerEra | null = null;
    if (team.coach_id) {
      const coachEraId = `${team.coach_id}_${team.year}`;
      coachEra = dataset.eras.get(coachEraId) || null;
    }

    const basePower = roster.reduce((sum, p) => sum + p.total_score, 0);

    // Calculate chemistry — coach may be null if era not found
    // Use a dummy coach era for chemistry calc if coach era is not available
    const effectiveCoach = coachEra ?? roster[0]; // fallback to first player as coach proxy
    const chemistry = calculateChemistry(roster, effectiveCoach, dataset.coPlayMatrix);
    const varianceMultiplier = calculateVarianceMultiplier(roster);
    const finalPower = basePower * (1 + chemistry.totalModifier);

    opponentCandidates.push({
      source: team,
      playerEras: roster,
      coachEra,
      basePower,
      chemistry,
      finalPower,
      varianceMultiplier,
    });
  }

  opponentCandidates.sort((a, b) => b.finalPower - a.finalPower);

  const total = opponentCandidates.length;
  const strongCount = Math.floor(total * 0.25);
  const weakCount = Math.floor(total * 0.25);

  const strong = opponentCandidates.slice(0, strongCount);
  const medium = opponentCandidates.slice(strongCount, total - weakCount);
  const weak = opponentCandidates.slice(total - weakCount);

  const pickStrong = Math.round(count * (4 / 15));
  const pickWeak = Math.round(count * (4 / 15));
  const pickMedium = count - pickStrong - pickWeak;

  const shuffledStrong = shuffle(strong, rng);
  const shuffledMedium = shuffle(medium, rng);
  const shuffledWeak = shuffle(weak, rng);

  const selected = [
    ...shuffledStrong.slice(0, pickStrong),
    ...shuffledMedium.slice(0, pickMedium),
    ...shuffledWeak.slice(0, pickWeak),
  ];

  return selected;
}

export function seedIntoGroups(
  userTeam: MatchTeam,
  opponents: MatchTeam[],
  rng: () => number
): MatchTeam[][] {
  const allTeams = [userTeam, ...opponents];
  
  allTeams.sort((a, b) => b.finalPower - a.finalPower);
  
  const groups: MatchTeam[][] = [[], [], [], []];
  
  if (allTeams.length === 16) {
    groups[0] = [allTeams[0], allTeams[7], allTeams[8], allTeams[15]];
    groups[1] = [allTeams[1], allTeams[6], allTeams[9], allTeams[14]];
    groups[2] = [allTeams[2], allTeams[5], allTeams[10], allTeams[13]];
    groups[3] = [allTeams[3], allTeams[4], allTeams[11], allTeams[12]];
  } else {
    for (let i = 0; i < allTeams.length; i++) {
      const groupIndex = i % 8 < 4 ? i % 4 : 3 - (i % 4);
      groups[groupIndex].push(allTeams[i]);
    }
  }

  for (let i = 0; i < groups.length; i++) {
    groups[i] = shuffle(groups[i], rng);
  }

  return groups;
}
