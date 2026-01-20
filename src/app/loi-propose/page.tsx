// src/app/dossiers-en-cours/page.tsx
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Clock, AlertCircle, CheckCircle2, ArrowRight } from "lucide-react";
import Link from "next/link";

// Données fictives pour le placeholder (à remplacer plus tard par vraies données)
const fakeDossiers = [
  {
    id: "PLF2026",
    titre: "Projet de loi de finances pour 2026",
    statut: "En commission mixte paritaire",
    progression: 82,
    dateLimite: "15 janvier 2026",
    priorite: "haute",
    theme: "Finances publiques",
  },
  {
    id: "PJLSECURITE",
    titre: "Projet de loi relatif à la sécurité intérieure",
    statut: "En discussion au Sénat",
    progression: 45,
    dateLimite: "28 février 2026",
    priorite: "moyenne",
    theme: "Sécurité",
  },
  {
    id: "PPLENVIRONNEMENT",
    titre: "Proposition de loi sur la transition écologique 2030",
    statut: "En commission des affaires économiques",
    progression: 18,
    dateLimite: "Non définie",
    priorite: "basse",
    theme: "Environnement",
  },
];

export default function DossiersEnCoursPage() {
  return (
    <div className="container mx-auto py-8 px-4 md:px-6 lg:px-8">
      {/* En-tête du dashboard */}
      <div className="mb-10">
        <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-2">
          Dossiers en cours
        </h1>
        <p className="text-lg text-muted-foreground">
          Suivi en temps réel des principaux textes législatifs en discussion
        </p>
      </div>

      {/* Statistiques rapides (KPIs) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Dossiers actifs
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">47</div>
            <p className="text-xs text-muted-foreground mt-1">+8 depuis 1 mois</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Priorité haute
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-red-600 dark:text-red-400">12</div>
            <p className="text-xs text-muted-foreground mt-1">En urgence ou procédure accélérée</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Avancement moyen
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">58%</div>
            <Progress value={58} className="mt-2 h-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Prochain délai
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">15 janv.</div>
            <p className="text-xs text-muted-foreground mt-1">Vote solennel PLF 2026</p>
          </CardContent>
        </Card>
      </div>

      {/* Liste des dossiers en cours */}
      <div className="space-y-6">
        {fakeDossiers.map((dossier) => (
          <Card key={dossier.id} className="overflow-hidden hover:shadow-md transition-shadow">
            <CardHeader className="pb-4">
              <div className="flex items-start justify-between flex-wrap gap-4">
                <div>
                  <CardTitle className="text-xl mb-1">{dossier.titre}</CardTitle>
                  <CardDescription className="flex items-center gap-2 flex-wrap">
                    <Badge variant="outline">{dossier.theme}</Badge>
                    <Badge
                      variant={
                        dossier.priorite === "haute"
                          ? "destructive"
                          : dossier.priorite === "moyenne"
                          ? "secondary"
                          : "default"
                      }
                    >
                      {dossier.priorite === "haute" ? "Priorité haute" : dossier.priorite}
                    </Badge>
                  </CardDescription>
                </div>

                {/* Statut avec icône */}
                <div className="flex items-center gap-2">
                  {dossier.statut.includes("adopté") || dossier.statut.includes("promulguée") ? (
                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                  ) : dossier.statut.includes("urgence") ? (
                    <AlertCircle className="h-5 w-5 text-amber-600" />
                  ) : (
                    <Clock className="h-5 w-5 text-blue-600" />
                  )}
                  <span className="text-sm font-medium">{dossier.statut}</span>
                </div>
              </div>
            </CardHeader>

            <CardContent>
              <div className="space-y-4">
                {/* Barre de progression */}
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Avancement</span>
                    <span>{dossier.progression}%</span>
                  </div>
                  <Progress value={dossier.progression} className="h-2" />
                </div>

                {/* Infos complémentaires */}
                <div className="flex flex-wrap gap-6 text-sm text-muted-foreground">
                  <div>
                    <span className="font-medium">Prochain jalon :</span> {dossier.dateLimite}
                  </div>
                  <div>
                    <span className="font-medium">Texte n° :</span> {dossier.id}
                  </div>
                </div>

                {/* Bouton d'action */}
                <div className="pt-4">
                  <Button variant="outline" size="sm" asChild>
                    <Link href={`/dossiers/${dossier.id.toLowerCase()}`}>
                      Voir le dossier complet <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Message quand il n'y a plus de contenu */}
      {fakeDossiers.length === 0 && (
        <div className="text-center py-16 text-muted-foreground">
          <p className="text-lg">Aucun dossier majeur en cours pour le moment</p>
          <p className="mt-2">Revenez bientôt pour suivre les nouvelles initiatives</p>
        </div>
      )}
    </div>
  );
}