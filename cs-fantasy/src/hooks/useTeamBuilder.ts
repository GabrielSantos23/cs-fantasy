"use client";

import { useState, useMemo, useCallback } from "react";
import type { PlayerEra, GameDataset } from "../lib/data/types";
import type { FantasyTeam, ChemistryBreakdown } from "../lib/engine/types";
import {
  calculateChemistry,
  calculateVarianceMultiplier,
} from "../lib/engine/chemistry";

export interface SelectedTeamState {
  players: (PlayerEra | null)[];
  coach: PlayerEra | null;
}

export function useTeamBuilder(dataset: GameDataset | null) {
  const [teamState, setTeamState] = useState<SelectedTeamState>({
    players: [null, null, null, null, null],
    coach: null,
  });

  const selectPlayerEra = useCallback((era: PlayerEra, isCoach = false) => {
    setTeamState((prev) => {
      const existingPlayerIndex = prev.players.findIndex(
        (p) =>
          p !== null &&
          (p.id === era.id ||
            (p.player_id === era.player_id && p.year === era.year)),
      );
      const isCoachSelected =
        prev.coach !== null &&
        (prev.coach.id === era.id ||
          (prev.coach.player_id === era.player_id &&
            prev.coach.year === era.year));

      if (existingPlayerIndex !== -1) {
        const nextPlayers = [...prev.players];
        nextPlayers[existingPlayerIndex] = null;
        return { ...prev, players: nextPlayers };
      }

      if (isCoachSelected) {
        return { ...prev, coach: null };
      }

      if (isCoach) {
        return { ...prev, coach: era };
      }

      const emptyIndex = prev.players.findIndex((p) => p === null);
      if (emptyIndex !== -1) {
        const nextPlayers = [...prev.players];
        nextPlayers[emptyIndex] = era;
        return { ...prev, players: nextPlayers };
      }

      return prev;
    });
  }, []);

  const removePlayerEra = useCallback((index: number) => {
    setTeamState((prev) => {
      const nextPlayers = [...prev.players];
      nextPlayers[index] = null;
      return { ...prev, players: nextPlayers };
    });
  }, []);

  const removeCoach = useCallback(() => {
    setTeamState((prev) => ({ ...prev, coach: null }));
  }, []);

  const clearTeam = useCallback(() => {
    setTeamState({
      players: [null, null, null, null, null],
      coach: null,
    });
  }, []);

  const teamCalculations = useMemo(() => {
    const activePlayers = teamState.players.filter(
      (p): p is PlayerEra => p !== null,
    );
    const hasFullRoster =
      activePlayers.length === 5 && teamState.coach !== null;

    const basePower = activePlayers.reduce((sum, p) => sum + p.total_score, 0);

    let chemistry: ChemistryBreakdown = {
      factors: [],
      totalModifier: 0,
    };
    let varianceMultiplier = 1.0;

    if (activePlayers.length > 0 && dataset) {
      const dummyCoach = teamState.coach || activePlayers[0];
      chemistry = calculateChemistry(
        activePlayers,
        dummyCoach,
        dataset.coPlayMatrix,
      );
      varianceMultiplier = calculateVarianceMultiplier(activePlayers);
    }

    const finalPower = basePower * (1 + chemistry.totalModifier);

    return {
      activePlayersCount: activePlayers.length,
      hasFullRoster,
      basePower,
      chemistry,
      finalPower,
      varianceMultiplier,
    };
  }, [teamState, dataset]);

  return {
    players: teamState.players,
    coach: teamState.coach,
    selectPlayerEra,
    removePlayerEra,
    removeCoach,
    clearTeam,
    ...teamCalculations,
  };
}
