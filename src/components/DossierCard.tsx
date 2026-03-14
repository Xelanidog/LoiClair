'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Sparkles } from 'lucide-react';

export default function DossierCard({
  href,
  label,
  target,
  children,
}: {
  href: string;
  label: string;
  target?: string;
  children: React.ReactNode;
}) {
  const [hovered, setHovered] = useState(false);

  return (
    <Link
      href={href}
      target={target}
      style={{
        display: 'block',
        backgroundColor: hovered ? 'var(--muted)' : 'transparent',
        borderLeft: hovered ? '3px solid var(--primary)' : '3px solid transparent',
        borderBottom: '1px solid var(--color-border)',
        transition: 'background-color 0.15s ease, border-color 0.15s ease',
        WebkitTransition: 'background-color 0.15s ease, border-color 0.15s ease',
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div style={{ padding: '20px 16px' }}>
        {children}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            marginTop: '8px',
            fontSize: '12px',
            fontWeight: 500,
            color: 'var(--primary)',
            opacity: hovered ? 1 : 0,
            transition: 'opacity 0.15s ease',
            WebkitTransition: 'opacity 0.15s ease',
          }}
        >
          <Sparkles style={{ width: '12px', height: '12px' }} />
          <span>{label} →</span>
        </div>
      </div>
    </Link>
  );
}
