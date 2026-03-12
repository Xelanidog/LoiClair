'use client';

import { SlidersHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';

export default function FilterDrawer({ children }: { children: React.ReactNode }) {
  return (
    <>
      {/* Mobile: bouton + Sheet en bas de l'écran */}
      <div className="md:hidden mb-4">
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="outline" size="sm" className="gap-2">
              <SlidersHorizontal className="h-4 w-4" />
              Filtres
            </Button>
          </SheetTrigger>
          <SheetContent side="bottom" size="content" className="max-h-[80vh] overflow-y-auto rounded-t-2xl">
            <SheetHeader>
              <SheetTitle>Filtres</SheetTitle>
            </SheetHeader>
            <div className="filter-drawer-mobile flex flex-col gap-3 pt-4">
              <style>{`
                .filter-drawer-mobile > * { max-width: 100% !important; width: 100%; }
                .filter-drawer-mobile button[data-slot="select-trigger"] { max-width: 100% !important; width: 100%; }
              `}</style>
              {children}
            </div>
          </SheetContent>
        </Sheet>
      </div>

      {/* Desktop: filtres inline comme avant */}
      <div className="hidden md:flex flex-wrap items-center gap-3 mb-4">
        {children}
      </div>
    </>
  );
}
