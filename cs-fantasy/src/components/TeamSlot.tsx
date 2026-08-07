"use client";

import React, { useState } from "react";
import type { PlayerEra } from "../lib/data/types";
import { TeamLogo } from "./TeamLogo";
import logoMapData from "../../public/data/team_logos_map.json";
import { Badge } from "@/components/ui/badge";
import {
  X,
  User,
  ClipboardList,
  Crosshair,
  Target,
  Swords,
  Shield,
  Users,
  Eye,
} from "lucide-react";

interface TeamSlotProps {
  era: PlayerEra | null;
  slotNumber: number;
  isCoach?: boolean;
  onRemove: () => void;
  onClickSlot?: () => void;
}

interface LogoEntry {
  local_path: string | null;
  remote_url: string | null;
  downloaded: boolean;
}

const logoMap: Record<string, LogoEntry> = logoMapData as Record<
  string,
  LogoEntry
>;

function cleanTeamName(name: string): string {
  if (!name) return "";
  return name
    .replace(/<!--.*?-->/g, "")
    .replace(/<[^>]+>/g, "")
    .trim();
}

function getTeamLogoUrl(teamName: string): string | null {
  const cleaned = cleanTeamName(teamName);
  const logoInfo = logoMap[cleaned] || logoMap[teamName];
  return logoInfo?.local_path || logoInfo?.remote_url || null;
}

const ROLE_COLORS: Record<string, string> = {
  IGL: "bg-role-igl",
  AWPer: "bg-role-awper",
  AWP: "bg-role-awper",
  Rifler: "bg-role-rifler",
  Entry: "bg-role-entry",
  Support: "bg-role-support",
  Lurker: "bg-role-lurker",
  Coach: "bg-role-coach",
};

function getRoleIcon(role: string, isCoach: boolean) {
  if (isCoach) return <ClipboardList className="size-3" />;
  switch (role) {
    case "IGL":
      return <Crosshair className="size-3" />;
    case "AWPer":
    case "AWP":
      return <Target className="size-3" />;
    case "Rifler":
      return <Swords className="size-3" />;
    case "Entry":
      return <Shield className="size-3" />;
    case "Support":
      return <Users className="size-3" />;
    case "Lurker":
      return <Eye className="size-3" />;
    default:
      return null;
  }
}

export const TeamSlot: React.FC<TeamSlotProps> = ({
  era,
  slotNumber,
  isCoach = false,
  onRemove,
  onClickSlot,
}) => {
  const [imgError, setImgError] = useState(false);
  const [logoError, setLogoError] = useState(false);

  if (era) {
    const mainTeam = era.teams?.[0] ?? "";
    const teamLogoUrl = getTeamLogoUrl(mainTeam);
    const roleColor = isCoach
      ? ROLE_COLORS.Coach
      : ROLE_COLORS[era.primary_role] || "bg-purple-600";

    return (
      <div
        onClick={onRemove}
        className="group relative h-65 w-full rounded-xl overflow-hidden border border-white/10 bg-bg-card transition-all duration-300 hover:border-red-500/40 hover:bg-red-950/10 cursor-pointer"
        title="Clique para remover do roster"
      >
        {teamLogoUrl && !logoError && (
          <div className="absolute inset-0 flex items-center justify-center z-1 pointer-events-none">
            <img
              src={teamLogoUrl}
              alt=""
              onError={() => setLogoError(true)}
              className="w-[80%] h-[80%] object-contain opacity-[0.15] select-none"
              style={{ filter: "grayscale(20%) brightness(1.4)" }}
            />
          </div>
        )}

        {era.photo_url && !imgError ? (
          <img
            src={
              era.photo_url.startsWith("http")
                ? `/api/image-proxy?url=${encodeURIComponent(era.photo_url)}&v=4`
                : era.photo_url
            }
            alt={era.handle}
            onError={() => setImgError(true)}
            className="absolute bottom-0 left-1/2 -translate-x-1/2 h-[85%] w-auto max-w-[70%] object-contain object-bottom z-2 group-hover:scale-105 transition-all duration-300"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center z-2">
            <div
              className={`size-16 rounded-full ${roleColor}/30 border border-white/20 flex items-center justify-center shadow-lg backdrop-blur-sm group-hover:scale-110 transition-transform duration-300`}
            >
              <span className="font-display text-2xl font-black text-white tracking-wider">
                {era.handle.slice(0, 2).toUpperCase()}
              </span>
            </div>
          </div>
        )}

        <div
          className="absolute inset-0 z-3 pointer-events-none"
          style={{
            background:
              "linear-gradient(to bottom, rgba(234, 179, 8, 0.15) 0%, rgba(234, 179, 8, 0.05) 25%, transparent 50%, rgba(0, 0, 0, 0.6) 75%, rgba(0, 0, 0, 0.92) 100%)",
          }}
        />

        <button
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          className="absolute top-2.5 left-2.5 z-20 size-7 rounded-full bg-black/60 border border-white/15 text-white/70 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-200 hover:bg-red-500/80 hover:text-white hover:border-red-500/50 cursor-pointer"
          title="Remover"
        >
          <X className="size-3.5" />
        </button>

        <div className="absolute top-2.5 right-2.5 z-10 flex flex-col items-end gap-1">
          <div className="bg-black/60 backdrop-blur-sm border border-hi/30 rounded-lg px-2 py-1 text-right">
            <span className="text-hi font-display text-xl font-extrabold leading-none">
              {era.total_score.toFixed(0)}
            </span>
            <span className="text-hi/60 text-[9px] font-bold ml-0.5">PTS</span>
          </div>
        </div>

        <div className="absolute top-2.5 left-1/2 -translate-x-1/2 z-10">
          <Badge
            className={`flex items-center gap-1 text-[9px] font-bold uppercase tracking-wider text-white px-1.5 py-0.5 rounded-md border-0 ${roleColor}`}
          >
            {getRoleIcon(era.primary_role, isCoach)}
            {isCoach ? "COACH" : era.primary_role}
          </Badge>
        </div>

        <div className="absolute bottom-0 left-0 right-0 z-10 p-3 space-y-0.5">
          <p className="font-bold text-base text-white leading-tight truncate">
            {era.handle}
          </p>
          <div className="flex items-center justify-between">
            <p className="text-xs text-white/50 truncate">
              {mainTeam || era.real_name}
            </p>
            <span className="text-[10px] text-white/40 font-mono">
              {era.year}
            </span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      onClick={onClickSlot}
      className={`h-65 w-full rounded-xl border-2 border-dashed border-white/10 bg-white/2 flex flex-col items-center justify-center gap-2 transition-all duration-300 ${
        onClickSlot ? "cursor-pointer hover:border-hi/40 hover:bg-hi/3" : ""
      }`}
    >
      <div className="size-12 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white/30">
        {isCoach ? (
          <ClipboardList className="size-5" />
        ) : (
          <User className="size-5" />
        )}
      </div>
      <span className="text-sm font-semibold text-white/40">
        {isCoach ? "Coach" : `Jogador ${slotNumber}`}
      </span>
      <span className="text-[11px] text-white/25">Selecione uma Era</span>
    </div>
  );
};
