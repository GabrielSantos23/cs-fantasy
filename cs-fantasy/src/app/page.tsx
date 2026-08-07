import Link from "next/link";
import {
  Crosshair,
  Trophy,
  Gamepad2,
  Swords,
  ArrowRight,
  ChevronRight,
  Flame,
  Star,
  Zap,
  Shield,
  Users,
  Award,
  Globe,
  BarChart3,
  UserCheck,
  Sparkles,
  Target,
  Crown,
} from "lucide-react";

const getProxyPhoto = (url: string) =>
  url && url.startsWith("http")
    ? `/api/image-proxy?url=${encodeURIComponent(url)}&v=4`
    : url;

const TOP_RANKED_ERAS = [
  {
    rank: 1,
    handle: "s1mple",
    year: 2021,
    team: "Natus Vincere",
    score: 1780,
    role: "AWPer",
    nat: "UA",
    form: [1, 1, 1, 1, 1],
    photo: getProxyPhoto(
      "https://img-cdn.hltv.org/playerbodyshot/mJ4aRpdUSXtuzgHSp9ytjh.png?bg=3e4c54&h=100&ixlib=java-2.1.0&rect=117%2C8%2C467%2C467&w=100&s=28f682d1d4fe03280bd7d2daebe75559",
    ),
  },
  {
    rank: 2,
    handle: "coldzera",
    year: 2016,
    team: "Luminosity / SK",
    score: 1912,
    role: "Rifler",
    nat: "BR",
    form: [1, 1, 1, 1, 1],
    photo: getProxyPhoto(
      "https://img-cdn.hltv.org/playerbodyshot/eQN-pKLbiz_8oMSkAQVDfv.png?bg=3e4c54&h=100&ixlib=java-2.1.0&rect=124%2C8%2C467%2C467&w=100&s=e8d6167ef0f1860d4a4cfa88a4de6061",
    ),
  },
  {
    rank: 3,
    handle: "FalleN",
    year: 2017,
    team: "SK Gaming",
    score: 1850,
    role: "IGL",
    nat: "BR",
    form: [1, 1, 1, 0, 1],
    photo: getProxyPhoto(
      "https://img-cdn.hltv.org/playerbodyshot/gQbb4I0TeHmxx7bYBOtd7T.png?ixlib=java-2.1.0&w=400&s=744dd676bd5ad23e4adfc8dc8fcbaa80",
    ),
  },
  {
    rank: 4,
    handle: "device",
    year: 2018,
    team: "Astralis",
    score: 1720,
    role: "AWPer",
    nat: "DK",
    form: [1, 1, 1, 1, 0],
    photo: getProxyPhoto(
      "https://img-cdn.hltv.org/playerbodyshot/WF9qmrTLjONXmdRBZURIii.png?bg=3e4c54&h=100&ixlib=java-2.1.0&rect=124%2C0%2C467%2C467&w=100&s=e9580cb08bac04bee4cdb8ab7067097c",
    ),
  },
  {
    rank: 5,
    handle: "ZywOo",
    year: 2023,
    team: "Team Vitality",
    score: 1765,
    role: "AWPer",
    nat: "FR",
    form: [1, 1, 1, 1, 1],
    photo: getProxyPhoto(
      "https://img-cdn.hltv.org/playerbodyshot/blnoWFtH8GUJZjhr8H0P4u.png?bg=3e4c54&h=100&ixlib=java-2.1.0&rect=121%2C8%2C467%2C467&w=100&s=3e2f64c057b9a697de74efc831d0e967",
    ),
  },
];

const HISTORIC_TEAMS = [
  {
    name: "Astralis",
    year: 2018,
    power: "9.850 Pwr",
    era: "Dominância Absoluta",
    badge: "Tetra Major",
    logo: "/data/team_logos/astralis.png",
  },
  {
    name: "Natus Vincere",
    year: 2021,
    power: "9.620 Pwr",
    era: "Era s1mple Major Invicto",
    badge: "Stockholm Major",
    logo: "/data/team_logos/natus_vincere.png",
  },
  {
    name: "Fnatic",
    year: 2015,
    power: "9.410 Pwr",
    era: "Dinastia Olofmeister",
    badge: "Tri Major",
    logo: "/data/team_logos/fnatic.png",
  },
  {
    name: "Luminosity / SK",
    year: 2016,
    power: "9.580 Pwr",
    era: "Era de Ouro Brasileira",
    badge: "Bi Major",
    logo: "/data/team_logos/luminosity.png",
  },
];

