"use client";

import React from "react";
import type { PlayoffRound, MatchResult } from "../lib/engine/types";
import { Trophy, Star, Zap } from "lucide-react";
import { TeamLogo } from "./TeamLogo";

interface BracketViewProps {
  playoffs: PlayoffRound[];
  userTeamId?: string;
  revealedMatchIds?: Set<string>;
}

export const BracketView: React.FC<BracketViewProps> = ({
  playoffs,
  userTeamId = "user-team",
  revealedMatchIds,
}) => {
  const qf =
    playoffs.find((r) => r.roundName === "Quarterfinals")?.matches || [];
  const sf =
    playoffs.find((r) => r.roundName === "Semifinals")?.matches || [];
  const final =
    playoffs.find((r) => r.roundName === "Grand Final")?.matches || [];

  const groupStageFinished =
    !revealedMatchIds || revealedMatchIds.size >= 24;

  const qf0Done = !revealedMatchIds || (qf[0] && revealedMatchIds.has(qf[0].matchId));
  const qf1Done = !revealedMatchIds || (qf[1] && revealedMatchIds.has(qf[1].matchId));
  const qf2Done = !revealedMatchIds || (qf[2] && revealedMatchIds.has(qf[2].matchId));
  const qf3Done = !revealedMatchIds || (qf[3] && revealedMatchIds.has(qf[3].matchId));

  const sf0Done = !revealedMatchIds || (sf[0] && revealedMatchIds.has(sf[0].matchId));
  const sf1Done = !revealedMatchIds || (sf[1] && revealedMatchIds.has(sf[1].matchId));

  const qfSeedLabels = [
    { a: "1º Seed", b: "8º Seed" },
    { a: "4º Seed", b: "5º Seed" },
    { a: "2º Seed", b: "7º Seed" },
    { a: "3º Seed", b: "6º Seed" },
  ];

  return (
    <div className="w-full overflow-x-auto py-4">
      <div className="min-w-[760px] grid grid-cols-3 gap-6 items-center">
        {/* Quarterfinals Column */}
        <div className="space-y-6">
          <h4
            className="text-xs font-semibold uppercase tracking-wider text-white/40 text-center mb-4"
            style={{ fontFamily: "var(--font-outfit)" }}
          >
            Quartas de Final (BO3)
          </h4>
          {qf.map((match, idx) => {
            const isRevealed =
              !revealedMatchIds || revealedMatchIds.has(match.matchId);

            const overrideTeamA = groupStageFinished
              ? undefined
              : { name: qfSeedLabels[idx]?.a || "TBD", id: `tbd-qf-${idx}-a` };
            const overrideTeamB = groupStageFinished
              ? undefined
              : { name: qfSeedLabels[idx]?.b || "TBD", id: `tbd-qf-${idx}-b` };

            return (
              <MatchCard
                key={match.matchId}
                match={match}
                userTeamId={userTeamId}
                isRevealed={isRevealed}
                overrideTeamA={overrideTeamA}
                overrideTeamB={overrideTeamB}
              />
            );
          })}
        </div>

        {/* Semifinals Column */}
        <div className="space-y-12">
          <h4
            className="text-xs font-semibold uppercase tracking-wider text-white/40 text-center mb-4"
            style={{ fontFamily: "var(--font-outfit)" }}
          >
            Semifinais (BO3)
          </h4>
          {sf.map((match, idx) => {
            const isRevealed =
              !revealedMatchIds || revealedMatchIds.has(match.matchId);

            let overrideTeamA;
            let overrideTeamB;

            if (idx === 0) {
              if (!qf0Done) overrideTeamA = { name: "Vencedor QF 1", id: "tbd-sf0-a" };
              if (!qf1Done) overrideTeamB = { name: "Vencedor QF 2", id: "tbd-sf0-b" };
            } else {
              if (!qf2Done) overrideTeamA = { name: "Vencedor QF 3", id: "tbd-sf1-a" };
              if (!qf3Done) overrideTeamB = { name: "Vencedor QF 4", id: "tbd-sf1-b" };
            }

            return (
              <MatchCard
                key={match.matchId}
                match={match}
                userTeamId={userTeamId}
                isRevealed={isRevealed}
                overrideTeamA={overrideTeamA}
                overrideTeamB={overrideTeamB}
              />
            );
          })}
        </div>

        {/* Grand Final Column */}
        <div className="space-y-6">
          <h4
            className="text-xs font-semibold uppercase tracking-wider text-white/90 text-center mb-4 flex items-center justify-center gap-1.5"
            style={{ fontFamily: "var(--font-outfit)" }}
          >
            <Trophy className="size-4 text-white/60" />
            Grande Final (BO5)
          </h4>
          {final.map((match) => {
            const isRevealed =
              !revealedMatchIds || revealedMatchIds.has(match.matchId);

            let overrideTeamA;
            let overrideTeamB;

            if (!sf0Done) overrideTeamA = { name: "Vencedor SF 1", id: "tbd-f-a" };
            if (!sf1Done) overrideTeamB = { name: "Vencedor SF 2", id: "tbd-f-b" };

            return (
              <MatchCard
                key={match.matchId}
                match={match}
                userTeamId={userTeamId}
                isFinal={true}
                isRevealed={isRevealed}
                overrideTeamA={overrideTeamA}
                overrideTeamB={overrideTeamB}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
};

const MatchCard: React.FC<{
  match: MatchResult;
  userTeamId: string;
  isFinal?: boolean;
  isRevealed?: boolean;
  overrideTeamA?: { name: string; id: string };
  overrideTeamB?: { name: string; id: string };
}> = ({
  match,
  userTeamId,
  isFinal = false,
  isRevealed = true,
  overrideTeamA,
  overrideTeamB,
}) => {
  const teamA = overrideTeamA || match.teamA;
  const teamB = overrideTeamB || match.teamB;

  const teamAIsWinner = isRevealed && match.winner === match.teamA.id;
  const teamBIsWinner = isRevealed && match.winner === match.teamB.id;

  const isUserMatch =
    isRevealed && (teamA.id === userTeamId || teamB.id === userTeamId);

  return (
    <div
      className={`rounded-xl border p-3 bg-[#111111]/80 backdrop-blur-md transition-all duration-300 ${
        !isRevealed
          ? "border-white/[0.04] opacity-50"
          : isFinal
          ? "border-white/30 bg-white/[0.06] shadow-lg shadow-white/5"
          : isUserMatch
          ? "border-white/20 bg-white/[0.05]"
          : "border-white/[0.08]"
      }`}
    >
      {/* Team A Row */}
      <div
        className={`flex items-center justify-between p-2 rounded-lg ${
          teamAIsWinner ? "bg-white/10 font-semibold text-white" : "opacity-60 text-white/70"
        }`}
      >
        <div className="flex items-center gap-2 truncate">
          <TeamLogo
            teamName={teamA.name}
            showName={true}
            isUserTeam={teamA.id === userTeamId}
            size="sm"
          />
        </div>
        <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded bg-black/50 border border-white/10 text-white">
          {isRevealed ? match.scoreA : "-"}
        </span>
      </div>

      {/* Divider */}
      <div className="my-1 border-t border-white/[0.06]" />

      {/* Team B Row */}
      <div
        className={`flex items-center justify-between p-2 rounded-lg ${
          teamBIsWinner ? "bg-white/10 font-semibold text-white" : "opacity-60 text-white/70"
        }`}
      >
        <div className="flex items-center gap-2 truncate">
          <TeamLogo
            teamName={teamB.name}
            showName={true}
            isUserTeam={teamB.id === userTeamId}
            size="sm"
          />
        </div>
        <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded bg-black/50 border border-white/10 text-white">
          {isRevealed ? match.scoreB : "-"}
        </span>
      </div>

      {/* Upset Tag / Map Scores */}
      <div className="mt-2 text-[10px] text-white/35 flex items-center justify-between pt-1 border-t border-white/[0.06]">
        {isRevealed && match.isUpset ? (
          <span className="text-amber-400 font-semibold flex items-center gap-1">
            <Zap className="size-3" />
            UPSET!
          </span>
        ) : (
          <span>{match.format}</span>
        )}
        <span>
          {isRevealed
            ? match.maps
                .map((m) => `${m.winnerRounds}-${m.loserRounds}`)
                .join(", ")
            : "Aguardando"}
        </span>
      </div>
    </div>
  );
};
