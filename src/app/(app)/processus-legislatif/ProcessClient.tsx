"use client";

import { useState } from "react";
import Image from "next/image";
import { Check, ChevronDown, Flag, X } from "lucide-react";

interface Institution {
  key: string;
  name: string;
  role: string;
  content: string;
  image: string;
}

interface Step {
  number: number;
  label: string;
  title: string;
  description: string;
  details: string;
}

interface ProcessClientProps {
  institutions: Institution[];
  acteursHeading: string;
  parcoursHeading: string;
  steps: Step[];
  finalNote: string;
}

function InstitutionCard({
  institution,
  onSelect,
}: {
  institution: Institution;
  onSelect: () => void;
}) {
  const [hovered, setHovered] = useState(false);

  return (
    <div
      className="rounded-xl overflow-hidden border border-border bg-card cursor-pointer"
      style={{
        transition: "box-shadow 0.2s ease",
        WebkitTransition: "box-shadow 0.2s ease",
        boxShadow: hovered
          ? "0 4px 12px rgba(0,0,0,0.1)"
          : "0 1px 3px rgba(0,0,0,0.05)",
      }}
      onClick={onSelect}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div className="relative" style={{ aspectRatio: "4/3" }}>
        <Image
          src={institution.image}
          alt={institution.name}
          fill
          className="object-cover"
          sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 20vw"
        />
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(to top, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0) 50%)",
          }}
        />
        <div
          className="absolute bottom-0 left-0 right-0"
          style={{ padding: "8px 10px" }}
        >
          <h3
            className="text-white font-semibold"
            style={{ fontSize: "clamp(0.75rem, 2vw, 0.875rem)", lineHeight: 1.3 }}
          >
            {institution.name}
          </h3>
        </div>
      </div>

      <div
        style={{ padding: "8px 10px" }}
        className="flex items-center justify-between gap-1"
      >
        <p
          className="text-muted-foreground"
          style={{ fontSize: "0.75rem", lineHeight: 1.4 }}
        >
          {institution.role}
        </p>
      </div>
    </div>
  );
}

function InstitutionModal({
  institution,
  onClose,
}: {
  institution: Institution;
  onClose: () => void;
}) {
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 50,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "16px",
        backgroundColor: "rgba(0,0,0,0.5)",
      }}
      onClick={onClose}
    >
      <div
        className="bg-card border border-border rounded-xl overflow-hidden"
        style={{
          maxWidth: "24rem",
          width: "100%",
          maxHeight: "80vh",
          overflowY: "auto",
          boxShadow: "0 8px 32px rgba(0,0,0,0.2)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Image */}
        <div className="relative" style={{ aspectRatio: "16/9" }}>
          <Image
            src={institution.image}
            alt={institution.name}
            fill
            className="object-cover"
            sizes="400px"
          />
          <div
            className="absolute inset-0"
            style={{
              background:
                "linear-gradient(to top, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0) 60%)",
            }}
          />
          <div
            className="absolute bottom-0 left-0 right-0"
            style={{ padding: "12px 16px" }}
          >
            <h3
              className="text-white font-semibold"
              style={{ fontSize: "1.125rem", lineHeight: 1.3 }}
            >
              {institution.name}
            </h3>
            <p
              className="text-white"
              style={{ fontSize: "0.8rem", opacity: 0.8, marginTop: "2px" }}
            >
              {institution.role}
            </p>
          </div>
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute bg-card rounded-full flex items-center justify-center"
            style={{
              top: "8px",
              right: "8px",
              width: "28px",
              height: "28px",
              opacity: 0.9,
            }}
          >
            <X className="text-foreground" style={{ width: "16px", height: "16px" }} />
          </button>
        </div>

        {/* Content */}
        <div
          className="text-sm text-muted-foreground"
          style={{ padding: "14px 16px", lineHeight: 1.7 }}
        >
          {institution.content}
        </div>
      </div>
    </div>
  );
}

