"use client";

import React, { useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useGameData } from "../../hooks/useGameData";
import { useTeamBuilder } from "../../hooks/useTeamBuilder";
import { PlayerSearch } from "../../components/PlayerSearch";
import { TeamPanel } from "../../components/TeamPanel";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Crosshair,
  Loader2,
  AlertTriangle,
  RefreshCw,
  Home,
  BookOpen,
  Gamepad2,
  CircleDot,
  Users,
  CheckCircle2,
  Circle,
} from "lucide-react";

export default function BuildPage() {
  const router = useRouter();
  const { dataset, loaded, loading, error, progress } = useGameData();
  const teamBuilder = useTeamBuilder(dataset);

  const selectedEraIds = useMemo(() => {
    const ids = new Set<string>();
    teamBuilder.players.forEach((p) => p && ids.add(p.id));
    if (teamBuilder.coach) ids.add(teamBuilder.coach.id);
    return ids;
  }, [teamBuilder.players, teamBuilder.coach]);

  const handleSimulate = () => {
    if (!teamBuilder.hasFullRoster) return;

    const playerIds = teamBuilder.players
      .filter((p) => p !== null)
      .map((p) => p!.id)
      .join(",");
    const coachId = teamBuilder.coach!.id;
    const seed = Math.floor(Math.random() * 1000000);

    router.push(`/results?players=${playerIds}&coach=${coachId}&seed=${seed}`);
  };

  const filledCount = teamBuilder.players.filter((p) => p !== null).length;
  const hasCoach = teamBuilder.coach !== null;
  const step1Done = filledCount === 5 && hasCoach;

  if (loading || !loaded) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center space-y-4">
        <Loader2 className="size-10 text-hi animate-spin" />
        <h2 className="font-display text-2xl font-bold text-white uppercase tracking-wider">
          Carregando Banco de Dados...
        </h2>
        <div className="w-64 h-1.5 bg-white/10 rounded-full overflow-hidden">
          <div
            className="h-full bg-hi transition-all duration-300 rounded-full"
            style={{ width: `${progress}%` }}
          />
        </div>
        <p className="text-xs text-white/30">
          Indexando 7,046 Eras e 12,989 dados de co-play
        </p>
      </div>
    );
  }

  if (error || !dataset) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center space-y-4">
        <AlertTriangle className="size-10 text-negative" />
        <h2 className="font-display text-2xl font-bold text-red-400">
          Erro ao Carregar Dados
        </h2>
        <p className="text-xs text-white/40">{error}</p>
        <Button
          variant="outline"
          onClick={() => window.location.reload()}
          className="gap-2"
        >
          <RefreshCw className="size-4" />
          Tentar Novamente
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col justify-between bg-[#0A0A0A]">
      <header className="sticky top-0 z-50 border-b border-white/6 backdrop-blur-xl bg-[#0A0A0A]/90">
        <div className="max-w-350 mx-auto px-4 py-3 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <Crosshair className="size-5 text-white/50" />
            <span className="font-display text-xl font-extrabold tracking-wider text-white/90">
              CS FANTASY MAJOR
            </span>
          </Link>

          <div className="flex items-center gap-3 text-xs">
            <Button
              variant="ghost"
              size="sm"
              render={<Link href="/rules" />}
              className="gap-1.5 text-white/40 hover:text-white/60"
            >
              <BookOpen className="size-3.5" />
              Regras
            </Button>
            <div className="hidden sm:flex items-center gap-1.5 text-white/30">
              <CircleDot className="size-3 text-emerald-500/60 animate-pulse" />
              <span>{dataset.erasList.length} Eras</span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              render={<Link href="/" />}
              className="gap-1.5 text-white/40 hover:text-white/70"
            >
              <Home className="size-3.5" />
              Início
            </Button>
          </div>
        </div>
      </header>

      <div className="max-w-350 mx-auto w-full px-4 pt-5">
        <div className="flex items-center border border-white/6 rounded-xl overflow-hidden bg-[#111111]/60">
          <div
            className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 text-sm font-semibold transition-colors ${
              step1Done ? "text-positive" : "text-white"
            }`}
          >
            {step1Done ? (
              <CheckCircle2 className="size-4 text-positive" />
            ) : (
              <Users className="size-4 text-white/50" />
            )}
            <span>Montar Time</span>
            {step1Done && (
              <span className="text-positive/60 text-[10px]">✓</span>
            )}
          </div>

          <Separator orientation="vertical" className="h-8 border-white/6" />

          <div
            className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 text-sm font-semibold ${
              step1Done ? "text-white" : "text-white/25"
            }`}
          >
            <Circle
              className={`size-4 ${step1Done ? "text-hi" : "text-white/15"}`}
            />
            <span>Química & Preview</span>
          </div>

          <Separator orientation="vertical" className="h-8 bg-white/6" />

          <div className="flex-1 flex items-center justify-center gap-2 py-3 px-4 text-sm font-semibold text-white/25">
            <Circle className="size-4 text-white/15" />
            <span>Simular Major</span>
          </div>
        </div>
      </div>

      <main className="max-w-350 mx-auto w-full px-4 py-5 space-y-5 flex-1">
        <section className="rounded-xl p-5 border border-white/6 bg-[#111111]/60">
          <TeamPanel
            players={teamBuilder.players}
            coach={teamBuilder.coach}
            onRemovePlayer={teamBuilder.removePlayerEra}
            onRemoveCoach={teamBuilder.removeCoach}
            onClearTeam={teamBuilder.clearTeam}
            onSimulate={handleSimulate}
            basePower={teamBuilder.basePower}
            chemistry={teamBuilder.chemistry}
            finalPower={teamBuilder.finalPower}
            varianceMultiplier={teamBuilder.varianceMultiplier}
            hasFullRoster={teamBuilder.hasFullRoster}
          />
        </section>

        <section className="rounded-xl p-5 border border-white/6 bg-[#111111]/60">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <Gamepad2 className="size-4 text-white/40" />
              <h3 className="font-display text-xl font-bold uppercase tracking-wide text-white">
                Jogadores Disponíveis
              </h3>
            </div>
          </div>

          <PlayerSearch
            dataset={dataset}
            onSelectEra={(era, isCoach) =>
              teamBuilder.selectPlayerEra(era, isCoach)
            }
            selectedEraIds={selectedEraIds}
          />
        </section>
      </main>

      <footer className="max-w-350 mx-auto w-full p-4 text-center text-[11px] text-white/15">
        Dica: Para o melhor bônus de química, escolha jogadores que já jogaram
        juntos e equilibre as funções (pelo menos 1 IGL e 1 AWPer)!
      </footer>
    </div>
  );
}
