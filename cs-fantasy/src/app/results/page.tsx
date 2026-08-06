"use client";

import React, { useMemo, useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useGameData } from "../../hooks/useGameData";
import { buildFantasyTeam } from "../../lib/engine/team-builder";
import {
  calculateChemistry,
  calculateVarianceMultiplier,
} from "../../lib/engine/chemistry";
import {
  selectOpponents,
  seedIntoGroups,
} from "../../lib/engine/opponent-pool";
import { simulateBracket } from "../../lib/engine/bracket";
import { createRNG } from "../../lib/utils/random";
import type {
  BracketResult,
  MatchTeam,
  OpponentTeam,
  MatchResult,
} from "../../lib/engine/types";
import { GroupTable } from "../../components/GroupTable";
import { BracketView } from "../../components/BracketView";
import { ChemistryBar } from "../../components/ChemistryBar";
import { Button } from "@/components/ui/button";
import {
  Crosshair,
  Trophy,
  Crown,
  Loader2,
  AlertTriangle,
  RefreshCw,
  Pencil,
  Zap,
  Play,
  Pause,
  FastForward,
  SkipForward,
  Flame,
  CheckCircle2,
} from "lucide-react";

function ResultsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { dataset, loaded, loading, error } = useGameData();

  const playersParam = searchParams.get("players");
  const coachParam = searchParams.get("coach");
  const seedParam = searchParams.get("seed");

  const simulationResult = useMemo(() => {
    if (!dataset || !playersParam || !coachParam) return null;

    const playerEraIds = playersParam.split(",");
    const coachEraId = coachParam;
    const seed = seedParam ? parseInt(seedParam, 10) : 42;

    try {
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

      const rng = createRNG(seed);
      const userPlayerIds = [
        ...team.players.map((p) => p.player_id),
        team.coach.player_id,
      ];
      const opponents = selectOpponents(dataset, userPlayerIds, 15, rng);

      const userMatchTeam: MatchTeam = {
        id: "user-team",
        name: "Seu Dream Team",
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

      const bracket: BracketResult = simulateBracket(groups, rng, "user-team");

      return {
        team,
        bracket,
        seed,
      };
    } catch (err) {
      console.error("Simulation failed:", err);
      return null;
    }
  }, [dataset, playersParam, coachParam, seedParam]);

  const [revealedCount, setRevealedCount] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [speedMultiplier, setSpeedMultiplier] = useState<number>(1);

  const allMatches = useMemo(() => {
    if (!simulationResult) return [];
    return simulationResult.bracket.allMatches;
  }, [simulationResult]);

  const totalMatches = allMatches.length;

  useEffect(() => {
    if (simulationResult) {
      setRevealedCount(0);
      setIsPlaying(true);
    }
  }, [simulationResult]);

  useEffect(() => {
    if (!isPlaying || totalMatches === 0 || revealedCount >= totalMatches)
      return;

    const delay =
      speedMultiplier === 5 ? 50 : speedMultiplier === 2 ? 150 : 400;

    const timer = setTimeout(() => {
      setRevealedCount((prev) => {
        const next = prev + 1;
        if (next >= totalMatches) {
          setIsPlaying(false);
        }
        return next;
      });
    }, delay);

    return () => clearTimeout(timer);
  }, [isPlaying, revealedCount, totalMatches, speedMultiplier]);

  const revealedMatchIds = useMemo(() => {
    const set = new Set<string>();
    for (let i = 0; i < revealedCount; i++) {
      if (allMatches[i]) {
        set.add(allMatches[i].matchId);
      }
    }
    return set;
  }, [allMatches, revealedCount]);

  const isAnimationFinished = revealedCount >= totalMatches && totalMatches > 0;
  const currentMatch: MatchResult | null =
    revealedCount > 0 && revealedCount <= totalMatches
      ? allMatches[revealedCount - 1]
      : null;

  const handleSkipAnimation = () => {
    setRevealedCount(totalMatches);
    setIsPlaying(false);
  };

  const handleTogglePlay = () => {
    if (revealedCount >= totalMatches) {
      setRevealedCount(0);
      setIsPlaying(true);
    } else {
      setIsPlaying(!isPlaying);
    }
  };

  const handleCycleSpeed = () => {
    if (speedMultiplier === 1) setSpeedMultiplier(2);
    else if (speedMultiplier === 2) setSpeedMultiplier(5);
    else setSpeedMultiplier(1);
  };

  if (loading || !loaded) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center space-y-4 bg-[#0A0A0A]">
        <Loader2 className="size-10 text-hi animate-spin" />
        <h2 className="font-display text-2xl font-bold text-white uppercase tracking-wider">
          Simulando Major...
        </h2>
        <p className="text-xs text-text-dim">
          Calculando confrontos e variâncias em tempo real
        </p>
      </div>
    );
  }

  if (error || !simulationResult) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center space-y-4 bg-[#0A0A0A]">
        <AlertTriangle className="size-10 text-negative" />
        <h2 className="font-display text-2xl font-bold text-red-400">
          Não foi possível simular
        </h2>
        <p className="text-xs text-text-muted">
          Verifique se o seu time contém 5 jogadores válidos e 1 coach.
        </p>
        <Button
          render={<Link href="/build" />}
          className="bg-hi hover:bg-hi/90 text-white font-bold"
        >
          Voltar ao Team Builder
        </Button>
      </div>
    );
  }

  const { team, bracket, seed } = simulationResult;
  const isChampion = bracket.champion.id === "user-team";

  const revealedUserTeamPath = bracket.userTeamPath.filter((m) =>
    revealedMatchIds.has(m.matchId),
  );

  const handleResimulateNewSeed = () => {
    const newSeed = Math.floor(Math.random() * 1000000);
    router.push(
      `/results?players=${playersParam}&coach=${coachParam}&seed=${newSeed}`,
    );
  };

  return (
    <div className="min-h-screen flex flex-col justify-between bg-[#0A0A0A]">
      <header className="sticky top-0 z-50 border-b border-white/6 backdrop-blur-xl bg-[#0A0A0A]/90">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <Crosshair className="size-5 text-white/50" />
            <span className="font-display text-xl font-extrabold tracking-wider text-white/90">
              CS FANTASY MAJOR
            </span>
          </Link>

          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={handleResimulateNewSeed}
              className="gap-1.5 text-white/70 border-white/15 hover:border-white/30 hover:bg-white/5"
            >
              <RefreshCw className="size-3.5" />
              Novo Seed
            </Button>
            <Button
              size="sm"
              render={<Link href="/build" />}
              className="bg-white text-[#0A0A0A] font-bold gap-1.5 hover:bg-white/90"
            >
              <Pencil className="size-3.5" />
              Editar Time
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto w-full px-4 py-6 space-y-8 flex-1">
        <section className="rounded-xl p-4 border border-white/6 space-y-3 bg-[#111111]/60 shadow-lg">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <div className="p-2.5 rounded-xl bg-white/5 border border-white/10 shrink-0">
                {isAnimationFinished ? (
                  <CheckCircle2 className="size-6 text-positive" />
                ) : (
                  <Flame className="size-6 text-hi animate-pulse" />
                )}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-display font-bold text-sm text-white uppercase tracking-wider">
                    {isAnimationFinished
                      ? "Simulação Concluída!"
                      : "Simulação do Major em Tempo Real"}
                  </span>
                  <span className="text-[10px] font-mono font-bold bg-white/10 px-2 py-0.5 rounded text-hi">
                    {revealedCount} / {totalMatches} Partidas
                  </span>
                </div>
                <p className="text-xs text-text-dim truncate max-w-md mt-0.5 font-mono">
                  {isAnimationFinished ? (
                    `🏆 Todos os confrontos finalizados! Campeão: ${bracket.champion.name}`
                  ) : currentMatch ? (
                    <span className="text-hi">
                      ⚡ Partida #{revealedCount}: {currentMatch.teamA.name} vs{" "}
                      {currentMatch.teamB.name} (
                      {currentMatch.maps
                        .map((m) => `${m.winnerRounds}-${m.loserRounds}`)
                        .join(", ")}
                      )
                    </span>
                  ) : (
                    "Iniciando fase de grupos..."
                  )}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <Button
                variant="outline"
                size="sm"
                onClick={handleTogglePlay}
                className="gap-1.5 border-white/10 hover:border-hi hover:bg-white/5 text-white"
              >
                {isAnimationFinished ? (
                  <>
                    <RefreshCw className="size-3.5 text-hi" />
                    Reiniciar
                  </>
                ) : isPlaying ? (
                  <>
                    <Pause className="size-3.5 text-hi" />
                    Pausar
                  </>
                ) : (
                  <>
                    <Play className="size-3.5 text-positive fill-positive" />
                    Continuar
                  </>
                )}
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={handleCycleSpeed}
                className="gap-1.5 border-white/10 hover:border-hi hover:bg-white/5 font-mono text-hi font-bold"
              >
                <FastForward className="size-3.5" />
                {speedMultiplier}x Velocidade
              </Button>

              {!isAnimationFinished && (
                <Button
                  size="sm"
                  onClick={handleSkipAnimation}
                  className="bg-hi hover:bg-hi/90 text-white font-extrabold gap-1.5 uppercase text-xs"
                >
                  <SkipForward className="size-3.5 fill-black" />
                  Pular Animação
                </Button>
              )}
            </div>
          </div>

          <div className="w-full bg-white/5 h-1.5 rounded-full overflow-hidden border border-white/5">
            <div
              className="bg-linear-to-r from-hi/70 to-hi h-full transition-all duration-200"
              style={{
                width: `${totalMatches > 0 ? (revealedCount / totalMatches) * 100 : 0}%`,
              }}
            />
          </div>
        </section>

        <section
          className={`rounded-xl bg-[#111111]/60 p-8 border text-center relative overflow-hidden transition-all ${
            isAnimationFinished && isChampion
              ? "border-hi card-glow-gold bg-linear-to-b from-hi/15 to-transparent animate-fade-in"
              : isAnimationFinished
                ? "border-border bg-white/5 animate-fade-in"
                : "border-white/10 bg-white/5"
          }`}
        >
          <div className="relative z-10 space-y-3">
            {isAnimationFinished ? (
              isChampion ? (
                <Crown className="size-14 text-hi mx-auto animate-bounce" />
              ) : (
                <Trophy className="size-14 text-text-muted mx-auto" />
              )
            ) : (
              <Flame className="size-12 text-hi mx-auto animate-pulse" />
            )}

            <h1 className="font-display text-3xl sm:text-5xl font-black uppercase tracking-tight text-white">
              {isAnimationFinished
                ? isChampion
                  ? "SEU TIME É O CAMPEÃO DO MAJOR!"
                  : `CAMPEÃO: ${bracket.champion.name}`
                : "MAJOR EM ANDAMENTO..."}
            </h1>

            <p className="text-sm text-text-muted max-w-xl mx-auto">
              {isAnimationFinished ? (
                <>
                  Vice-campeão:{" "}
                  <strong className="text-white">
                    {bracket.runnerUp.name}
                  </strong>{" "}
                  • RNG Seed: {seed}
                </>
              ) : (
                <>
                  Acompanhe a revelação das partidas abaixo ou clique em{" "}
                  <strong className="text-hi">Pular Animação</strong> para ver a
                  final imediatamente.
                </>
              )}
            </p>
          </div>
        </section>

        <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1 space-y-4">
            <div className="rounded-xl bg-[#111111]/60 p-5 border border-white/6 space-y-3">
              <h3 className="font-display text-xl font-bold uppercase tracking-wide text-white">
                Seu Roster
              </h3>

              <div className="space-y-2 text-xs">
                {team.players.map((p) => (
                  <div
                    key={p.id}
                    className="flex items-center justify-between p-2.5 rounded-lg bg-white/3 border border-white/5 hover:bg-white/6 transition-colors"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full overflow-hidden border border-white/10 bg-white/5 shrink-0">
                        {p.photo_url ? (
                          <img
                            src={
                              p.photo_url.startsWith("http")
                                ? `/api/image-proxy?url=${encodeURIComponent(p.photo_url)}&v=2`
                                : p.photo_url
                            }
                            alt={p.handle}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-[10px] font-bold text-white/40">
                            {p.handle.slice(0, 2).toUpperCase()}
                          </div>
                        )}
                      </div>
                      <div>
                        <span className="font-semibold text-white/90 block leading-tight">
                          {p.handle}
                        </span>
                        <span className="text-white/35 text-[10px]">
                          {p.primary_role} • {p.year}
                        </span>
                      </div>
                    </div>
                    <span
                      className="font-mono text-sm font-semibold text-white/60"
                      style={{ fontFamily: "var(--font-outfit)" }}
                    >
                      {p.total_score.toFixed(0)}{" "}
                      <span className="text-[9px] text-white/30 font-normal">
                        PTS
                      </span>
                    </span>
                  </div>
                ))}

                <div className="flex items-center justify-between p-2.5 rounded-lg bg-white/5 border border-white/10">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full overflow-hidden border border-white/15 bg-white/10 shrink-0 flex items-center justify-center">
                      <span className="text-xs font-bold text-white/70">★</span>
                    </div>
                    <div>
                      <span className="font-semibold text-white block leading-tight">
                        {team.coach.handle}
                      </span>
                      <span className="text-white/40 text-[10px]">
                        Coach • {team.coach.year}
                      </span>
                    </div>
                  </div>
                  <span className="text-[10px] font-semibold text-white/40 uppercase tracking-wider bg-white/5 border border-white/10 px-2 py-0.5 rounded">
                    Coach
                  </span>
                </div>
              </div>
            </div>

            <ChemistryBar
              chemistry={team.chemistry}
              basePower={team.basePower}
              finalPower={team.finalPower}
              varianceMultiplier={team.varianceMultiplier}
            />
          </div>

          <div className="lg:col-span-2 rounded-xl bg-[#111111]/60 p-6 border border-white/6 space-y-4">
            <h3 className="font-display text-xl font-bold uppercase tracking-wide text-white flex items-center justify-between">
              <span>Jornada do seu Time</span>
              <span className="text-xs text-text-dim font-normal font-mono">
                {
                  revealedUserTeamPath.filter((m) => m.winner === "user-team")
                    .length
                }
                V -{" "}
                {
                  revealedUserTeamPath.filter((m) => m.winner !== "user-team")
                    .length
                }
                D
              </span>
            </h3>

            {revealedUserTeamPath.length === 0 ? (
              <p className="text-xs text-text-dim italic">
                Aguardando início das partidas do seu time...
              </p>
            ) : (
              <div className="space-y-3">
                {revealedUserTeamPath.map((match) => {
                  const isWinner = match.winner === "user-team";
                  const opponent =
                    match.teamA.id === "user-team" ? match.teamB : match.teamA;

                  return (
                    <div
                      key={match.matchId}
                      className={`p-4 rounded-xl border flex items-center justify-between ${
                        isWinner
                          ? "bg-positive/10 border-positive/30"
                          : "bg-negative/10 border-negative/30"
                      }`}
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span
                            className={`text-xs font-bold px-2 py-0.5 rounded uppercase ${
                              isWinner
                                ? "bg-positive text-black"
                                : "bg-negative text-white"
                            }`}
                          >
                            {isWinner ? "VITÓRIA" : "DERROTA"}
                          </span>
                          <span className="text-xs text-text-dim">
                            {match.format}
                          </span>
                          {match.isUpset && (
                            <span className="text-xs text-upset font-bold flex items-center gap-0.5">
                              <Zap className="size-3" />
                              UPSET!
                            </span>
                          )}
                        </div>
                        <p className="font-bold text-sm text-white">
                          vs {opponent.name}
                        </p>
                      </div>

                      <div className="text-right">
                        <div className="font-mono text-lg font-bold text-white">
                          {match.scoreA}-{match.scoreB}
                        </div>
                        <div className="text-[11px] text-text-dim">
                          {match.maps
                            .map((m) => `${m.winnerRounds}-${m.loserRounds}`)
                            .join(", ")}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="font-display text-2xl font-bold uppercase tracking-wide text-white">
            Fase de Grupos (BO1)
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {bracket.groups.map((group) => (
              <GroupTable
                key={group.groupName}
                group={group}
                revealedMatchIds={revealedMatchIds}
              />
            ))}
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="font-display text-2xl font-bold uppercase tracking-wide text-white">
            Playoffs
          </h2>
          <div className="rounded-xl bg-[#111111]/60 p-6 border border-white/6">
            <BracketView
              playoffs={bracket.playoffs}
              userTeamId="user-team"
              revealedMatchIds={revealedMatchIds}
            />
          </div>
        </section>
      </main>

      <footer className="max-w-7xl mx-auto w-full p-4 text-center text-xs text-white/15 border-t border-white/6">
        CS Fantasy Major Engine • Todos os resultados simulados com base nas
        estatísticas reais das eras.
      </footer>
    </div>
  );
}

export default function ResultsPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center text-white bg-[#0A0A0A]">
          <Loader2 className="size-6 animate-spin mr-2" />
          Carregando...
        </div>
      }
    >
      <ResultsContent />
    </Suspense>
  );
}
