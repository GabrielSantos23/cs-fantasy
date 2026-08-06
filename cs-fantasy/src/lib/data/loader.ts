import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import type {
  GameDataset,
  PlayerEra,
  PlayerProfile,
  RealTeam,
  CoPlayEntry,
  LanguageMap,
} from "./types";

function dataPath(filename: string): string {
  const currentDir =
    typeof __dirname !== "undefined"
      ? __dirname
      : dirname(fileURLToPath(import.meta.url));
  return resolve(currentDir, "..", "..", "..", "data", filename);
}

function readJSON<T>(filename: string): T {
  const path = dataPath(filename);
  const raw = readFileSync(path, "utf-8");
  return JSON.parse(raw) as T;
}

export function loadGameData(): GameDataset {
  console.log("Loading game data...");

  const erasArray = readJSON<PlayerEra[]>("eras.json");
  const eras = new Map<string, PlayerEra>();
  for (const era of erasArray) {
    eras.set(era.id, era);
  }
  console.log(`  ✓ ${eras.size} player eras loaded`);

  const playersRaw = readJSON<Record<string, PlayerProfile>>("players.json");
  const players = new Map<string, PlayerProfile>();
  for (const [id, profile] of Object.entries(playersRaw)) {
    players.set(id, profile);
  }
  console.log(`  ✓ ${players.size} players loaded`);

  const realTeams = readJSON<RealTeam[]>("real_teams.json");
  console.log(`  ✓ ${realTeams.length} real teams loaded`);

  const coPlayRaw = readJSON<Record<string, CoPlayEntry>>(
    "co_play_matrix.json",
  );
  const coPlayMatrix = new Map<string, CoPlayEntry>();
  for (const [key, entry] of Object.entries(coPlayRaw)) {
    coPlayMatrix.set(key, entry);
  }
  console.log(`  ✓ ${coPlayMatrix.size} co-play pairs loaded`);

  const languages = readJSON<LanguageMap>("languages.json");
  console.log(`  ✓ ${Object.keys(languages).length} language mappings loaded`);

  console.log("Game data loaded successfully!\n");

  return {
    eras,
    erasList: erasArray,
    players,
    realTeams,
    coPlayMatrix,
    languages,
  };
}

export function getCoPlayHistory(
  matrix: Map<string, CoPlayEntry>,
  playerA: string,
  playerB: string,
): CoPlayEntry | undefined {
  const sorted = [playerA, playerB].sort();
  const key = `${sorted[0]}___${sorted[1]}`;
  return matrix.get(key);
}
