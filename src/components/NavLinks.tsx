'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

function pillClass(isActive: boolean): string {
  const base = 'pill text-sm';
  return isActive ? `${base} pill--active` : base;
}

export function NavLinks() {
  const pathname = usePathname() || '';
  const homeActive = pathname === '/home' || pathname.startsWith('/home/');
  const flightsActive = pathname === '/flights' || pathname.startsWith('/flights/');
  return (
    <div className="flex items-center gap-2">
      <Link href="/home" className={pillClass(homeActive)}>Accueil</Link>
      <Link href="/flights" className={pillClass(flightsActive)}>Vols</Link>
    </div>
  );
}


