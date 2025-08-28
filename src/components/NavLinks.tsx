'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

function cls(isActive: boolean): string {
  const base = 'text-sm px-2 py-1 rounded-md';
  return isActive
    ? `${base} bg-gray-200 text-gray-900`
    : `${base} text-gray-700 hover:text-gray-900`;
}

export function NavLinks() {
  const pathname = usePathname() || '';
  const homeActive = pathname === '/home' || pathname.startsWith('/home/');
  const flightsActive = pathname === '/flights' || pathname.startsWith('/flights/');
  return (
    <div className="flex items-center gap-2">
      <Link href="/home" className={cls(homeActive)}>Accueil</Link>
      <Link href="/flights" className={cls(flightsActive)}>Vols</Link>
    </div>
  );
}


