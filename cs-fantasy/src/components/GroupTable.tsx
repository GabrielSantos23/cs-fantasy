"use client";

import React, { useState } from "react";
import type { GroupResult, MatchResult } from "../lib/engine/types";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Check, X, ChevronDown, ChevronUp } from "lucide-react";
import { TeamLogo } from "./TeamLogo";

interface GroupTableProps {
  group: GroupResult;
  revealedMatchIds?: Set<string>;
}

export const GroupTable: React.FC<GroupTableProps> = ({ group, revealedMatchIds }) => {
  const [showMatches, setShowMatches] = useState(false);

  const visibleMatches = revealedMatchIds
    ? group.matches.filter((m) => revealedMatchIds.has(m.matchId))
    : group.matches;

  const standings: Record<string, { wins: number; losses: number }> = {};
  for (const t of group.teams) {
    standings[t.id] = { wins: 0, losses: 0 };
  }

  for (const m of visibleMatches) {
    if (standings[m.winner]) standings[m.winner].wins++;
    if (standings[m.loser]) standings[m.loser].losses++;
  }

  // Sort teams by wins descending, then losses, then finalPower
  const sortedTeams = Object.entries(standings).sort(
    ([idA, recordA], [idB, recordB]) => {
      if (recordB.wins !== recordA.wins) return recordB.wins - recordA.wins;
      if (recordA.losses !== recordB.losses) return recordA.losses - recordB.losses;
      const powerA = group.teams.find((t) => t.id === idA)?.finalPower || 0;
      const powerB = group.teams.find((t) => t.id === idB)?.finalPower || 0;
      return powerB - powerA;
    }
  );

  const isGroupFinished = visibleMatches.length === group.matches.length;

  return (
    <div className="rounded-xl border border-white/[0.08] bg-[#111111]/80 backdrop-blur-md overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between bg-white/[0.03] px-4 py-3 border-b border-white/[0.06]">
        <h3
          className="text-base font-semibold text-white/90"
          style={{ fontFamily: "var(--font-outfit)" }}
        >
          Grupo {group.groupName}
        </h3>
        <Button
          variant="ghost"
          size="xs"
          onClick={() => setShowMatches(!showMatches)}
          className="text-white/40 hover:text-white/80 gap-1"
        >
          {showMatches ? (
            <>
              Ocultar <ChevronUp className="size-3" />
            </>
          ) : (
            <>
              Confrontos ({visibleMatches.length}/{group.matches.length}){" "}
              <ChevronDown className="size-3" />
            </>
          )}
        </Button>
      </div>

      {/* Standings Table */}
      <div className="p-3">
        <Table>
          <TableHeader>
            <TableRow className="border-white/[0.06] hover:bg-transparent">
              <TableHead className="text-white/35 text-[11px] font-medium w-8">
                #
              </TableHead>
              <TableHead className="text-white/35 text-[11px] font-medium text-center">
                Time
              </TableHead>
              <TableHead className="text-white/35 text-[11px] font-medium text-center w-10">
                V
              </TableHead>
              <TableHead className="text-white/35 text-[11px] font-medium text-center w-10">
                D
              </TableHead>
              <TableHead className="text-white/35 text-[11px] font-medium text-right w-16">
                Poder
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedTeams.map(([teamId, record], idx) => {
              const team = group.teams.find((t) => t.id === teamId);
              const isAdvancing =
                isGroupFinished && group.advancing.some((t) => t.id === teamId);
              const isUser = team?.isUserTeam;

              return (
                <TableRow
                  key={teamId}
                  className={`border-white/[0.04] transition-colors ${
                    isUser ? "bg-white/[0.08] font-semibold" : "hover:bg-white/[0.03]"
                  }`}
                >
                  <TableCell className="py-2 text-xs font-semibold text-white/70">
                    <span className="flex items-center gap-1">
                      {idx + 1}
                      {isGroupFinished ? (
                        isAdvancing ? (
                          <Check className="size-3 text-emerald-400" />
                        ) : (
                          <X className="size-3 text-red-400/60" />
                        )
                      ) : null}
                    </span>
                  </TableCell>
                  <TableCell className="py-2 text-xs text-center">
                    <TeamLogo
                      teamName={team?.name || ""}
                      showName={false}
                      isUserTeam={isUser}
                      size="md"
                    />
                  </TableCell>
                  <TableCell className="py-2 text-xs text-center font-semibold text-emerald-400">
                    {record.wins}
                  </TableCell>
                  <TableCell className="py-2 text-xs text-center text-white/35">
                    {record.losses}
                  </TableCell>
                  <TableCell className="py-2 text-xs text-right font-mono text-white/50">
                    {team?.finalPower.toFixed(0)}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>

        {/* Itemized Group Matches */}
        {showMatches && (
          <div className="mt-3 pt-3 border-t border-white/[0.06] space-y-2 animate-fade-in">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-white/35 block mb-2">
              Confrontos (BO1)
            </span>
            {visibleMatches.map((m) => (
              <GroupMatchRow key={m.matchId} match={m} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

const GroupMatchRow: React.FC<{ match: MatchResult }> = ({ match }) => {
  const winner =
    match.winner === match.teamA.id ? match.teamA : match.teamB;
  const loser =
    match.winner === match.teamA.id ? match.teamB : match.teamA;
  const map = match.maps[0];

  return (
    <div className="flex items-center justify-between text-xs bg-white/[0.03] p-2 rounded-lg hover:bg-white/[0.06] transition-colors border border-white/[0.04]">
      <TeamLogo
        teamName={winner.name}
        showName={false}
        isUserTeam={winner.isUserTeam}
        size="sm"
      />

      <div className="flex items-center gap-1 font-mono">
        <span className="font-semibold text-emerald-400">
          {map ? map.winnerRounds : 16}
        </span>
        <span className="text-white/25">-</span>
        <span className="text-white/40">
          {map ? map.loserRounds : 12}
        </span>
      </div>

      <TeamLogo
        teamName={loser.name}
        showName={false}
        isUserTeam={loser.isUserTeam}
        size="sm"
      />
    </div>
  );
};
