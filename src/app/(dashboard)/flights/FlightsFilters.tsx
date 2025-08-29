'use client';

import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { useEffect, useMemo, useRef, useState } from 'react';

export function FlightsFilters({ locations }: { locations: Array<string> }) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const yearFromQuery = searchParams.get('year') || '';
  const locationFromQuery = searchParams.get('location') || '';

  const [year, setYear] = useState<string>(yearFromQuery);
  const [location, setLocation] = useState<string>(locationFromQuery);

  const years = useMemo(() => {
    const now = new Date();
    const current = now.getFullYear();
    const arr: Array<string> = [''];
    for (let y = current; y >= current - 15; y--) arr.push(String(y));
    return arr;
  }, []);

  const pushParams = (nextYear: string, nextLocation: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (nextYear) params.set('year', nextYear); else params.delete('year');
    if (nextLocation) params.set('location', nextLocation); else params.delete('location');
    router.push(`${pathname}?${params.toString()}`);
  };

  // Debounce location updates to avoid excessive navigations
  const debounceId = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (debounceId.current) clearTimeout(debounceId.current);
    debounceId.current = setTimeout(() => {
      pushParams(year, location);
    }, 300);
    return () => {
      if (debounceId.current) clearTimeout(debounceId.current);
    };
  }, [location]);

  const reset = () => {
    setYear('');
    setLocation('');
    pushParams('', '');
  };

  const [count, setCount] = useState<number | null>(null);
  // Listen for total updates from the list component
  useEffect(() => {
    const onTotal = (e: Event) => {
      const ce = e as CustomEvent;
      if (typeof ce.detail === 'number') setCount(ce.detail as number);
    };
    window.addEventListener('flights:total', onTotal as EventListener);
    return () => window.removeEventListener('flights:total', onTotal as EventListener);
  }, []);

  return (
    <div className="card p-4 rounded-xl">
      <h2 className="text-lg font-semibold mb-3">Filtres</h2>
      <div className="flex flex-wrap items-end gap-4">
        <div>
          <label className="block text-xs text-[--color-muted-foreground] mb-1">Année</label>
          <select
            value={year}
            onChange={(e) => {
              const next = e.target.value;
              setYear(next);
              pushParams(next, location);
            }}
            className="text-sm input"
          >
            {years.map((y) => (
              <option key={y || 'all'} value={y}>{y ? y : 'Toutes'}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs text-[--color-muted-foreground] mb-1">Lieu de déco</label>
          <input
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="ex: Annecy"
            className="text-sm input"
            list="locations-list"
          />
          <datalist id="locations-list">
            {locations.map((loc) => (
              <option key={loc} value={loc} />
            ))}
          </datalist>
        </div>
        <div className="ml-auto flex items-center gap-3">
          {typeof count === 'number' ? (
            <span className="text-sm text-[--color-muted-foreground]">{count} vol(s)</span>
          ) : null}
          <button type="button" onClick={reset} className="text-sm btn btn--ghost">Réinitialiser</button>
        </div>
      </div>
    </div>
  );
}


