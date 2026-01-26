// src/app/layout.tsx
import type { Metadata } from "next";  // Import pour les métadonnées de la page
import { GeistSans } from "geist/font/sans";  // Police sans-serif (moderne et minimaliste)
import { GeistMono } from "geist/font/mono";  // Police mono pour du code ou des données
import Link from "next/link"
import "./globals.css";  // Styles globaux, incluant ceux de Shadcn/Tailwind
import { Button } from "@/components/ui/button"

// Composants personnalisés
import { Logo } from "@/components/ui/Logo";  // Logo du site (export nommé)
import Sidebar from "@/components/Sidebar";  // Sidebar pour la navigation

// Import pour le ThemeProvider (gère light/dark/system)
import { ThemeProvider } from "next-themes";  // Bibliothèque pour gérer les thèmes dynamiquement

export const metadata: Metadata = {
  title: "LoiClair – Lois claires, République accessible",  // Titre de la page
  description: "Comprendre simplement l'activité législative française",  // Description SEO
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;  // Contenu des pages enfants
}>) {
  return (
    <html
      lang="fr"  // Langue française
      className={`${GeistSans.variable} ${GeistMono.variable}`}  // Applique les polices variables
      suppressHydrationWarning  // Évite les warnings de Next.js liés au thème (important pour next-themes)
    >
      <body className="min-h-screen antialiased bg-background flex flex-col">
        {/* 
          ThemeProvider : Gère le dark mode.
          - defaultTheme="system" : Suit les préférences du système de l'utilisateur (light/dark).
          - enableSystem : Active la détection automatique du thème système.
          - attribute="class" : Ajoute la classe 'dark' à html quand le mode sombre est actif.
          Cela rend ton dashboard adaptable : fond clair en light, fond sombre en dark.
          Tous les composants Shadcn (comme buttons, cards) s'adapteront automatiquement.
        */}
        <ThemeProvider
          attribute="class"  // Utilise la classe 'dark' pour activer le mode sombre
          defaultTheme="system"  // Par défaut, suit le thème du système (OS de l'utilisateur)
          enableSystem  // Active la détection du thème système
        >
          {/* FLEX ROW : SIDEBAR + CONTENU PRINCIPAL */}
          <div className="flex flex-1 overflow-hidden">
            {/* SIDEBAR FIXE À GAUCHE – largeur fixe */}
            <aside className="w-72 flex-shrink-0 bg-background border-r">
              <Sidebar />  {/* Navigation latérale pour un dashboard clair */}
            </aside>

            {/* CONTENU PRINCIPAL – démarre juste après la sidebar */}
            <main className="flex-1 overflow-auto bg-background">
              {/* Padding intérieur + décalage visuel pour un look minimaliste */}
              <div className="p-6 md:p-8 lg:p-10">
                {children}  {/* Ici s'insère le contenu des pages (ex: dashboard, fiches lois) */}
              </div>
            </main>
          </div>

          {/* FOOTER EN BAS */}
          <footer className="border-t py-5 z-50 text-center text-xs text-muted-foreground bg-muted/40 mt-auto">
            <div className="container mx-auto">
              <Link href="/about">
              <Button
              variant="ghost"
              className="text-xs"
            
              >A Propos de LoiClair</Button> 
               
          </Link>Données publiques officielles • © {new Date().getFullYear()}
            </div>
          </footer>
        </ThemeProvider>
      </body>
    </html>
  );
}

