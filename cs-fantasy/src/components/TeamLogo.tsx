"use client";

import React, { useState } from "react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  getTeamLogoUrl,
  cleanTeamName,
  CS_LOGO_URL,
} from "../lib/teamLogos";

interface TeamLogoProps {
  teamName: string;
  size?: "sm" | "md" | "lg";
  showName?: boolean;
  className?: string;
  isUserTeam?: boolean;
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
  const logoUrl = getTeamLogoUrl(teamName);

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
        <img
          src={CS_LOGO_URL}
          alt="CS"
          className={`object-contain p-0.5 opacity-60 ${imgSizeClasses}`}
        />
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