const TEAM_LOGOS = [
  { name: "Vitality", logo: "/data/team_logos/team_vitality.png" },
  { name: "FaZe Clan", logo: "/data/team_logos/faze_clan.png" },
  { name: "NAVI", logo: "/data/team_logos/natus_vincere.png" },
  { name: "G2 Esports", logo: "/data/team_logos/g2_esports.png" },
  { name: "Spirit", logo: "/data/team_logos/team_spirit.png" },
  { name: "MOUZ", logo: "/data/team_logos/mouz.png" },
  { name: "Astralis", logo: "/data/team_logos/astralis.png" },
  { name: "Fnatic", logo: "/data/team_logos/fnatic.png" },
  { name: "Liquid", logo: "/data/team_logos/team_liquid.png" },
  { name: "Cloud9", logo: "/data/team_logos/cloud9.png" },
  { name: "FURIA", logo: "/data/team_logos/furia.png" },
  { name: "Heroic", logo: "/data/team_logos/heroic.png" },
];

const FLOATING_DATA = [
  { name: "s1mple", value: "1.780", icon: Crown },
  { name: "coldzera", value: "1.912", icon: Target },
  { name: "FalleN", value: "1.850", icon: Crosshair },
  { name: "ZywOo", value: "1.765", icon: Sparkles },
];

