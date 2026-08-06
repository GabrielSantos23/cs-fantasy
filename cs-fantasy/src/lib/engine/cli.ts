import { loadGameData } from "../data/loader";
import { buildFantasyTeam } from "./team-builder";
import { calculateChemistry, calculateVarianceMultiplier } from "./chemistry";
import { selectOpponents, seedIntoGroups } from "./opponent-pool";
import { simulateBracket } from "./bracket";
import { createRNG } from "../utils/random";
import type { MatchTeam, MatchResult, OpponentTeam } from "./types";

const args = process.argv.slice(2);

if (args.length < 6) {
  console.error(`
╔═══════════════════════════════════════════════════════════╗
║           CS FANTASY MAJOR — Simulation Engine            ║
╚═══════════════════════════════════════════════════════════╝

Usage: bun run simulate <p1> <p2> <p3> <p4> <p5> <coach> [seed]

  <p1..p5>   Era IDs for 5 players  (e.g. s1mple_2021)
  <coach>    Era ID for the coach   (e.g. zonic_2019)
  [seed]     Optional RNG seed      (default: random)

Example:
  bun run simulate s1mple_2021 device_2018 coldzera_2016 fallen_2017 niko_2023 gla1ve_2019
`);
  process.exit(1);
}

const playerEraIds = args.slice(0, 5);
const coachEraId = args[5];
const seed = args[6] ? parseInt(args[6], 10) : Date.now();

function divider(title?: string) {
  if (title) {
    console.log(`\n${"═".repeat(60)}`);
    console.log(`  ${title}`);
    console.log(`${"═".repeat(60)}`);
  } else {
    console.log(`${"─".repeat(60)}`);
  }
}

function formatPower(power: number): string {
  return power.toFixed(1);
}

function formatPercent(modifier: number): string {
  const pct = (modifier * 100).toFixed(1);
  return modifier >= 0 ? `+${pct}%` : `${pct}%`;
}

function printMatchResult(match: MatchResult, indent = "  ") {
  const upset = match.isUpset ? " ⚡ UPSET!" : "";
  const winner = match.winner === match.teamA.id ? match.teamA : match.teamB;
  const loser = match.winner === match.teamA.id ? match.teamB : match.teamA;

  console.log(
    `${indent}${winner.name} ${match.scoreA > match.scoreB ? match.scoreA : match.scoreB}-${match.scoreA > match.scoreB ? match.scoreB : match.scoreA} ${loser.name}${upset}`,
  );

  for (const map of match.maps) {
    console.log(
      `${indent}  Map ${map.mapNumber}: ${map.winnerTeamId === winner.id ? winner.name : loser.name} ${map.winnerRounds}-${map.loserRounds} ${map.winnerTeamId === winner.id ? loser.name : winner.name}`,
    );
  }
}

