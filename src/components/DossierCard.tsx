'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function DossierCard({
  href,
  label,
  children,
}: {
  href: string;
  label: string;
  children: React.ReactNode;
}) {
  const [hovered, setHovered] = useState(false);

  return (
    <Link
      href={href}
      className="flex"
      style={{
        backgroundColor: hovered ? 'var(--color-muted)' : 'transparent',
        transition: 'background-color 0.15s ease',
        WebkitTransition: 'background-color 0.15s ease',
        overflow: 'hidden',
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div className="flex-1 min-w-0 py-5 px-4">
        {children}
      </div>
      {/* Label + accent stripe — glisse depuis la droite au hover */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          flexShrink: 0,
          transform: hovered ? 'translateX(0)' : 'translateX(100%)',
          WebkitTransform: hovered ? 'translateX(0)' : 'translateX(100%)',
          transition: 'transform 0.25s ease',
          WebkitTransition: '-webkit-transform 0.25s ease',
          whiteSpace: 'nowrap',
        }}
      >
        {/* Texte sur fond normal */}
        <span style={{ color: '#0891B2', fontSize: 12, fontWeight: 600, paddingRight: 8 }}>{label}</span>
        <span style={{ color: '#0891B2', fontSize: 16, fontWeight: 'bold', lineHeight: 1, paddingRight: 10 }}>›</span>
        {/* Fine bande accent */}
        <div
          style={{
            width: 4,
            alignSelf: 'stretch',
            backgroundColor: '#0891B2',
            opacity: 0.25,
          }}
        />
      </div>
    </Link>
  );
}