export default function HomePage() {
  return (
    <div className="min-h-screen relative flex flex-col bg-[#0A0A0A] text-white">
      <header className="header-pill">
        <Link href="/" className="flex items-center gap-2 shrink-0">
          <div className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center">
            <Crosshair className="w-4 h-4 text-white/70" />
          </div>
          <span className="font-bold text-sm text-white/90 tracking-wide hidden sm:inline">
            CS FANTASY
          </span>
        </Link>

        <nav className="nav-pill">
          <Link href="/">Home</Link>
          <Link href="/build">Team Builder</Link>
          <Link href="/rules">Regras</Link>
        </nav>

        <Link href="/build" className="header-cta">
          <Gamepad2 className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Montar Time</span>
          <ArrowRight className="w-3 h-3" />
        </Link>
      </header>

      <main className="flex-1 px-3 sm:px-4 pt-20 pb-8 max-w-340 mx-auto w-full space-y-6">
        <section className="hero-card px-6 sm:px-12 pt-16 sm:pt-20 pb-8 min-h-340 flex flex-col">
          <div className="floating-badge pos-top-left">
            <div className="badge-icon" style={{ overflow: "hidden" }}>
              <img
                src={TOP_RANKED_ERAS[0].photo}
                alt={TOP_RANKED_ERAS[0].handle}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="badge-info">
              <span className="badge-name">• {FLOATING_DATA[0].name}</span>
              <span className="badge-value">{FLOATING_DATA[0].value}</span>
            </div>
          </div>

          <div className="floating-badge pos-top-right">
            <div className="badge-info" style={{ textAlign: "right" }}>
              <span className="badge-name">{FLOATING_DATA[1].name} •</span>
              <span className="badge-value">{FLOATING_DATA[1].value}</span>
            </div>
            <div className="badge-icon" style={{ overflow: "hidden" }}>
              <img
                src={TOP_RANKED_ERAS[1].photo}
                alt={TOP_RANKED_ERAS[1].handle}
                className="w-full h-full object-cover"
              />
            </div>
          </div>

          <div className="floating-badge pos-bottom-left">
            <div className="badge-icon" style={{ overflow: "hidden" }}>
              <img
                src={TOP_RANKED_ERAS[2].photo}
                alt={TOP_RANKED_ERAS[2].handle}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="badge-info">
              <span className="badge-name">• {FLOATING_DATA[2].name}</span>
              <span className="badge-value">{FLOATING_DATA[2].value}</span>
            </div>
          </div>

          <div className="floating-badge pos-bottom-right">
            <div className="badge-info" style={{ textAlign: "right" }}>
              <span className="badge-name">{FLOATING_DATA[3].name} •</span>
              <span className="badge-value">{FLOATING_DATA[3].value}</span>
            </div>
            <div className="badge-icon" style={{ overflow: "hidden" }}>
              <img
                src={TOP_RANKED_ERAS[4].photo}
                alt={TOP_RANKED_ERAS[4].handle}
                className="w-full h-full object-cover"
              />
            </div>
          </div>

          <div
            className="connector-line"
            style={{ top: "15%", left: "3%", width: 120, height: 80 }}
          >
            <svg>
              <path d="M 0 40 Q 60 0 120 40" />
            </svg>
          </div>
          <div
            className="connector-line"
            style={{ top: "60%", right: "3%", width: 100, height: 60 }}
          >
            <svg>
              <path d="M 0 30 Q 50 60 100 30" />
            </svg>
          </div>

          <div className="light-rays">
            <div className="ray" />
            <div className="ray" />
            <div className="ray" />
            <div className="ray" />
            <div className="ray" />
          </div>

          <div className="relative z-10 flex-1 flex flex-col items-center justify-center text-center gap-6">
            <Link href="/rules" className="cta-badge-pill">
              <span className="pill-icon">
                <Trophy className="w-3 h-3 text-white/60" />
              </span>
              <span>Simulador de Majors com Química Real</span>
              <ArrowRight className="w-3 h-3 text-white/40" />
            </Link>

            <h1
              className="text-[clamp(2.2rem,6vw,4.5rem)] font-bold leading-[1.05] tracking-tight max-w-3xl"
              style={{ fontFamily: "var(--font-outfit)" }}
            >
              Monte o seu <span className="text-[#8a8a8a]">Dream Team</span>{" "}
              Histórico
            </h1>

            <p className="text-sm text-white/40 max-w-lg">
              Escale 5 pro players e 1 coach de qualquer era (2013–2026) e
              dispute um Major contra lendas do CS
            </p>

            <div className="flex items-center gap-3 pt-2 flex-wrap justify-center">
              <Link href="/build" className="btn-solid-white">
                <span>Começar Montagem</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link href="/rules" className="btn-outline-subtle">
                <BarChart3 className="w-4 h-4 text-white/50" />
                <span>Ver Fatores de Química</span>
              </Link>
            </div>
          </div>

          <div className="relative z-10 flex items-end justify-between pt-8">
            <span className="text-[11px] text-white/20 hidden md:block">
              CS Fantasy Major
            </span>

            <div className="progress-dots">
              <div className="dot active" />
              <div className="dot" />
              <div className="dot" />
            </div>
          </div>
        </section>

        <section className="team-logo-strip-wrapper">
          <div className="team-logo-strip">
            {[...TEAM_LOGOS, ...TEAM_LOGOS].map((team, i) => (
              <div key={`${team.name}-${i}`} className="team-logo-item">
                <img src={team.logo} alt={team.name} />
                <span className="logo-name">{team.name}</span>
              </div>
            ))}
          </div>
        </section>

        <section className="grid grid-cols-1 lg:grid-cols-12 gap-5 pt-4">
          <div className="lg:col-span-4 space-y-4">
            <div className="flex items-center justify-between">
              <h2
                className="text-base font-semibold text-white/90 flex items-center gap-2"
                style={{ fontFamily: "var(--font-outfit)" }}
              >
                <Trophy className="w-4 h-4 text-white/40" />
                Top 5 Peak Eras
              </h2>
              <span className="text-[10px] text-white/20 font-mono">
                CS Database
              </span>
            </div>

            <div className="space-y-2">
              {TOP_RANKED_ERAS.map((era) => (
                <div
                  key={era.rank}
                  className="premium-card p-3.5! flex items-center justify-between group cursor-default"
                >
                  <div className="flex items-center gap-3">
                    <span
                      className="text-lg font-bold text-white/20 w-5 text-center"
                      style={{ fontFamily: "var(--font-outfit)" }}
                    >
                      {era.rank}
                    </span>
                    <div className="w-8 h-8 rounded-full overflow-hidden border border-white/10 bg-white/5 shrink-0">
                      <img
                        src={era.photo}
                        alt={era.handle}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-sm text-white/80 group-hover:text-white transition-colors">
                          {era.handle}
                        </span>
                        <span className="text-[10px] font-medium bg-white/5 text-white/40 px-1.5 py-0.5 rounded">
                          {era.year}
                        </span>
                      </div>
                      <span className="text-[11px] text-white/30 truncate block">
                        {era.team} • {era.role}
                      </span>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="font-mono text-sm font-semibold text-white/50 block">
                      {era.score}
                    </span>
                    <div className="flex items-center gap-0.5 justify-end mt-0.5">
                      {era.form.map((f, i) => (
                        <span
                          key={i}
                          className={`w-1.5 h-1.5 rounded-full ${
                            f === 1 ? "bg-emerald-500/60" : "bg-red-500/60"
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="lg:col-span-5 space-y-4">
            <h2
              className="text-base font-semibold text-white/90 flex items-center gap-2"
              style={{ fontFamily: "var(--font-outfit)" }}
            >
              <Zap className="w-4 h-4 text-white/40" />
              Motor de Simulação
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {[
                {
                  icon: Globe,
                  title: "Idioma & Co-Play",
                  desc: "Bônus por idioma nativo comum e histórico de co-play em torneios passados.",
                },
                {
                  icon: Shield,
                  title: "Balanceamento de Roles",
                  desc: "Exige pelo menos 1 IGL e 1 AWPer. Penaliza duplicações e times mono-função.",
                },
                {
                  icon: UserCheck,
                  title: "Sintonia com Coach",
                  desc: "O técnico concede até +8% de química se já tiver trabalhado com os jogadores.",
                },
                {
                  icon: Flame,
                  title: "Choque de Meta & Variância",
                  desc: "Eras muito distantes sofrem atrito de meta. Aparições Tier-1 reduzem variância.",
                },
              ].map((card) => (
                <div key={card.title} className="premium-card space-y-2">
                  <card.icon className="w-4 h-4 text-white/30" />
                  <h3 className="font-semibold text-sm text-white/80">
                    {card.title}
                  </h3>
                  <p className="text-[11px] text-white/30 leading-relaxed">
                    {card.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
          <div className="lg:col-span-3 space-y-4">
            <h2
              className="text-base font-semibold text-white/90 flex items-center gap-2"
              style={{ fontFamily: "var(--font-outfit)" }}
            >
              <Users className="w-4 h-4 text-white/40" />
              Adversários Históricos
            </h2>

            <div className="space-y-2">
              {HISTORIC_TEAMS.map((t, idx) => (
                <div
                  key={idx}
                  className="premium-card p-3.5! space-y-1.5 group cursor-default"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-lg overflow-hidden border border-white/10 bg-white/5 shrink-0 flex items-center justify-center p-0.5">
                        <img
                          src={t.logo}
                          alt={t.name}
                          className="w-full h-full object-contain"
                        />
                      </div>
                      <span className="font-semibold text-sm text-white/80 group-hover:text-white transition-colors">
                        {t.name}
                      </span>
                    </div>
                    <span className="text-[10px] font-medium text-white/40 bg-white/5 px-1.5 py-0.5 rounded">
                      {t.year}
                    </span>
                  </div>
                  <p className="text-[11px] text-white/25">{t.era}</p>
                  <div className="flex items-center justify-between text-[10px] pt-0.5">
                    <span className="font-mono text-emerald-500/60 font-semibold">
                      {t.power}
                    </span>
                    <span className="text-white/20">{t.badge}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="premium-card rounded-2xl! p-10! text-center space-y-5 mt-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/5 border border-white/8 rounded-full text-[11px] font-semibold text-white/50">
            <Swords className="w-3 h-3" />
            Pronto para o Desafio?
          </div>

          <h2
            className="text-3xl sm:text-4xl font-bold text-white/90 tracking-tight max-w-2xl mx-auto leading-tight"
            style={{ fontFamily: "var(--font-outfit)" }}
          >
            Monte Seu Roster e{" "}
            <span className="text-[#8a8a8a]">Simule o Major</span> Agora
          </h2>

          <p className="text-sm text-white/35 max-w-xl mx-auto">
            Descubra se o seu Dream Team consegue superar os 15 maiores campeões
            da história do Counter-Strike!
          </p>

          <div className="pt-2">
            <Link href="/build" className="btn-solid-white">
              <Gamepad2 className="w-4 h-4" />
              <span>Entrar no Team Builder</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </section>
      </main>

      <footer className="max-w-340 mx-auto w-full px-6 py-8 text-center text-[11px] text-white/15">
        CS Fantasy Major • Consome dados estatísticos do CS Player Eras Database
        (HLTV & Liquipedia).
      </footer>
    </div>
  );
}
