import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

interface FunnelStep {
  label: string;
  count: number;
  description: string;
}

interface LegislativeFunnelProps {
  steps: FunnelStep[];
}

const STEP_COLORS = [
  { bg: '#A8D5BA', text: '#1B4332' },
  { bg: '#7BC89B', text: '#1B4332' },
  { bg: '#4DB877', text: '#14532D' },
  { bg: '#27AE60', text: '#FFFFFF' },
  { bg: '#1E8C4D', text: '#FFFFFF' },
];

export function LegislativeFunnel({ steps }: LegislativeFunnelProps) {
  const maxSqrt = Math.sqrt(steps[0].count);
  const getBarWidth = (count: number) => {
    const raw = (Math.sqrt(count) / maxSqrt) * 100;
    return Math.max(raw, 15);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Parcours législatif</CardTitle>
        <CardDescription>
          Du dépôt à l'application : comment les dossiers progressent à travers le processus législatif
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col">
          {steps.map((step, i) => {
            const width = getBarWidth(step.count);
            const color = STEP_COLORS[i] || STEP_COLORS[STEP_COLORS.length - 1];
            const isLast = i === steps.length - 1;

            const conversionRate = !isLast && steps[i].count > 0
              ? ((steps[i + 1].count / steps[i].count) * 100).toFixed(1)
              : null;

            const totalRate = i > 0 && steps[0].count > 0
              ? ((step.count / steps[0].count) * 100).toFixed(1)
              : null;

            return (
              <div key={step.label}>
                <div className="py-2">
                  {/* Label */}
                  <div className="flex items-center gap-2 mb-1.5">
                    <span
                      className="flex-shrink-0 rounded-full flex items-center justify-center text-xs font-bold"
                      style={{
                        width: '1.5rem',
                        height: '1.5rem',
                        backgroundColor: color.bg,
                        color: color.text,
                      }}
                    >
                      {i + 1}
                    </span>
                    <span className="font-semibold text-sm">{step.label}</span>
                    {totalRate && (
                      <span className="text-xs text-muted-foreground ml-auto">
                        {totalRate} % du total
                      </span>
                    )}
                  </div>

                  {/* Barre + nombre */}
                  <div className="flex items-center gap-3 ml-8">
                    <div
                      className="h-8 rounded-md flex items-center justify-end pr-3"
                      style={{
                        width: `${width}%`,
                        backgroundColor: color.bg,
                        minWidth: '3rem',
                      }}
                    >
                      <span
                        className="text-sm font-bold whitespace-nowrap"
                        style={{ color: color.text }}
                      >
                        {step.count.toLocaleString('fr-FR')}
                      </span>
                    </div>
                  </div>

                  {/* Description */}
                  <p className="text-xs text-muted-foreground mt-1 ml-8">
                    {step.description}
                  </p>
                </div>

                {/* Connecteur */}
                {!isLast && conversionRate && (
                  <div className="flex items-center gap-2 py-1 ml-10">
                    <div
                      className="h-4"
                      style={{
                        width: '1px',
                        backgroundColor: STEP_COLORS[Math.min(i + 1, STEP_COLORS.length - 1)].bg,
                      }}
                    />
                    <span className="text-xs text-muted-foreground">
                      ↓ {conversionRate} %
                    </span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
