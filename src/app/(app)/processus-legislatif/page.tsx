// src/app/(app)/processus-legislatif/page.tsx
// Page pédagogique sur le processus législatif en France

import { getTranslations } from "next-intl/server";
import ProcessClient from "./ProcessClient";

const INSTITUTION_KEYS = [
  "assemblee",
  "senat",
  "gouvernement",
  "president",
  "conseil",
] as const;

const INSTITUTION_IMAGES: Record<string, string> = {
  assemblee: "/images/institutions/assemblee-nationale.jpg",
  senat: "/images/institutions/senat.jpg",
  gouvernement: "/images/institutions/gouvernement.jpg",
  president: "/images/institutions/elysee.jpg",
  conseil: "/images/institutions/conseil-constitutionnel.jpg",
};

export default async function ProcessusLegislatif() {
  const t = await getTranslations("process");

  const institutions = INSTITUTION_KEYS.map((key) => ({
    key,
    name: t(`organes.${key}.trigger`),
    role: t(`organes.${key}.role`),
    content: t(`organes.${key}.content`),
    image: INSTITUTION_IMAGES[key],
  }));

  const steps = Array.from({ length: 8 }, (_, i) => ({
    number: i + 1,
    label: t("parcours.stepLabel", { number: i + 1 }),
    title: t(`parcours.step${i + 1}Title`),
    description: t(`parcours.step${i + 1}Desc`),
    details: t(`parcours.step${i + 1}Details`),
  }));

  return (
    <div className="container mx-auto p-6" style={{ maxWidth: "72rem" }}>
      <div style={{ marginBottom: "2rem" }}>
        <h1
          className="font-bold text-foreground"
          style={{ fontSize: "clamp(1.25rem, 3vw, 1.5rem)", marginBottom: "0.5rem" }}
        >
          {t("pageTitle")}
        </h1>
        <p className="text-muted-foreground" style={{ fontSize: "0.875rem" }}>
          {t("pageDesc")}
        </p>
      </div>

      <ProcessClient
        institutions={institutions}
        acteursHeading={t("organes.heading")}
        parcoursHeading={t("parcours.heading")}
        steps={steps}
        finalNote={t("parcours.finalNote")}
      />
    </div>
  );
}
