"use client";

import React, { useState } from "react";
import type { PlayerEra } from "../lib/data/types";
import { Badge } from "@/components/ui/badge";
import { X, Crosshair, Target, Swords, Shield, Users, Eye, ClipboardList } from "lucide-react";
import { TeamLogo } from "./TeamLogo";
import logoMapData from "../../public/data/team_logos_map.json";

interface PlayerCardProps {
  era: PlayerEra;
  onSelect?: () => void;
  onRemove?: () => void;
  isCoach?: boolean;
  isSelected?: boolean;
  compact?: boolean;
}

interface LogoEntry {
  local_path: string | null;
  remote_url: string | null;
  downloaded: boolean;
}

const logoMap: Record<string, LogoEntry> = logoMapData as Record<string, LogoEntry>;

function cleanTeamName(name: string): string {
  if (!name) return "";
  return name.replace(/<!--.*?-->/g, "").replace(/<[^>]+>/g, "").trim();
}

function getTeamLogoUrl(teamName: string): string | null {
  const cleaned = cleanTeamName(teamName);
  const logoInfo = logoMap[cleaned] || logoMap[teamName];
  return logoInfo?.local_path || logoInfo?.remote_url || null;
}

export const PlayerCard: React.FC<PlayerCardProps> = ({
  era,
  onSelect,
  onRemove,
  isCoach = false,
  isSelected = false,
  compact = false,
}) => {
  const [imgError, setImgError] = useState(false);
  const [logoError, setLogoError] = useState(false);

  const getRoleIcon = () => {
    if (isCoach) return <ClipboardList className="mr-1 size-3 text-white/60" />;
    switch (era.primary_role) {
      case "IGL": return <Crosshair className="mr-1 size-3 text-blue-400/80" />;
      case "AWPer":
      case "AWP": return <Target className="mr-1 size-3 text-red-400/80" />;
      case "Rifler": return <Swords className="mr-1 size-3 text-emerald-400/80" />;
      case "Entry": return <Shield className="mr-1 size-3 text-orange-400/80" />;
      case "Support": return <Users className="mr-1 size-3 text-teal-400/80" />;
      case "Lurker": return <Eye className="mr-1 size-3 text-purple-400/80" />;
      default: return null;
    }
  };

  const displayTeams = era.teams && era.teams.length > 0 ? era.teams.slice(0, 3) : [];
  const mainTeam = displayTeams[0] ?? "";
  const teamLogoUrl = getTeamLogoUrl(mainTeam);

  return (
    <div
      onClick={onSelect}
      className={`group relative flex flex-col justify-between overflow-hidden rounded-xl border bg-[#111111]/80 backdrop-blur-md transition-all duration-300 ${
        onSelect ? "cursor-pointer hover:border-white/20 hover:bg-[#161616] hover:-translate-y-1 hover:shadow-xl hover:shadow-black/50" : ""
      } ${
        isSelected
          ? "border-white/40 ring-1 ring-white/20 bg-white/[0.08]"
          : "border-white/[0.08]"
      } ${compact ? "p-2.5 h-36" : "p-4 h-56 w-full"}`}
    >
      {/* Background team logo (large, centered, semi-transparent) */}
      {teamLogoUrl && !logoError && (
        <div className="absolute inset-0 flex items-center justify-center z-[0] pointer-events-none">
          <img
            src={teamLogoUrl}
            alt=""
            onError={() => setLogoError(true)}
            className="w-[70%] h-[70%] object-contain opacity-[0.08] select-none"
            style={{ filter: "grayscale(100%) brightness(1.8)" }}
          />
        </div>
      )}

      {/* Player photo */}
      {era.photo_url && !imgError ? (
        <img
          src={
            era.photo_url.startsWith("http")
              ? `/api/image-proxy?url=${encodeURIComponent(era.photo_url)}&v=2`
              : era.photo_url
          }
          alt={era.handle}
          onError={() => setImgError(true)}
          className="absolute right-0 top-0 h-full w-2/3 object-cover object-top opacity-40 transition-opacity duration-300 group-hover:opacity-65 z-[1]"
        />
      ) : (
        <div className="absolute right-3 top-1/2 -translate-y-1/2 z-[1] opacity-20 pointer-events-none select-none flex items-center justify-center">
          <div className="h-24 w-24 rounded-full border border-white/10 flex items-center justify-center font-display text-3xl font-bold text-white/30 tracking-wider">
            {era.handle.slice(0, 2).toUpperCase()}
          </div>
        </div>
      )}

      {/* Subtle dark gradient overlay */}
      <div
        className="absolute inset-0 z-[2] pointer-events-none"
        style={{
          background: "linear-gradient(to bottom, rgba(255, 255, 255, 0.02) 0%, transparent 40%, rgba(10, 10, 10, 0.65) 75%, rgba(10, 10, 10, 0.95) 100%)",
        }}
      />

      {/* Card Header: Year & Role */}
      <div className="relative z-10 flex items-center justify-between">
        <span className="text-[10px] font-mono font-medium text-white/40 bg-white/5 border border-white/10 px-2 py-0.5 rounded-md backdrop-blur-md">
          {era.year}
        </span>
        <Badge
          className="flex items-center text-[10px] font-semibold uppercase tracking-wider text-white/80 bg-white/5 border border-white/10 px-2 py-0.5 rounded-md shadow-sm"
        >
          {getRoleIcon()}
          {isCoach ? "COACH" : era.primary_role}
        </Badge>
      </div>

      {/* Card Middle: Score & Stats */}
      <div className="relative z-10 my-auto">
        <div className="flex items-baseline gap-1">
          <span
            className="text-3xl font-bold tracking-tight text-white"
            style={{ fontFamily: "var(--font-outfit)" }}
          >
            {era.total_score.toFixed(0)}
          </span>
          <span className="text-[9px] text-white/40 font-mono font-semibold">PTS</span>
        </div>
        <p className="font-semibold text-lg leading-tight text-white/90 group-hover:text-white transition-colors truncate">
          {era.handle}
        </p>
        {era.real_name && !compact && (
          <p className="text-xs text-white/35 truncate">{era.real_name}</p>
        )}
      </div>

      {/* Card Footer: Teams Logos & Nationality */}
      <div className="relative z-10 flex items-center justify-between border-t border-white/[0.06] pt-2 mt-1">
        <div className="flex items-center -space-x-1.5 overflow-visible">
          {displayTeams.map((teamName, idx) => (
            <TeamLogo
              key={idx}
              teamName={teamName}
              size="sm"
              className="ring-1 ring-[#111111]"
            />
          ))}
        </div>

        <span className="text-[10px] text-white/35 bg-white/5 border border-white/8 px-1.5 py-0.5 rounded font-mono">
          {era.nationality}
        </span>
      </div>

      {/* Remove Overlay Button */}
      {onRemove && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          className="absolute top-2 right-2 z-20 h-6 w-6 rounded-full bg-red-500/80 text-white flex items-center justify-center text-xs font-bold opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
          title="Remover jogador"
        >
          <X className="size-3" />
        </button>
      )}
    </div>
  );
};
