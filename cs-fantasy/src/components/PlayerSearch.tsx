"use client";

import React, { useState, useMemo } from "react";
import type { PlayerEra, GameDataset } from "../lib/data/types";
import { TeamLogo } from "./TeamLogo";
import logoMapData from "../../public/data/team_logos_map.json";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Search,
  ClipboardList,
  Calendar,
  Plus,
  Check,
  Crosshair,
  Target,
  Swords,
  Shield,
  Users,
  Eye,
  ArrowUpDown,
  ChevronDown,
  LayoutGrid,
  List,
} from "lucide-react";

interface PlayerSearchProps {
  dataset: GameDataset;
  onSelectEra: (era: PlayerEra, isCoach?: boolean) => void;
  selectedEraIds: Set<string>;
}

const ROLES = ["All", "IGL", "AWPer", "Rifler", "Entry", "Support", "Lurker"];

const ROLE_COLORS: Record<string, string> = {
  IGL: "bg-role-igl",
  AWPer: "bg-role-awper",
  AWP: "bg-role-awper",
  Rifler: "bg-role-rifler",
  Entry: "bg-role-entry",
  Support: "bg-role-support",
  Lurker: "bg-role-lurker",
};

function getRoleIcon(role: string) {
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

type SortKey = "score" | "name" | "year";
type SortDir = "asc" | "desc";

export const PlayerSearch: React.FC<PlayerSearchProps> = ({
  dataset,
  onSelectEra,
  selectedEraIds,
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedRole, setSelectedRole] = useState("All");
  const [selectedYear, setSelectedYear] = useState<number | "All">("All");
  const [asCoachMode, setAsCoachMode] = useState(false);
  const [page, setPage] = useState(1);
  const [sortKey, setSortKey] = useState<SortKey>("score");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [viewMode, setViewMode] = useState<"list" | "grid">("grid");
  const [imgErrors, setImgErrors] = useState<Set<string>>(new Set());

  const PAGE_SIZE = 40;

  const availableYears = useMemo(() => {
    const years: number[] = [];
    for (let yr = 2026; yr >= 2013; yr--) {
      years.push(yr);
    }
    return years;
  }, []);

  const filteredEras = useMemo(() => {
    let results = dataset.erasList.filter((era) => {
      if (era.year < 2013 || era.year > 2026) {
        return false;
      }

      if (
        searchTerm.trim() &&
        !era.handle.toLowerCase().includes(searchTerm.toLowerCase()) &&
        !era.real_name.toLowerCase().includes(searchTerm.toLowerCase())
      ) {
        return false;
      }

      if (selectedRole !== "All") {
        if (selectedRole === "AWPer") {
          if (era.primary_role !== "AWPer" && era.primary_role !== "AWP")
            return false;
        } else if (era.primary_role !== selectedRole) {
          return false;
        }
      }

      if (selectedYear !== "All" && era.year !== Number(selectedYear)) {
        return false;
      }

      return true;
    });

    results.sort((a, b) => {
      let cmp = 0;
      switch (sortKey) {
        case "score":
          cmp = a.total_score - b.total_score;
          break;
        case "name":
          cmp = a.handle.localeCompare(b.handle);
          break;
        case "year":
          cmp = a.year - b.year;
          break;
      }
      return sortDir === "desc" ? -cmp : cmp;
    });

    return results;
  }, [dataset, searchTerm, selectedRole, selectedYear, sortKey, sortDir]);

  const visibleEras = useMemo(() => {
    return filteredEras.slice(0, page * PAGE_SIZE);
  }, [filteredEras, page]);

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("desc");
    }
  };

  const handleImgError = (eraId: string) => {
    setImgErrors((prev) => new Set(prev).add(eraId));
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-white/30" />
          <Input
            type="text"
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setPage(1);
            }}
            placeholder="Buscar jogador (ex: s1mple, FalleN, coldzera)..."
            className="pl-9 bg-white/3 border-white/8 text-white placeholder:text-white/25 focus-visible:ring-hi/40 h-9"
          />
        </div>

        <div className="flex items-center gap-2">
          <Calendar className="size-4 text-hi/60" />
          <Select
            value={String(selectedYear)}
            onValueChange={(val) => {
              setSelectedYear(val === "All" ? "All" : Number(val));
              setPage(1);
            }}
          >
            <SelectTrigger className="w-45 bg-white/3 border-white/8 text-white h-9 text-xs font-medium focus:ring-hi/40">
              <SelectValue placeholder="Ano / Era" />
            </SelectTrigger>
            <SelectContent className="bg-bg-card border-white/10 text-white">
              <SelectItem value="All" className="font-bold text-hi">
                Todas as Eras (2013–2026)
              </SelectItem>
              {availableYears.map((yr) => (
                <SelectItem key={yr} value={String(yr)}>
                  Era {yr}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={() => setAsCoachMode(!asCoachMode)}
          className={`flex items-center gap-2 h-9 px-3 text-xs uppercase tracking-wider transition-all cursor-pointer ${
            asCoachMode
              ? "bg-role-coach/20 border-role-coach/40 text-role-coach hover:bg-role-coach/30 hover:text-role-coach"
              : "bg-white/3 border-white/8 text-white/40 hover:bg-white/6 hover:text-white/60"
          }`}
        >
          <ClipboardList className="size-3.5" />
          Coach
          <span
            className={`size-1.5 rounded-full ${
              asCoachMode ? "bg-role-coach" : "bg-white/20"
            }`}
          />
        </Button>
      </div>

      <div className="flex items-center justify-between gap-3">
        <div className="flex flex-wrap gap-1.5">
          {ROLES.map((role) => (
            <button
              key={role}
              onClick={() => {
                setSelectedRole(role);
                setPage(1);
              }}
              className={`px-2.5 py-1 rounded-md text-[11px] font-semibold uppercase tracking-wider transition-all cursor-pointer ${
                selectedRole === role
                  ? "bg-hi text-white"
                  : "bg-white/4 text-white/40 hover:bg-white/8 hover:text-white/60"
              }`}
            >
              {role}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-3">
          <span className="text-[11px] text-white/30 shrink-0">
            {filteredEras.length} eras
            {asCoachMode && (
              <span className="text-role-coach font-semibold ml-2">
                Modo Coach ativo
              </span>
            )}
          </span>

          <div className="flex items-center bg-white/4 rounded-lg p-0.5 gap-0.5">
            <button
              onClick={() => setViewMode("list")}
              className={`p-1.5 rounded-md transition-all cursor-pointer ${
                viewMode === "list"
                  ? "bg-hi text-white"
                  : "text-white/30 hover:text-white/60"
              }`}
              title="Visualização em lista"
            >
              <List className="size-3.5" />
            </button>
            <button
              onClick={() => setViewMode("grid")}
              className={`p-1.5 rounded-md transition-all cursor-pointer ${
                viewMode === "grid"
                  ? "bg-hi text-white"
                  : "text-white/30 hover:text-white/60"
              }`}
              title="Visualização em grid"
            >
              <LayoutGrid className="size-3.5" />
            </button>
          </div>
        </div>
      </div>

      {viewMode === "list" && (
        <ScrollArea className="h-145">
          <Table>
            <TableHeader>
              <TableRow className="border-white/5 hover:bg-transparent">
                <TableHead className="text-white/30 text-[10px] uppercase tracking-wider w-[45%]">
                  <button
                    onClick={() => toggleSort("name")}
                    className="flex items-center gap-1 hover:text-white/60 transition-colors cursor-pointer"
                  >
                    Jogador
                    <ArrowUpDown className="size-3" />
                  </button>
                </TableHead>
                <TableHead className="text-white/30 text-[10px] uppercase tracking-wider">
                  Times
                </TableHead>
                <TableHead className="text-white/30 text-[10px] uppercase tracking-wider">
                  Role
                </TableHead>
                <TableHead className="text-white/30 text-[10px] uppercase tracking-wider">
                  <button
                    onClick={() => toggleSort("year")}
                    className="flex items-center gap-1 hover:text-white/60 transition-colors cursor-pointer"
                  >
                    Ano
                    <ArrowUpDown className="size-3" />
                  </button>
                </TableHead>
                <TableHead className="text-white/30 text-[10px] uppercase tracking-wider text-right">
                  <button
                    onClick={() => toggleSort("score")}
                    className="flex items-center gap-1 ml-auto hover:text-white/60 transition-colors cursor-pointer"
                  >
                    Score
                    <ArrowUpDown className="size-3" />
                  </button>
                </TableHead>
                <TableHead className="w-20" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {visibleEras.map((era) => {
                const isSelected = selectedEraIds.has(era.id);
                const displayTeams =
                  era.teams && era.teams.length > 0
                    ? era.teams.slice(0, 3)
                    : [];
                const roleColor =
                  ROLE_COLORS[era.primary_role] || "bg-purple-600";
                const hasImgError = imgErrors.has(era.id);

                return (
                  <TableRow
                    key={era.id}
                    className={`border-white/4 transition-colors ${
                      isSelected ? "bg-hi/8 hover:bg-hi/12" : "hover:bg-white/3"
                    }`}
                  >
                    <TableCell className="py-2">
                      <div className="flex items-center gap-3">
                        <div className="relative size-9 rounded-lg overflow-hidden bg-white/5 border border-white/8 shrink-0">
                          {era.photo_url && !hasImgError ? (
                            <img
                              src={
                                era.photo_url.startsWith("http")
                                  ? `/api/image-proxy?url=${encodeURIComponent(era.photo_url)}&v=2`
                                  : era.photo_url
                              }
                              alt={era.handle}
                              onError={() => handleImgError(era.id)}
                              className="size-full object-cover object-top"
                            />
                          ) : (
                            <div className="size-full flex items-center justify-center text-[10px] font-bold text-white/30">
                              {era.handle.slice(0, 2).toUpperCase()}
                            </div>
                          )}
                          {isSelected && (
                            <div className="absolute inset-0 bg-hi/30 flex items-center justify-center">
                              <Check className="size-3.5 text-hi" />
                            </div>
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-white truncate leading-tight">
                            {era.handle}
                          </p>
                          <p className="text-[11px] text-white/30 truncate leading-tight">
                            {era.real_name}
                          </p>
                        </div>
                      </div>
                    </TableCell>

                    <TableCell className="py-2">
                      <div className="flex items-center -space-x-1.5">
                        {displayTeams.map((teamName, idx) => (
                          <TeamLogo
                            key={idx}
                            teamName={teamName}
                            size="sm"
                            className="ring-1 ring-bg-card"
                          />
                        ))}
                      </div>
                    </TableCell>

                    <TableCell className="py-2">
                      <Badge
                        className={`inline-flex items-center gap-1 text-[9px] font-bold uppercase tracking-wider text-white px-1.5 py-0.5 rounded border-0 ${roleColor}`}
                      >
                        {getRoleIcon(era.primary_role)}
                        {era.primary_role}
                      </Badge>
                    </TableCell>

                    <TableCell className="py-2">
                      <span className="text-xs text-white/50 font-mono">
                        {era.year}
                      </span>
                    </TableCell>

                    <TableCell className="py-2 text-right">
                      <span className="text-hi font-display text-lg font-extrabold leading-none">
                        {era.total_score.toFixed(0)}
                      </span>
                    </TableCell>

                    <TableCell className="py-2 text-right">
                      <Button
                        variant={isSelected ? "ghost" : "outline"}
                        size="xs"
                        onClick={() => onSelectEra(era, asCoachMode)}
                        className={`text-[10px] font-bold uppercase tracking-wider cursor-pointer ${
                          isSelected
                            ? "text-positive hover:text-red-400 hover:bg-red-500/10 border border-positive/30 hover:border-red-500/30"
                            : "bg-white/4 border-white/10 text-white/60 hover:bg-hi/10 hover:text-hi hover:border-hi/30"
                        }`}
                        title={
                          isSelected
                            ? "Clique para remover do roster"
                            : "Clique para selecionar"
                        }
                      >
                        {isSelected ? (
                          <>
                            <Check className="size-3 mr-0.5" />
                            Selecionado
                          </>
                        ) : (
                          <>
                            <Plus className="size-3 mr-0.5" />
                            {asCoachMode ? "Coach" : "Selecionar"}
                          </>
                        )}
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </ScrollArea>
      )}

      {viewMode === "grid" && (
        <ScrollArea className="h-145">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-3 pr-3">
            {visibleEras.map((era) => {
              const isSelected = selectedEraIds.has(era.id);
              const hasImgError = imgErrors.has(era.id);
              const mainTeam = era.teams?.[0] ?? "";

              return (
                <div
                  key={era.id}
                  className={`group relative h-55 w-full rounded-xl overflow-hidden border bg-[#111111]/80 backdrop-blur-md transition-all duration-300 cursor-pointer ${
                    isSelected
                      ? "border-white/40 ring-1 ring-white/20 bg-white/8"
                      : "border-white/8 hover:border-white/20 hover:bg-[#161616] hover:-translate-y-1 hover:shadow-xl hover:shadow-black/50"
                  }`}
                  onClick={() => onSelectEra(era, asCoachMode)}
                  title={
                    isSelected
                      ? "Clique para remover do roster"
                      : "Clique para selecionar"
                  }
                >
                  {(() => {
                    const logoInfo = (
                      logoMapData as Record<
                        string,
                        { local_path: string | null; remote_url: string | null }
                      >
                    )[mainTeam];
                    const logoUrl =
                      logoInfo?.local_path || logoInfo?.remote_url || null;
                    return logoUrl ? (
                      <div className="absolute inset-0 flex items-center justify-center z-1 pointer-events-none">
                        <img
                          src={logoUrl}
                          alt=""
                          className="w-[70%] h-[70%] object-contain opacity-8 select-none"
                          style={{ filter: "grayscale(100%) brightness(1.8)" }}
                        />
                      </div>
                    ) : null;
                  })()}

                  {era.photo_url && !hasImgError ? (
                    <img
                      src={
                        era.photo_url.startsWith("http")
                          ? `/api/image-proxy?url=${encodeURIComponent(era.photo_url)}&v=2`
                          : era.photo_url
                      }
                      alt={era.handle}
                      onError={() => handleImgError(era.id)}
                      className="absolute bottom-0 left-1/2 -translate-x-1/2 h-[82%] w-auto max-w-[68%] object-contain object-bottom z-2 group-hover:scale-105 transition-all duration-300 opacity-80 group-hover:opacity-100"
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center z-2">
                      <div className="size-14 rounded-full bg-white/5 border border-white/10 flex items-center justify-center shadow-md backdrop-blur-sm group-hover:scale-110 transition-transform duration-300">
                        <span className="font-display text-xl font-bold text-white/40 tracking-wider">
                          {era.handle.slice(0, 2).toUpperCase()}
                        </span>
                      </div>
                    </div>
                  )}

                  <div
                    className="absolute inset-0 z-3 pointer-events-none"
                    style={{
                      background:
                        "linear-gradient(to bottom, rgba(255, 255, 255, 0.02) 0%, transparent 40%, rgba(10, 10, 10, 0.65) 75%, rgba(10, 10, 10, 0.95) 100%)",
                    }}
                  />

                  {isSelected && (
                    <div className="absolute inset-0 z-4 bg-white/10 flex items-center justify-center backdrop-blur-[1px]">
                      <div className="bg-white text-[#0A0A0A] rounded-full p-1.5 shadow-lg">
                        <Check className="size-4 stroke-3" />
                      </div>
                    </div>
                  )}

                  <div className="absolute top-2 right-2 z-10">
                    <div className="bg-white/5 border border-white/10 rounded-lg px-2 py-0.5 text-right backdrop-blur-md">
                      <span
                        className="text-white font-bold text-sm leading-none"
                        style={{ fontFamily: "var(--font-outfit)" }}
                      >
                        {era.total_score.toFixed(0)}
                      </span>
                      <span className="text-white/40 text-[8px] font-mono font-semibold ml-1">
                        PTS
                      </span>
                    </div>
                  </div>

                  <div className="absolute top-2 left-2 z-10">
                    <Badge className="flex items-center gap-1 text-[8px] font-semibold uppercase tracking-wider text-white/80 bg-white/5 border border-white/10 px-1.5 py-0.5 rounded-md shadow-sm">
                      {getRoleIcon(era.primary_role)}
                      {era.primary_role}
                    </Badge>
                  </div>

                  <div className="absolute bottom-0 left-0 right-0 z-10 p-2.5 space-y-0.5">
                    <p className="font-semibold text-sm text-white/90 group-hover:text-white leading-tight truncate">
                      {era.handle}
                    </p>
                    <div className="flex items-center justify-between">
                      <p className="text-[11px] text-white/35 truncate">
                        {mainTeam || era.real_name}
                      </p>
                      <span className="text-[10px] text-white/40 font-mono font-medium">
                        {era.year}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </ScrollArea>
      )}

      {visibleEras.length < filteredEras.length && (
        <div className="text-center pt-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setPage((p) => p + 1)}
            className="text-white/30 hover:text-white/60 text-xs gap-1.5 cursor-pointer"
          >
            <ChevronDown className="size-3.5" />
            Carregar mais ({filteredEras.length - visibleEras.length} restantes)
          </Button>
        </div>
      )}
    </div>
  );
};
