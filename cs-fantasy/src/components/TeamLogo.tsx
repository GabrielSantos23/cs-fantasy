"use client";

import React, { useState } from "react";
import logoMapData from "../../public/data/team_logos_map.json";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface TeamLogoProps {
  teamName: string;
  size?: "sm" | "md" | "lg";
  showName?: boolean;
  className?: string;
  isUserTeam?: boolean;
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

function getInitials(name: string): string {
  const cleaned = cleanTeamName(name);
  if (!cleaned) return "?";
  const words = cleaned.split(/[\s_-]+/);
  if (words.length >= 2) {
    return (words[0][0] + words[1][0]).toUpperCase();
  }
  return cleaned.slice(0, 3).toUpperCase();
}

function getLogoUrl(teamName: string): string | null {
  if (!teamName) return null;

  const cleaned = cleanTeamName(teamName);
  if (logoMap[cleaned]?.local_path || logoMap[cleaned]?.remote_url) {
    return logoMap[cleaned].local_path || logoMap[cleaned].remote_url;
  }

  const withoutYear = cleaned.replace(/\s+\d{4}$/, "").trim();
  if (logoMap[withoutYear]?.local_path || logoMap[withoutYear]?.remote_url) {
    return logoMap[withoutYear].local_path || logoMap[withoutYear].remote_url;
  }

  if (logoMap[teamName]?.local_path || logoMap[teamName]?.remote_url) {
    return logoMap[teamName].local_path || logoMap[teamName].remote_url;
  }

  const lowerCleaned = cleaned.toLowerCase();
  const lowerWithoutYear = withoutYear.toLowerCase();

  for (const [key, entry] of Object.entries(logoMap)) {
    const keyLower = key.toLowerCase();
    if (keyLower === lowerCleaned || keyLower === lowerWithoutYear) {
      if (entry.local_path || entry.remote_url) {
        return entry.local_path || entry.remote_url;
      }
    }
  }

  if (withoutYear.includes("/")) {
    const parts = withoutYear.split("/").map((p) => p.trim());
    for (const part of parts) {
      const partLogo = getLogoUrl(part);
      if (partLogo) return partLogo;
    }
  }

  return null;
}

export const TeamLogo: React.FC<TeamLogoProps> = ({
  teamName,
  size = "md",
  showName = false,
  className = "",
  isUserTeam = false,
}) => {
  const [imgError, setImgError] = useState(false);

  const cleanedName = cleanTeamName(teamName);
  const logoUrl = getLogoUrl(teamName);

  const sizeClasses = {
    sm: "size-6 text-[10px]",
    md: "size-8 text-xs",
    lg: "size-10 text-sm",
  }[size];

  const imgSizeClasses = {
    sm: "size-5",
    md: "size-7",
    lg: "size-9",
  }[size];

  const logoContent = (
    <div
      className={`inline-flex items-center justify-center shrink-0 rounded-lg overflow-hidden border transition-all ${
        isUserTeam
          ? "border-hi bg-hi/15 text-hi font-bold shadow-sm shadow-hi/20"
          : "border-white/10 bg-white/5 text-text-muted hover:border-white/20"
      } ${sizeClasses} ${className}`}
    >
      {logoUrl && !imgError ? (
        <img
          src={logoUrl}
          alt={cleanedName}
          onError={() => setImgError(true)}
          className={`object-contain p-0.5 ${imgSizeClasses}`}
        />
      ) : isUserTeam ? (
        <span className="font-display font-black text-hi text-xs">⭐</span>
      ) : (
        <span className="font-display font-extrabold uppercase text-white/80 tracking-wider">
          {getInitials(teamName)}
        </span>
      )}
    </div>
  );

  return (
    <div className="inline-flex items-center gap-2 max-w-full">
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger render={<span>{logoContent}</span>} />
          <TooltipContent side="top" className="bg-bg-card border border-white/10 text-white font-semibold text-xs px-2.5 py-1">
            {cleanedName}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      {showName && (
        <span
          className={`truncate font-semibold text-xs ${
            isUserTeam ? "text-hi font-bold" : "text-white"
          }`}
        >
          {cleanedName}
        </span>
      )}
    </div>
  );
};