async function main() {
  console.log(`
╔═══════════════════════════════════════════════════════════╗
║           CS FANTASY MAJOR — Simulation Engine            ║
╚═══════════════════════════════════════════════════════════╝
`);

  const dataset = loadGameData();
  const rng = createRNG(seed);
  console.log(`RNG Seed: ${seed}\n`);

  divider("🎯 BUILDING YOUR TEAM");
  const team = buildFantasyTeam(playerEraIds, coachEraId, dataset);

  const chemistry = calculateChemistry(
    team.players,
    team.coach,
    dataset.coPlayMatrix,
  );
  const varianceMultiplier = calculateVarianceMultiplier(team.players);

  team.chemistry = chemistry;
  team.varianceMultiplier = varianceMultiplier;
  team.finalPower = team.basePower * (1 + chemistry.totalModifier);

  console.log("\n  ROSTER:");
  for (const p of team.players) {
    console.log(
      `    ${p.handle.padEnd(15)} | ${p.primary_role.padEnd(7)} | ${p.year} | ${p.teams.join(", ")} | Score: ${formatPower(p.total_score)}`,
    );
  }
  console.log(
    `    ${team.coach.handle.padEnd(15)} | Coach   | ${team.coach.year} | ${team.coach.teams.join(", ")} | Score: ${formatPower(team.coach.total_score)}`,
  );

  divider("⚗️  CHEMISTRY BREAKDOWN");
  for (const factor of chemistry.factors) {
    const icon = factor.modifier > 0 ? "✅" : factor.modifier < 0 ? "❌" : "➖";
    console.log(
      `  ${icon} ${factor.name.padEnd(22)} ${formatPercent(factor.modifier).padStart(7)}  — ${factor.description}`,
    );
  }
  console.log();
  console.log(`  Base Power:      ${formatPower(team.basePower)}`);
  console.log(`  Chemistry:       ${formatPercent(chemistry.totalModifier)}`);
  console.log(`  Final Power:     ${formatPower(team.finalPower)}`);
  console.log(`  Variance:        ×${varianceMultiplier}`);

  divider("🎲 SELECTING OPPONENTS");
  const userPlayerIds = team.players.map((p) => p.player_id);
  userPlayerIds.push(team.coach.player_id);

  const opponents = selectOpponents(dataset, userPlayerIds, 15, rng);

  console.log(`\n  ${opponents.length} opponents selected:\n`);
  const sortedOpponents = [...opponents].sort(
    (a, b) => b.finalPower - a.finalPower,
  );
  for (const opp of sortedOpponents) {
    console.log(
      `    ${opp.source.name.padEnd(25)} ${opp.source.year} | Power: ${formatPower(opp.finalPower)}`,
    );
  }

  divider("📋 GROUP DRAW");
  const userMatchTeam: MatchTeam = {
    id: "user-team",
    name: "Fantasy Team",
    finalPower: team.finalPower,
    varianceMultiplier: team.varianceMultiplier,
    isUserTeam: true,
  };

  const opponentMatchTeams: MatchTeam[] = opponents.map(
    (opp: OpponentTeam): MatchTeam => ({
      id: opp.source.id,
      name: `${opp.source.name} ${opp.source.year}`,
      finalPower: opp.finalPower,
      varianceMultiplier: opp.varianceMultiplier,
      isUserTeam: false,
    }),
  );

  const groups = seedIntoGroups(userMatchTeam, opponentMatchTeams, rng);

  const groupNames = ["A", "B", "C", "D"];
  for (let i = 0; i < groups.length; i++) {
    console.log(`\n  Group ${groupNames[i]}:`);
    for (const t of groups[i]) {
      const marker = t.isUserTeam ? " ⭐" : "";
      console.log(
        `    ${t.name.padEnd(30)} Power: ${formatPower(t.finalPower)}${marker}`,
      );
    }
  }

  divider("🏆 SIMULATING MAJOR");
  const bracketResult = simulateBracket(groups, rng, "user-team");

  for (const group of bracketResult.groups) {
    console.log(`\n  ── Group ${group.groupName} Results ──`);

    const sortedStandings = Object.entries(group.standings).sort(
      ([, a], [, b]) => b.wins - a.wins || a.losses - b.losses,
    );
    for (const [teamId, record] of sortedStandings) {
      const team = group.teams.find((t) => t.id === teamId)!;
      const advanced = group.advancing.some((t) => t.id === teamId);
      const marker = advanced ? " ✅" : " ❌";
      console.log(
        `    ${team.name.padEnd(30)} ${record.wins}W-${record.losses}L${marker}`,
      );
    }

    console.log();
    for (const match of group.matches) {
      printMatchResult(match, "    ");
    }
  }

  for (const round of bracketResult.playoffs) {
    console.log(`\n  ── ${round.roundName} ──`);
    for (const match of round.matches) {
      printMatchResult(match, "    ");
    }
  }

  divider("🏆 MAJOR CHAMPION");
  const userWon = bracketResult.champion.id === "user-team";

  console.log(
    `\n  🥇 Champion:   ${bracketResult.champion.name} (Power: ${formatPower(bracketResult.champion.finalPower)})`,
  );
  console.log(
    `  🥈 Runner-up:  ${bracketResult.runnerUp.name} (Power: ${formatPower(bracketResult.runnerUp.finalPower)})`,
  );

  divider("📊 YOUR TEAM'S JOURNEY");
  if (bracketResult.userTeamPath.length === 0) {
    console.log("\n  Your team didn't play any matches (unexpected!)");
  } else {
    let wins = 0;
    let losses = 0;
    for (const match of bracketResult.userTeamPath) {
      if (match.winner === "user-team") wins++;
      else losses++;
      printMatchResult(match, "    ");
    }
    console.log(`\n  Record: ${wins}W-${losses}L`);
  }

  if (userWon) {
    console.log("\n  🎉🎉🎉 YOUR TEAM WON THE MAJOR! 🎉🎉🎉");
  } else {
    console.log("\n  Better luck next time! Try a different roster or seed.");
  }

  console.log(
    `\n  Total matches simulated: ${bracketResult.allMatches.length}`,
  );
  console.log(`${"═".repeat(60)}\n`);
}

main().catch(console.error);
