'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useState, useEffect } from 'react';
import { Search, X } from 'lucide-react';

export default function SearchInput() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [value, setValue] = useState(searchParams.get('q') || '');

  // Sync URL → champ quand l'URL change (ex: bouton Reset, retour arrière)
  useEffect(() => {
    setValue(searchParams.get('q') || '');
  }, [searchParams]);

  // Debounce : met à jour l'URL 400ms après la dernière frappe
  useEffect(() => {
    const currentQ = searchParams.get('q') || '';
    if (value === currentQ) return; // Rien à changer, évite la boucle infinie

    const timer = setTimeout(() => {
      const params = new URLSearchParams(searchParams.toString());
      if (value.trim()) {
        params.set('q', value.trim());
      } else {
        params.delete('q');
      }
      params.delete('page'); // Retour à la page 1 à chaque nouvelle recherche
      router.push(`?${params.toString()}`);
    }, 400);

    return () => clearTimeout(timer);
  }, [value, searchParams, router]);

  const handleClear = () => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete('q');
    params.delete('page');
    router.push(`?${params.toString()}`);
  };

  return (
    <div className="relative w-full" style={{ maxWidth: '13rem' }}>
      {/* maxWidth via inline style for Safari compat; on mobile inside Sheet, parent flex-col handles width */}
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
      <input
        type="text"
        placeholder="Rechercher par titre ou auteur…"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onFocus={e => e.currentTarget.style.borderColor = 'oklch(0.55 0.28 320)'}

        className="w-full pl-10 pr-8 py-2 h-10 rounded-lg border bg-background text-sm focus:outline-none transition-all"
      />
      {value && (
        <button
          onClick={handleClear}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          aria-label="Effacer la recherche"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}