export default function ProcessClient({
  institutions,
  acteursHeading,
  parcoursHeading,
  steps,
  finalNote,
}: ProcessClientProps) {
  const [selectedInstitution, setSelectedInstitution] = useState<string | null>(null);
  const [expandedStep, setExpandedStep] = useState<number | null>(null);

  const selected = institutions.find((i) => i.key === selectedInstitution);

  return (
    <>
      {/* Section 1: Les Acteurs */}
      <section style={{ marginBottom: "3rem" }}>
        <h2
          className="font-semibold text-foreground"
          style={{
            fontSize: "clamp(1.125rem, 3vw, 1.5rem)",
            marginBottom: "1rem",
          }}
        >
          {acteursHeading}
        </h2>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-5">
          {institutions.map((inst) => (
            <InstitutionCard
              key={inst.key}
              institution={inst}
              onSelect={() => setSelectedInstitution(inst.key)}
            />
          ))}
        </div>
      </section>

      {/* Institution modal */}
      {selected && (
        <InstitutionModal
          institution={selected}
          onClose={() => setSelectedInstitution(null)}
        />
      )}

      {/* Section 2: Le Parcours d'une loi */}
      <section>
        <h2
          className="font-semibold text-foreground"
          style={{
            fontSize: "clamp(1.125rem, 3vw, 1.5rem)",
            marginBottom: "1.5rem",
          }}
        >
          {parcoursHeading}
        </h2>

        <div style={{ maxWidth: "40rem" }}>
          <div className="flex flex-col gap-0">
            {steps.map((step, i) => {
              const isLast = i === steps.length - 1;
              const isExpanded = expandedStep === step.number;
              const isDecrets = step.number === 8;

              return (
                <div key={step.number} className="flex gap-3">
                  {/* Left column: dot + line */}
                  <div
                    className="flex flex-col items-center"
                    style={{ width: "14px" }}
                  >
                    <div
                      className="relative shrink-0"
                      style={{
                        width: "14px",
                        height: "14px",
                        marginTop: "3px",
                      }}
                    >
                      {isDecrets ? (
                        <div
                          className="absolute flex items-center justify-center rounded-full bg-primary"
                          style={{
                            top: "0px",
                            left: "0px",
                            width: "14px",
                            height: "14px",
                          }}
                        >
                          <Flag
                            className="text-primary-foreground"
                            style={{ width: "9px", height: "9px" }}
                          />
                        </div>
                      ) : step.number === 7 ? (
                        <div
                          className="absolute flex items-center justify-center rounded-full bg-primary"
                          style={{
                            top: "0px",
                            left: "0px",
                            width: "14px",
                            height: "14px",
                          }}
                        >
                          <Check
                            className="text-primary-foreground"
                            style={{ width: "10px", height: "10px" }}
                          />
                        </div>
                      ) : (
                        <div
                          className="absolute rounded-full border-2 border-primary bg-primary"
                          style={{
                            top: "2px",
                            left: "2px",
                            width: "10px",
                            height: "10px",
                          }}
                        />
                      )}
                    </div>
                    {!isLast && (
                      <div
                        className="border-primary"
                        style={{
                          flex: 1,
                          minHeight: "28px",
                          borderLeftWidth: "2px",
                          borderLeftStyle: "solid",
                        }}
                      />
                    )}
                  </div>

                  {/* Right column: content */}
                  <div
                    className="flex flex-col flex-1"
                    style={{ paddingBottom: isLast ? 0 : "8px" }}
                  >
                    <div
                      className="flex items-baseline gap-2 cursor-pointer"
                      onClick={() =>
                        setExpandedStep(isExpanded ? null : step.number)
                      }
                    >
                      <span className="text-xs text-muted-foreground font-medium">
                        {step.label}
                      </span>
                      <span className="text-sm font-medium text-foreground">
                        {step.title}
                      </span>
                      <ChevronDown
                        className="shrink-0 text-muted-foreground"
                        style={{
                          width: "12px",
                          height: "12px",
                          transform: isExpanded
                            ? "rotate(180deg)"
                            : "rotate(0deg)",
                          transition: "transform 0.2s ease",
                          WebkitTransition: "transform 0.2s ease",
                        }}
                      />
                    </div>

                    <p
                      className="text-xs text-muted-foreground"
                      style={{ marginTop: "2px" }}
                    >
                      {step.description}
                    </p>

                    {isExpanded && (
                      <p
                        className="text-sm text-muted-foreground"
                        style={{
                          marginTop: "6px",
                          lineHeight: 1.6,
                          opacity: 0.85,
                        }}
                      >
                        {step.details}
                      </p>
                    )}

                    {!isLast && (
                      <div style={{ minHeight: "8px" }} />
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Final note */}
          <p
            className="text-sm text-muted-foreground"
            style={{ marginTop: "2rem", opacity: 0.7 }}
          >
            {finalNote}
          </p>
        </div>
      </section>
    </>
  );
}
