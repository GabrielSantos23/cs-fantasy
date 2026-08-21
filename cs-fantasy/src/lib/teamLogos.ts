import logoMapData from "../../public/data/team_logos_map.json";

interface LogoEntry {
  local_path: string | null;
  remote_url: string | null;
  downloaded?: boolean;
}

const logoMap = logoMapData as Record<string, LogoEntry>;

const KNOWN_FLAG_PATHS = new Set([
  "/data/team_logos/belgium.png",
  "/data/team_logos/canada.png",
  "/data/team_logos/france.png",
  "/data/team_logos/germany.png",
  "/data/team_logos/indonesia.png",
  "/data/team_logos/kyrgyzstan.png",
  "/data/team_logos/netherlands.png",
  "/data/team_logos/norway.png",
  "/data/team_logos/poland.png",
  "/data/team_logos/portugal.png",
  "/data/team_logos/russia.png",
  "/data/team_logos/singapore.png",
  "/data/team_logos/sweden.png",
  "/data/team_logos/team_brazil.png",
  "/data/team_logos/team_pakistan.png",
  "/data/team_logos/team_poland.png",
  "/data/team_logos/team_russia.png",
  "/data/team_logos/team_sweden.png",
  "/data/team_logos/team_ukraine.png",
  "/data/team_logos/team_usa.png",
  "/data/team_logos/tunisia.png",
  "/data/team_logos/usa.png",
]);

const KNOWN_NATIONAL_TEAMS = new Set([
  "belgium",
  "canada",
  "france",
  "germany",
  "indonesia",
  "kyrgyzstan",
  "netherlands",
  "norway",
  "poland",
  "portugal",
  "russia",
  "singapore",
  "sweden",
  "team brazil",
  "team pakistan",
  "team poland",
  "team russia",
  "team sweden",
  "team ukraine",
  "team usa",
  "tunisia",
  "usa",
  "united states",
  "brazil",
  "denmark",
  "finland",
  "ukraine",
  "kazakhstan",
  "australia",
  "united kingdom",
  "turkey",
  "serbia",
  "china",
  "argentina",
  "spain",
  "czech republic",
  "slovakia",
  "hungary",
]);

export const CS_LOGO_URL = "/cs-logo.png";

export function cleanTeamName(name: string): string {
  if (!name) return "";
  return name
    .replace(/<!--.*?-->/g, "")
    .replace(/<[^>]+>/g, "")
    .trim();
}

export function isNationalTeamOrFlag(teamName: string, nationality?: string): boolean {
  if (!teamName) return false;
  const clean = cleanTeamName(teamName).toLowerCase();
  if (nationality && clean === nationality.toLowerCase()) return true;
  if (KNOWN_NATIONAL_TEAMS.has(clean)) return true;

  const entry = logoMap[cleanTeamName(teamName)] || logoMap[teamName];
  if (entry) {
    if (entry.remote_url?.toLowerCase().includes("flag_of_")) return true;
    if (entry.remote_url?.toLowerCase().includes("/flag_")) return true;
    if (entry.local_path && KNOWN_FLAG_PATHS.has(entry.local_path)) return true;
  }
  return false;
}

export function getTeamLogoUrl(teamName: string, nationality?: string): string | null {
  if (!teamName) return null;
  if (isNationalTeamOrFlag(teamName, nationality)) return null;

  const cleaned = cleanTeamName(teamName);
  if (logoMap[cleaned]?.local_path || logoMap[cleaned]?.remote_url) {
    const entry = logoMap[cleaned];
    if (entry.local_path && KNOWN_FLAG_PATHS.has(entry.local_path)) return null;
    return entry.local_path || entry.remote_url;
  }

  const withoutYear = cleaned.replace(/\s+\d{4}$/, "").trim();
  if (logoMap[withoutYear]?.local_path || logoMap[withoutYear]?.remote_url) {
    const entry = logoMap[withoutYear];
    if (entry.local_path && KNOWN_FLAG_PATHS.has(entry.local_path)) return null;
    return entry.local_path || entry.remote_url;
  }

  if (logoMap[teamName]?.local_path || logoMap[teamName]?.remote_url) {
    const entry = logoMap[teamName];
    if (entry.local_path && KNOWN_FLAG_PATHS.has(entry.local_path)) return null;
    return entry.local_path || entry.remote_url;
  }

  const lowerCleaned = cleaned.toLowerCase();
  const lowerWithoutYear = withoutYear.toLowerCase();

  for (const [key, entry] of Object.entries(logoMap)) {
    const keyLower = key.toLowerCase();
    if (keyLower === lowerCleaned || keyLower === lowerWithoutYear) {
      if (entry.local_path && KNOWN_FLAG_PATHS.has(entry.local_path)) return null;
      if (entry.remote_url?.toLowerCase().includes("flag_of_")) return null;
      return entry.local_path || entry.remote_url;
    }
  }

  if (withoutYear.includes("/")) {
    const parts = withoutYear.split("/").map((p) => p.trim());
    for (const part of parts) {
      const partLogo = getTeamLogoUrl(part, nationality);
      if (partLogo) return partLogo;
    }
  }

  return null;
}

/**
 * Returns the best team for display and logo purposes, skipping national teams.
 */
export function getPlayerMainTeam(teams: string[] | undefined, nationality?: string): string {
  if (!teams || teams.length === 0) return "";
  const orgTeam = teams.find((t) => !isNationalTeamOrFlag(t, nationality));
  return orgTeam ?? "";
}

/**
 * Returns the logo URL for the player's card background.
 * If the player has a valid org team with a logo, returns that logo URL.
 * Otherwise returns the CS logo URL.
 */
export function getPlayerBackgroundLogo(teams: string[] | undefined, nationality?: string): {
  url: string;
  isCsFallback: boolean;
} {
  const mainTeam = getPlayerMainTeam(teams, nationality);
  const logoUrl = getTeamLogoUrl(mainTeam, nationality);

  if (logoUrl) {
    return { url: logoUrl, isCsFallback: false };
  }

  // Also check other teams if the first non-flag didn't have a logo
  if (teams) {
    for (const t of teams) {
      if (!isNationalTeamOrFlag(t, nationality)) {
        const altLogo = getTeamLogoUrl(t, nationality);
        if (altLogo) {
          return { url: altLogo, isCsFallback: false };
        }
      }
    }
  }

  return { url: CS_LOGO_URL, isCsFallback: true };
}
