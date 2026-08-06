import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#0A0A0A] flex flex-col items-center justify-center p-6 text-center space-y-4">
      <h1 className="font-display text-6xl font-extrabold text-white/50">404</h1>
      <h2 className="text-xl font-bold text-white">Página Não Encontrada</h2>
      <p className="text-xs text-white/30 max-w-sm">
        A página solicitada não existe ou foi movida.
      </p>
      <Link
        href="/"
        className="bg-white text-[#0A0A0A] hover:bg-white/90 px-6 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider"
      >
        Voltar ao Início
      </Link>
    </div>
  );
}
