"use client";

import React from "react";
import type { PlayerEra } from "../lib/data/types";
import type { ChemistryBreakdown } from "../lib/engine/types";
import { TeamSlot } from "./TeamSlot";
import { ChemistryBar } from "./ChemistryBar";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Trophy, Trash2, Users, ClipboardList } from "lucide-react";

interface TeamPanelProps {
  players: (PlayerEra | null)[];
  coach: PlayerEra | null;
  onRemovePlayer: (index: number) => void;
  onRemoveCoach: () => void;
  onClearTeam: () => void;
  onSimulate: () => void;
  basePower: number;
  chemistry: ChemistryBreakdown;
  finalPower: number;
  varianceMultiplier: number;
  hasFullRoster: boolean;
}

export const TeamPanel: React.FC<TeamPanelProps> = ({
  players,
  coach,
  onRemovePlayer,
  onRemoveCoach,
  onClearTeam,
  onSimulate,
  basePower,
  chemistry,
  finalPower,
  varianceMultiplier,
  hasFullRoster,
}) => {
  const filledCount = players.filter((p) => p !== null).length;
  const hasCoach = coach !== null;

  return (
    <div className="space-y-5">
      {/* Panel Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Users className="size-4 text-hi" />
            <h2 className="font-display text-2xl font-bold uppercase tracking-wide text-white">
              Seu Roster
            </h2>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-white/40">
            <span className={`font-bold ${filledCount === 5 ? "text-positive" : "text-white/60"}`}>
              {filledCount}/5
            </span>
            <span>jogadores</span>
            <span className="text-white/20">·</span>
            <span className={`font-bold ${hasCoach ? "text-positive" : "text-white/60"}`}>
              {hasCoach ? "1" : "0"}/1
            </span>
            <span>coach</span>
          </div>
        </div>

        <Button
          variant="ghost"
          size="sm"
          onClick={onClearTeam}
          className="text-xs text-white/40 hover:text-red-400 transition-colors gap-1.5 cursor-pointer"
        >
          <Trash2 className="size-3" />
          Limpar
        </Button>
      </div>

      {/* Roster Grid: 5 Players + 1 Coach in a row */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {players.map((p, idx) => (
          <TeamSlot
            key={idx}
            era={p}
            slotNumber={idx + 1}
            onRemove={() => onRemovePlayer(idx)}
          />
        ))}

        {/* Coach slot (visually distinct) */}
        <div className="relative">
          <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 z-10">
            <span className="bg-role-coach/20 text-role-coach text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full border border-role-coach/30 whitespace-nowrap flex items-center gap-1">
              <ClipboardList className="size-2.5" />
              Coach
            </span>
          </div>
          <TeamSlot
            era={coach}
            slotNumber={6}
            isCoach={true}
            onRemove={onRemoveCoach}
          />
        </div>
      </div>

      <Separator className="bg-white/5" />

      {/* Chemistry Stats Bar */}
      <ChemistryBar
        chemistry={chemistry}
        basePower={basePower}
        finalPower={finalPower}
        varianceMultiplier={varianceMultiplier}
      />

      {/* Simulate Button */}
      <Button
        onClick={onSimulate}
        disabled={!hasFullRoster}
        className={`w-full py-6 rounded-xl font-display text-lg font-extrabold uppercase tracking-wider transition-all duration-300 cursor-pointer ${
          hasFullRoster
            ? "gradient-gold text-white hover:scale-[1.01] hover:shadow-lg hover:shadow-hi/20"
            : "bg-white/5 text-white/30 border border-white/10 cursor-not-allowed"
        }`}
      >
        {hasFullRoster ? (
          <>
            <Trophy className="size-5 mr-2" />
            Simular CS Major
          </>
        ) : (
          `Selecione ${5 - filledCount} jogador${5 - filledCount !== 1 ? "es" : ""} ${!hasCoach ? "+ 1 coach" : ""}`
        )}
      </Button>
    </div>
  );
};
