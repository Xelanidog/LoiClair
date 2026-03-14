import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

interface FunnelStep {
  label: string;
  count: number;
  description: string;
}

interface LegislativeFunnelProps {
  steps: FunnelStep[];
  title: string;
  description: string;
  ofTotalLabel: (rate: string) => string;
  locale: string;
}

const STEP_COLORS = [
  '#4ADE80', // vert clair
  '#22C55E',
  '#16A34A',
  '#15803D',
  '#166534', // vert foncé
];

export function LegislativeFunnel({ steps, title, description, ofTotalLabel, locale }: LegislativeFunnelProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {steps.map((step, i) => {
            const isLast = i === steps.length - 1;
            const color = STEP_COLORS[i] || STEP_COLORS[STEP_COLORS.length - 1];

            const conversionRate = !isLast && steps[i].count > 0
              ? ((steps[i + 1].count / steps[i].count) * 100).toFixed(1)
              : null;

            const totalRate = i > 0 && steps[0].count > 0
              ? ((step.count / steps[0].count) * 100).toFixed(1)
              : null;

            return (
              <div key={step.label}>
                {/* Étape */}
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem', padding: '0.25rem 0' }}>
                  <span
                    style={{
                      fontSize: '1.25rem',
                      fontWeight: 700,
                      color,
                      minWidth: '3.5rem',
                      textAlign: 'right',
                      fontVariantNumeric: 'tabular-nums',
                    }}
                  >
                    {step.count.toLocaleString(locale)}
                  </span>
                  <span style={{ fontSize: '0.875rem', fontWeight: 500 }}>
                    {step.label}
                  </span>
                  {totalRate && (
                    <span
                      style={{
                        fontSize: '0.75rem',
                        opacity: 0.5,
                        marginLeft: 'auto',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {ofTotalLabel(totalRate)}
                    </span>
                  )}
                </div>

                {/* Connecteur */}
                {!isLast && conversionRate && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', paddingLeft: '1.25rem' }}>
                    <div
                      style={{
                        width: '1.5px',
                        height: '1.25rem',
                        backgroundColor: STEP_COLORS[Math.min(i + 1, STEP_COLORS.length - 1)],
                        opacity: 0.4,
                      }}
                    />
                    <span style={{ fontSize: '0.6875rem', opacity: 0.45 }}>
                      ↓ {conversionRate}%
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
