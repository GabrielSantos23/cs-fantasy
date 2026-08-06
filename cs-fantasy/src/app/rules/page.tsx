import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Separator } from "@/components/ui/separator";
import {
  Crosshair,
  Trophy,
  Swords,
  Target,
  ArrowRight,
  Home,
  Users,
  Gamepad2,
  Shield,
  Eye,
  Zap,
  Clock,
  BarChart3,
  GitBranch,
  Layers,
  Sigma,
} from "lucide-react";

export default function RulesPage() {
  return (
    <div className="min-h-screen flex flex-col justify-between bg-[#0A0A0A]">
      {/* Header Navigation */}
      <header className="sticky top-0 z-50 border-b border-white/[0.06] backdrop-blur-xl bg-[#0A0A0A]/90">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <Crosshair className="size-5 text-white/50" />
            <span className="font-display text-xl font-extrabold tracking-wider text-white/90">
              CS FANTASY MAJOR
            </span>
          </Link>

          <div className="flex items-center gap-3 text-xs font-semibold">
            <Button size="sm" render={<Link href="/build" />} className="bg-white text-[#0A0A0A] font-bold gap-1.5 hover:bg-white/90">
              <Gamepad2 className="size-3.5" />
              Montar Time
            </Button>
            <Button variant="ghost" size="sm" render={<Link href="/" />} className="gap-1.5">
              <Home className="size-3.5" />
              Início
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content Container */}
      <main className="max-w-4xl mx-auto w-full px-4 py-8 space-y-8 flex-1">
        {/* Title */}
        <div className="text-center space-y-2">
          <span className="text-xs uppercase tracking-widest text-white/50 font-bold">
            Guia Completo de Regras & Funcionamento
          </span>
          <h1 className="font-display text-4xl sm:text-5xl font-black uppercase text-white/90 tracking-tight">
            Como Funciona o CS Fantasy Major
          </h1>
          <p className="text-sm text-white/35 max-w-2xl mx-auto">
            Entenda como a força base, os 8 fatores de química, a probabilidade
            de confronto e o formato de Major determinam o resultado da
            simulação.
          </p>
        </div>

        {/* Section 1: Conceito & Montagem de Time */}
        <section className="rounded-xl p-6 border border-white/[0.06] space-y-4 bg-[#111111]/60">
          <h2 className="font-display text-2xl font-bold uppercase text-white/80 tracking-wide flex items-center gap-2">
            <Target className="size-5 text-white/50" />
            1. Montagem de Time & Força Base
          </h2>
          <p className="text-xs text-white/35 leading-relaxed">
            Você escolhe exatamente{" "}
            <strong className="text-white">5 Jogadores e 1 Coach</strong>. Cada
            escolha representa um pro player em uma era anual específica do
            Counter-Strike (entre 2000 e 2026), consumindo dados reais do{" "}
            <em>CS Player Eras Database</em>.
          </p>
          <div className="bg-white/5 p-4 rounded-xl space-y-2 text-xs">
            <div className="flex justify-between items-center text-white font-semibold border-b border-white/5 pb-2">
              <span className="flex items-center gap-1.5">
                <Sigma className="size-3.5 text-white/50" />
                Força Base (Base Power)
              </span>
              <span className="font-mono text-white/60">
                Σ total_score dos 5 jogadores
              </span>
            </div>
            <p className="text-white/25 text-[11px]">
              O <code className="text-white/60">total_score</code> é a pontuação
              acumulada que aquele jogador conquistou na era selecionada através
              de torneios S-Tier e Majors reais (ex: FalleN 2017 = 1.912 pts,
              s1mple 2021 = 1.780 pts). O Coach não soma força base direta, mas
              afeta a química.
            </p>
          </div>
        </section>

        {/* Section 2: Tabela de 8 Fatores de Química */}
        <section className="rounded-xl p-6 border border-white/[0.06] space-y-4 bg-[#111111]/60">
          <h2 className="font-display text-2xl font-bold uppercase text-white/80 tracking-wide flex items-center gap-2">
            <Swords className="size-5 text-white/50" />
            2. Os 8 Fatores de Química (Bônus & Ônus)
          </h2>
          <p className="text-xs text-white/35 leading-relaxed">
            A química final modifica a força base do time:{" "}
            <strong className="text-white">
              Força Final = Força Base × (1 + Σ modificadores)
            </strong>
            . Cada fator possui uma regra matemática clara:
          </p>

          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-white/10 hover:bg-transparent">
                  <TableHead className="text-white/25 uppercase text-[11px]">
                    Fator
                  </TableHead>
                  <TableHead className="text-white/25 uppercase text-[11px]">
                    Regra de Avaliação
                  </TableHead>
                  <TableHead className="text-white/25 uppercase text-[11px] text-right">
                    Efeito
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody className="text-xs text-white/35">
                <TableRow className="border-white/5">
                  <TableCell className="font-bold text-white">
                    1. Idioma em Comum
                  </TableCell>
                  <TableCell>
                    Avalia o idioma nativo dos 5 jogadores + coach.
                    <br />•{" "}Todos 6 compartilham:{" "}
                    <span className="text-positive">+8%</span> | 5
                    compartilham: <span className="text-positive">+6%</span> |
                    4: <span className="text-positive">+4%</span> | 3:{" "}
                    <span className="text-positive">+3%</span>
                    <br />•{" "}Nenhum par compartilha idioma:{" "}
                    <span className="text-negative">-6%</span>
                  </TableCell>
                  <TableCell className="text-right font-mono font-bold">
                    -6% a +8%
                  </TableCell>
                </TableRow>

                <TableRow className="border-white/5">
                  <TableCell className="font-bold text-white">
                    2. Histórico Juntos (Co-Play)
                  </TableCell>
                  <TableCell>
                    Consulta a matriz de co-play do banco de dados de torneios
                    juntos no passado.
                    <br />•{" "}
                    <span className="text-positive">+1%</span> por torneio
                    jogado no mesmo time por par (cap de +5% por par).
                    <br />•{" "}Cap máximo total de co-play:{" "}
                    <span className="text-positive">+15%</span>.
                  </TableCell>
                  <TableCell className="text-right font-mono font-bold">
                    0% a +15%
                  </TableCell>
                </TableRow>

                <TableRow className="border-white/5">
                  <TableCell className="font-bold text-white">
                    3. Balanceamento de Roles
                  </TableCell>
                  <TableCell>
                    Verifica a composição de funções (IGL, AWPer, Rifler, Entry,
                    Support, Lurker).
                    <br />•{" "}Possui ≥1 IGL <strong>E</strong> ≥1 AWPer:{" "}
                    <span className="text-positive">+5%</span>.
                    <br />•{" "}Sem IGL:{" "}
                    <span className="text-negative">-8%</span> | Sem AWPer:{" "}
                    <span className="text-negative">-4%</span>.
                    <br />•{" "}Mais de 2 da mesma função:{" "}
                    <span className="text-negative">-3%</span> por duplicata
                    extra.
                    <br />•{" "}5 da mesma função: penalidade de{" "}
                    <span className="text-negative">-15%</span>.
                  </TableCell>
                  <TableCell className="text-right font-mono font-bold">
                    -27% a +5%
                  </TableCell>
                </TableRow>

                <TableRow className="border-white/5">
                  <TableCell className="font-bold text-white">
                    4. Compatibilidade de Era
                  </TableCell>
                  <TableCell>
                    Avalia a distância do ano civil entre os jogadores do time (
                    <code className="text-white/60">max(ano) - min(ano)</code>).
                    <br />•{" "}Gap ≤ 3 anos (meta similar):{" "}
                    <span className="text-positive">+3%</span>.
                    <br />•{" "}Gap 4 a 7 anos:{" "}
                    <span className="text-neutral font-normal">0%</span>.
                    <br />•{" "}Gap 8 a 12 anos:{" "}
                    <span className="text-negative">-4%</span> | Gap &gt; 12
                    anos (choque de meta):{" "}
                    <span className="text-negative">-8%</span>.
                  </TableCell>
                  <TableCell className="text-right font-mono font-bold">
                    -8% a +3%
                  </TableCell>
                </TableRow>

                <TableRow className="border-white/5">
                  <TableCell className="font-bold text-white">
                    5. Experiência Tier Alto (Variância)
                  </TableCell>
                  <TableCell>
                    Soma o total de participações dos jogadores em campeonatos
                    Major e S-Tier na carreira.
                    <br />•{" "}&lt; 3 aparições totais:{" "}
                    <strong>Variância ×1.2</strong> (time instável em decisões).
                    <br />•{" "}3 a 15 aparições:{" "}
                    <strong>Variância ×1.0</strong> (padrão).
                    <br />•{" "}&gt; 15 aparições:{" "}
                    <strong>Variância ×0.9</strong> (time veterano e
                    consistente).
                  </TableCell>
                  <TableCell className="text-right font-mono font-bold">
                    Variância ×0.9 a ×1.2
                  </TableCell>
                </TableRow>

                <TableRow className="border-white/5">
                  <TableCell className="font-bold text-white">
                    6. Estabilidade de Roster
                  </TableCell>
                  <TableCell>
                    Conta a proporção de pares entre os 5 jogadores que possuem
                    histórico prévio de equipe.
                    <br />•{" "}0 pares se conhecem:{" "}
                    <span className="text-negative">-6%</span> | 1 a 3 pares:{" "}
                    <span className="text-negative">-2%</span>.
                    <br />•{" "}4 a 6 pares:{" "}
                    <span className="text-positive">+2%</span> | 7 a 9 pares:{" "}
                    <span className="text-positive">+4%</span> | 10 pares
                    (todos): <span className="text-positive">+8%</span>.
                  </TableCell>
                  <TableCell className="text-right font-mono font-bold">
                    -6% a +8%
                  </TableCell>
                </TableRow>

                <TableRow className="border-white/5">
                  <TableCell className="font-bold text-white">
                    7. Histórico do Coach
                  </TableCell>
                  <TableCell>
                    Verifica se o coach escolhido já treinou/jogou junto com
                    algum jogador do time.
                    <br />•{" "}
                    <span className="text-positive">+2%</span> por jogador que
                    já trabalhou com o coach (cap máximo de{" "}
                    <span className="text-positive">+8%</span>).
                  </TableCell>
                  <TableCell className="text-right font-mono font-bold">
                    0% a +8%
                  </TableCell>
                </TableRow>

                <TableRow className="border-white/5">
                  <TableCell className="font-bold text-white">
                    8. Diferença de Geração
                  </TableCell>
                  <TableCell>
                    Calcula a diferença de idade entre o jogador mais velho e o
                    mais novo.
                    <br />•{" "}Gap de idade ≤ 5 anos:{" "}
                    <span className="text-positive">+2%</span>.
                    <br />•{" "}Gap de idade 6 a 10 anos:{" "}
                    <span className="text-neutral font-normal">0%</span>.
                    <br />•{" "}Gap de idade &gt; 10 anos:{" "}
                    <span className="text-negative">-3%</span>.
                  </TableCell>
                  <TableCell className="text-right font-mono font-bold">
                    -3% a +2%
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
        </section>

        {/* Section 3: Sorteio de Adversários & Formato do Torneio */}
        <section className="rounded-xl p-6 border border-white/[0.06] space-y-4 bg-[#111111]/60">
          <h2 className="font-display text-2xl font-bold uppercase text-white/80 tracking-wide flex items-center gap-2">
            <Trophy className="size-5 text-white/50" />
            3. Formato do Major & Simulação de Partidas
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div className="bg-white/5 p-4 rounded-xl space-y-2">
              <h4 className="font-bold text-white uppercase text-sm flex items-center gap-1.5">
                <Users className="size-4 text-white/50" />
                Sorteio de Adversários
              </h4>
              <p className="text-white/35 leading-relaxed">
                O motor seleciona <strong>15 adversários reais</strong> vindos
                da tabela{" "}
                <code className="text-white/60">real_teams.json</code> (ex:{" "}
                <em>Natus Vincere 2021</em>, <em>Fnatic 2015</em>,{" "}
                <em>Astralis 2018</em>, <em>LG 2016</em>). Nenhum time é
                inventado. Times sem roster completo de 5 jogadores + coach são
                excluídos do sorteio.
              </p>
            </div>

            <div className="bg-white/5 p-4 rounded-xl space-y-2">
              <h4 className="font-bold text-white uppercase text-sm flex items-center gap-1.5">
                <GitBranch className="size-4 text-white/50" />
                Estrutura do Torneio
              </h4>
              <p className="text-white/35 leading-relaxed">
                •{" "}
                <strong>Fase de Grupos (BO1)</strong>: 4 grupos de 4 times.
                Formato round-robin com 3 rodadas por grupo. Os 2 melhores de
                cada grupo avançam para os playoffs (8 times).
                <br />•{" "}
                <strong>Playoffs (BO3)</strong>: Eliminação simples (Quartas →
                Semifinais → Grande Final em MD3).
              </p>
            </div>
          </div>

          {/* Probability Model */}
          <div className="bg-white/5 p-4 rounded-xl space-y-2 text-xs">
            <h4 className="font-bold text-white uppercase text-sm flex items-center gap-1.5">
              <BarChart3 className="size-4 text-white/50" />
              Modelo de Probabilidade e Upsets
            </h4>
            <p className="text-white/35 leading-relaxed">
              A chance base de vitória de uma partida é proporcional à razão de
              força final entre as equipes:
              <code className="text-white/60 block my-1 font-mono">
                ratioA = teamA.finalPower / (teamA.finalPower +
                teamB.finalPower)
              </code>
              A vantagem é atenuada por um fator de amortecimento (
              <code className="text-white/60">0.7 em BO1</code> e{" "}
              <code className="text-white/60">0.85 em BO3</code>) e combinada com
              ruído estocástico gaussiano. Isso significa que o time favorito
              vence a maioria dos jogos (~65-75%), mas zebras e{" "}
              <strong className="inline-flex items-center gap-0.5">
                <Zap className="size-3 text-upset" />
                UPSETS
              </strong>{" "}
              podem acontecer!
            </p>
          </div>
        </section>

        {/* CTA Banner */}
        <div className="text-center pt-4">
          <Button
            size="lg"
            render={<Link href="/build" />}
            className="bg-white text-[#0A0A0A] font-display text-xl font-extrabold uppercase tracking-wider px-8 py-6 rounded-xl hover:bg-white/90 transition-all shadow-xl gap-2"
          >
            <ArrowRight className="size-5" />
            Montar Meu Time Agora
          </Button>
        </div>
      </main>

      {/* Footer */}
      <footer className="max-w-7xl mx-auto w-full p-4 text-center text-xs text-white/15 border-t border-white/[0.06]">
        CS Fantasy Major • Especificação de Química & Engine de Simulação
      </footer>
    </div>
  );
}
