"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import type {
  PlayerEra,
  PlayerProfile,
  RealTeam,
  CoPlayEntry,
  LanguageMap,
  GameDataset,
} from "../lib/data/types";

interface LoadingState {
  loaded: boolean;
  loading: boolean;
  error: string | null;
  progress: number;
}

const dataCache: { current: GameDataset | null } = { current: null };

async function fetchJSON<T>(url: string): Promise<T> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to fetch ${url}: ${res.status}`);
  return res.json();
}

export function useGameData() {
  const [state, setState] = useState<LoadingState>({
    loaded: dataCache.current !== null,
    loading: false,
    error: null,
    progress: dataCache.current ? 100 : 0,
  });
  const [dataset, setDataset] = useState<GameDataset | null>(dataCache.current);
  const loadingRef = useRef(false);

  useEffect(() => {
    if (dataCache.current) {
      setDataset(dataCache.current);
      setState({ loaded: true, loading: false, error: null, progress: 100 });
      return;
    }

    if (loadingRef.current) return;
    loadingRef.current = true;

    const load = async () => {
      setState((s) => ({ ...s, loading: true, progress: 0 }));

      try {
        setState((s) => ({ ...s, progress: 5 }));

        const [erasArray, playersRaw, realTeams, coPlayRaw, languages] =
          await Promise.all([
            fetchJSON<PlayerEra[]>("/data/eras.json"),
            fetchJSON<Record<string, PlayerProfile>>("/data/players.json"),
            fetchJSON<RealTeam[]>("/data/real_teams.json"),
            fetchJSON<Record<string, CoPlayEntry>>("/data/co_play_matrix.json"),
            fetchJSON<LanguageMap>("/data/languages.json"),
          ]);

        setState((s) => ({ ...s, progress: 70 }));

        const eras = new Map<string, PlayerEra>();
        for (const era of erasArray) {
          eras.set(era.id, era);
        }

        const players = new Map<string, PlayerProfile>();
        for (const [id, profile] of Object.entries(playersRaw)) {
          players.set(id, profile);
        }

        const coPlayMatrix = new Map<string, CoPlayEntry>();
        for (const [key, entry] of Object.entries(coPlayRaw)) {
          coPlayMatrix.set(key, entry);
        }

        setState((s) => ({ ...s, progress: 90 }));

        const data: GameDataset = {
          eras,
          erasList: erasArray,
          players,
          realTeams,
          coPlayMatrix,
          languages,
        };

        dataCache.current = data;
        setDataset(data);
        setState({ loaded: true, loading: false, error: null, progress: 100 });
      } catch (err) {
        setState({
          loaded: false,
          loading: false,
          error: err instanceof Error ? err.message : "Failed to load data",
          progress: 0,
        });
      }
    };

    load();
  }, []);

  return { dataset, ...state };
}
