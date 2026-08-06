import type { Metadata } from "next";
import { Inter, Bebas_Neue, Geist, Outfit } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";

const geist = Geist({subsets:['latin'],variable:'--font-sans'});

const inter = Inter({
  subsets: ["latin", "cyrillic"],
  variable: "--font-inter",
  display: "swap",
});

const bebasNeue = Bebas_Neue({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-bebas",
  display: "swap",
});

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
  display: "swap",
});

export const metadata: Metadata = {
  title: "CS Fantasy Major",
  description:
    "Monte seu dream team de Counter-Strike com jogadores de todas as eras e dispute um Major contra times históricos reais.",
  keywords: ["counter-strike", "fantasy", "major", "cs2", "csgo", "esports"],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR" className={cn("dark", inter.variable, bebasNeue.variable, outfit.variable, "font-sans", geist.variable)}>
      <body className="min-h-screen bg-bg text-text antialiased">
        {children}
      </body>
    </html>
  );
}
