'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { X } from 'lucide-react';

interface FilterChipsProps {
  filterLabels: Record<string, Record<string, string>>;
}

export default function FilterChips({ filterLabels }: FilterChipsProps) {
  const searchParams = useSearchParams();
  const router = useRouter();

  const activeFilters: { paramName: string; slug: string; label: string }[] = [];
  for (const [paramName, slugMap] of Object.entries(filterLabels)) {
    const value = searchParams.get(paramName);
    if (value && slugMap[value]) {
      activeFilters.push({ paramName, slug: value, label: slugMap[value] });
    }
  }

  if (activeFilters.length === 0) return null;

  const removeFilter = (paramName: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete(paramName);
    params.delete('page');
    router.push(`?${params.toString()}`);
  };

  return (
    <div className="flex items-center gap-1.5 overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
      {activeFilters.map(({ paramName, label }) => (
        <button
          key={paramName}
          onClick={() => removeFilter(paramName)}
          className="inline-flex items-center gap-1 shrink-0 rounded-full border border-primary/30 bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary transition-colors hover:bg-primary/20"
        >
          {label}
          <X className="h-3 w-3" />
        </button>
      ))}
    </div>
  );
}
