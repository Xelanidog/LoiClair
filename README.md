# LoiClair

**Le tableau de bord citoyen de l'activité législative française.**

LoiClair rend les lois, débats et votes du Parlement compréhensibles par tous, sans expertise juridique. Grâce à l'IA et aux données ouvertes officielles, chaque citoyen peut suivre ce que fait la République, simplement.

[Voir le site](https://loiclair.fr) · [Signaler un problème](https://github.com/Xelanidog/LoiClair/issues)

---

## Fonctionnalités

- **Dossiers législatifs** — parcourir, filtrer et comprendre les textes de loi en cours
- **Résumés IA** — chaque loi expliquée en langage clair avec ses impacts concrets (via xAI/Grok)
- **Composition des institutions** — visualiser la répartition de l'Assemblée nationale, du Sénat et du Gouvernement
- **KPIs & statistiques** — indicateurs clés de l'activité législative, mis à jour automatiquement
- **Fil d'actualité** — activité législative mensuelle en un coup d'oeil
- **Processus législatif** — comprendre comment une loi est fabriquée, étape par étape
- **Signalement citoyen** — signaler une erreur ou un problème directement depuis chaque page
- **Bilingue FR/EN** — interface disponible en français et en anglais, avec toggle instantané
- **Documentation** — guide utilisateur, méthodologie, glossaire et conformité IA
- **Notes de version** — historique des évolutions du site, accessible depuis le pied de page

## Stack technique

| Couche | Technologies |
|---|---|
| Frontend | [Next.js](https://nextjs.org) 16, [React](https://react.dev) 19, [TypeScript](https://www.typescriptlang.org) 5 |
| UI | [Tailwind CSS](https://tailwindcss.com) v4, [shadcn/ui](https://ui.shadcn.com), [Framer Motion](https://www.framer.com/motion), [next-intl](https://next-intl.dev) |
| Base de données | [Supabase](https://supabase.com) (PostgreSQL) |
| IA | [xAI/Grok](https://x.ai) via [Vercel AI SDK](https://sdk.vercel.ai) |
| Pipeline de données | Python + GitHub Actions (import quotidien depuis l'open data de l'Assemblée nationale) |
| Hébergement | [Vercel](https://vercel.com) |

## Architecture

```
src/
├── app/
│   ├── (app)/                  # Routes principales
│   │   ├── Composition/        # Dashboard comparatif des institutions
│   │   ├── organes/            # Pages détaillées par institution
│   │   │   ├── assemblee/      # Assemblée nationale
│   │   │   ├── senat/          # Sénat
│   │   │   ├── gouvernement/   # Gouvernement
│   │   │   └── conseil-constitutionnel/ # Conseil constitutionnel
│   │   ├── dossiers-legislatifs/
│   │   │   └── [uid]/resume-ia # Résumés IA par dossier
│   │   ├── KPIs/               # Indicateurs clés
│   │   ├── Month/              # Fil d'actualité
│   │   ├── type-textes/        # Types de textes législatifs
│   │   ├── processus-legislatif/
│   │   ├── about/
│   │   ├── changelog/           # Notes de version
│   │   └── documentation/      # Guide, méthode, glossaire, conformité IA
│   ├── api/
│   │   ├── login/              # Authentification par mot de passe
│   │   ├── resume-loi/         # Endpoint IA (résumés Grok)
│   │   └── signaler/           # Endpoint signalements citoyens
│   └── layout.tsx              # Layout avec sidebar fixe
├── components/
│   ├── ui/                     # Composants shadcn/ui
│   ├── composition/            # Composants partagés (KpiItem, PieChart, tables)
│   └── ...                     # Composants métier (Sidebar, filtres, charts)
├── lib/
│   ├── supabase.ts             # Client Supabase
│   ├── prompts.ts              # Prompts et config IA centralisés
│   └── utils.ts                # Utilitaires (cn, etc.)
script python/                  # Pipeline d'import des données
.github/workflows/              # GitHub Actions (3 workflows)
```

**Pattern Server/Client** — les pages sont des Server Components qui récupèrent les données (Supabase), puis les passent en props à des Client Components (`"use client"`) pour l'interactivité (filtres, animations, graphiques).

## Installation locale

### Prérequis

- [Node.js](https://nodejs.org) 18+
- [npm](https://www.npmjs.com)
- Un projet [Supabase](https://supabase.com) (pour la base de données)
- Une clé API [xAI](https://x.ai) (pour les résumés IA — optionnel)

### Étapes

```bash
# 1. Cloner le repo
git clone https://github.com/Xelanidog/LoiClair.git
cd LoiClair

# 2. Installer les dépendances
npm install

# 3. Configurer les variables d'environnement
cp .env.example .env.local
# Puis remplir les valeurs (voir section ci-dessous)

# 4. Lancer le serveur de développement
npm run dev
```

Le site est accessible sur [http://localhost:3000](http://localhost:3000).

## Variables d'environnement

Créer un fichier `.env.local` à la racine avec :

| Variable | Description |
|---|---|
| `SUPABASE_URL` | URL de votre projet Supabase |
| `SUPABASE_KEY` | Clé secrète (service role) Supabase |
| `XAI_API_KEY` | Clé API xAI/Grok (pour les résumés IA) |
| `SITE_PASSWORD` | Mot de passe de protection du site (optionnel) |
| `GITHUB_TOKEN` | Token GitHub pour les workflows CI/CD |

## Pipeline de données

Les données législatives sont importées automatiquement depuis l'[open data de l'Assemblée nationale](https://data.assemblee-nationale.fr) via 3 workflows GitHub Actions :

| Workflow | Fréquence | Description |
|---|---|---|
| `update-data.yml` | Quotidien (2h UTC) | Import des acteurs, organes, dossiers, textes, actes législatifs et scrutins dans Supabase |
| `notify-signalement.yml` | Sur événement | Email de notification à chaque signalement citoyen |
| `recap-hebdo.yml` | Hebdomadaire (lundi 8h UTC) | Récap par email des signalements de la semaine |

Les scripts Python d'import se trouvent dans le dossier `script python/`.

## Contribuer

Les contributions sont les bienvenues ! Que ce soit pour corriger un bug, améliorer le design, ajouter des données ou proposer une fonctionnalité :

1. Ouvrir une [issue](https://github.com/Xelanidog/LoiClair/issues) pour discuter de l'idée
2. Forker le repo et créer une branche
3. Soumettre une pull request

Contact : [loiclair.fr@gmail.com](mailto:loiclair.fr@gmail.com)

## Sources de données

Toutes les données proviennent de sources officielles ouvertes, sans modification ni interprétation partisane :

- [Assemblée nationale — Open Data](https://data.assemblee-nationale.fr) (source primaire)
- [Assemblée nationale](https://www.assemblee-nationale.fr)
- [Sénat](https://www.senat.fr)
- [Conseil constitutionnel](https://www.conseil-constitutionnel.fr)
- [Légifrance](https://www.legifrance.gouv.fr)

## Licence

Ce projet est distribué sous licence [GNU AGPL v3](./LICENSE).

Cela signifie que vous êtes libre de l'utiliser, le modifier et le redistribuer, à condition de garder le code source ouvert sous la même licence. Si vous déployez une version modifiée comme service web, vous devez en publier le code source.
