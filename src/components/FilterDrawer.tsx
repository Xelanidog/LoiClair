'use client';

import { useState, useEffect } from 'react';
import { SlidersHorizontal } from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import FilterChips from '@/components/FilterChips';
import ResetButton from '@/components/ResetButton';

interface FilterDrawerProps {
  children: React.ReactNode;
  filterLabels: Record<string, Record<string, string>>;
}

export default function FilterDrawer({ children, filterLabels }: FilterDrawerProps) {
  const [open, setOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const searchParams = useSearchParams();

  // Count active filters (excluding 'q' and 'page')
  const filterParamNames = Object.keys(filterLabels);
  const activeCount = filterParamNames.filter(p => searchParams.has(p)).length;

  useEffect(() => {
    const mql = window.matchMedia('(max-width: 767px)');
    setIsMobile(mql.matches);
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    mql.addEventListener('change', handler);
    return () => mql.removeEventListener('change', handler);
  }, []);

  return (
    <div className="flex items-center gap-2 flex-wrap mb-4">
      <Button
        variant="outline"
        size="sm"
        className="gap-2 shrink-0"
        onClick={() => setOpen(true)}
      >
        <SlidersHorizontal className="h-4 w-4" />
        Filtres
        {activeCount > 0 && (
          <span className="inline-flex items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-medium min-w-5 h-5 px-1.5">
            {activeCount}
          </span>
        )}
      </Button>

      <FilterChips filterLabels={filterLabels} />

      {(activeCount > 0 || searchParams.has('q')) && (
        <div className="ml-auto shrink-0">
          <ResetButton />
        </div>
      )}

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent
          side={isMobile ? 'bottom' : 'right'}
          size="sm"
          className={isMobile ? 'max-h-[80vh] overflow-y-auto rounded-t-2xl' : 'overflow-y-auto'}
          onOpenAutoFocus={(e) => e.preventDefault()}
          style={isMobile ? undefined : { WebkitBackdropFilter: 'blur(12px)' }}
        >
          <SheetHeader>
            <SheetTitle>Filtres</SheetTitle>
          </SheetHeader>
          <div className="flex flex-col gap-3 pt-4">
            <style>{`
              [data-slot="sheet-content"] button[data-slot="select-trigger"] { max-width: 100% !important; width: 100%; }
            `}</style>
            {children}
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
