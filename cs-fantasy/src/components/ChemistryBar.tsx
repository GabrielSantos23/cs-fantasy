"use client";

import React, { useState } from "react";
import type { ChemistryBreakdown } from "../lib/engine/types";
import {
  TrendingUp,
  TrendingDown,
  Minus,
  ChevronDown,
  ChevronUp,
  Zap,
  Gauge,
  Shuffle,
} from "lucide-react";

interface ChemistryBarProps {
  chemistry: ChemistryBreakdown;
  basePower: number;
  finalPower: number;
  varianceMultiplier: number;
}

export const ChemistryBar: React.FC<ChemistryBarProps> = ({
  chemistry,
  basePower,
  finalPower,
  varianceMultiplier,
}) => {
  const [showDetails, setShowDetails] = useState(false);

  const totalMod = chemistry.totalModifier;
  const modPercent = (totalMod * 100).toFixed(1);
  const isPositive = totalMod >= 0;

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex items-center gap-1.5 bg-white/5 border border-white/8 rounded-lg px-3 py-2">
          <Gauge className="size-3.5 text-white/40" />
          <div className="text-xs">
            <span className="text-white/40 mr-1">Base</span>
            <span className="text-white font-bold">{basePower.toFixed(0)}</span>
          </div>
        </div>

        <div
          className={`flex items-center gap-1.5 rounded-lg px-3 py-2 border ${
            isPositive
              ? "bg-positive/10 border-positive/20"
              : totalMod < 0
                ? "bg-negative/10 border-negative/20"
                : "bg-white/5 border-white/8"
          }`}
        >
          <Zap
            className={`size-3.5 ${isPositive ? "text-positive" : totalMod < 0 ? "text-negative" : "text-white/40"}`}
          />
          <div className="text-xs">
            <span className="text-white/40 mr-1">Química</span>
            <span
              className={`font-bold ${isPositive ? "text-positive" : "text-negative"}`}
            >
              {isPositive ? `+${modPercent}%` : `${modPercent}%`}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1.5 bg-white/5 border border-white/8 rounded-lg px-3 py-2">
          <Shuffle className="size-3.5 text-purple-light" />
          <div className="text-xs">
            <span className="text-white/40 mr-1">Variância</span>
            <span className="text-purple-light font-bold">
              ×{varianceMultiplier.toFixed(1)}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1.5 bg-white/10 border border-white/15 rounded-lg px-3 py-2">
          <TrendingUp className="size-3.5 text-white/80" />
          <div className="text-xs">
            <span className="text-white/40 mr-1">Final</span>
            <span className="text-white font-bold font-display text-sm">
              {finalPower.toFixed(0)}
            </span>
          </div>
        </div>

        {chemistry.factors.length > 0 && (
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="flex items-center gap-1 text-[11px] font-semibold text-white/40 hover:text-hi transition-colors ml-auto cursor-pointer"
          >
            {showDetails ? "Ocultar" : `${chemistry.factors.length} fatores`}
            {showDetails ? (
              <ChevronUp className="size-3.5" />
            ) : (
              <ChevronDown className="size-3.5" />
            )}
          </button>
        )}
      </div>

      <div className="relative h-1.5 w-full bg-white/8 rounded-full overflow-hidden">
        <div
          className={`h-full transition-all duration-500 rounded-full ${
            isPositive ? "bg-positive" : "bg-negative"
          }`}
          style={{
            width: `${Math.min(100, Math.max(8, (1 + totalMod) * 50))}%`,
          }}
        />
      </div>

      {showDetails && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-1.5 pt-1 animate-fade-in">
          {chemistry.factors.map((factor, idx) => {
            const val = factor.modifier;
            const pct = (val * 100).toFixed(1);
            const isGood = val > 0;
            const isBad = val < 0;

            return (
              <div
                key={idx}
                className="flex items-center justify-between p-2 rounded-lg bg-white/3 hover:bg-white/6 transition-colors text-xs"
              >
                <div className="flex items-center gap-1.5 min-w-0">
                  {isGood ? (
                    <TrendingUp className="size-3 text-positive shrink-0" />
                  ) : isBad ? (
                    <TrendingDown className="size-3 text-negative shrink-0" />
                  ) : (
                    <Minus className="size-3 text-white/30 shrink-0" />
                  )}
                  <span className="font-medium text-white/80 truncate">
                    {factor.name}
                  </span>
                </div>
                <span
                  className={`font-bold ml-2 shrink-0 ${
                    isGood
                      ? "text-positive"
                      : isBad
                        ? "text-negative"
                        : "text-white/30"
                  }`}
                >
                  {val > 0 ? `+${pct}%` : `${pct}%`}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
