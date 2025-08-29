'use client';

import { useEffect, useState } from 'react';

function getStoredTheme(): 'light' | 'dark' | null {
  try {
    const v = localStorage.getItem('theme');
    if (v === 'light' || v === 'dark') return v;
  } catch {}
  return null;
}

function applyTheme(theme: 'light' | 'dark') {
  try { localStorage.setItem('theme', theme); } catch {}
  if (typeof document !== 'undefined') {
    document.documentElement.setAttribute('data-theme', theme);
  }
}

export function ThemeToggle() {
  const [theme, setTheme] = useState<'light' | 'dark'>(() => getStoredTheme() ?? 'dark');

  useEffect(() => {
    const stored = getStoredTheme();
    if (stored) {
      applyTheme(stored);
      setTheme(stored);
    } else {
      const prefersDark = typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
      const next = prefersDark ? 'dark' : 'light';
      applyTheme(next);
      setTheme(next);
    }
  }, []);

  const toggle = () => {
    const next = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    applyTheme(next);
  };

  return (
    <button onClick={toggle} className="btn btn--ghost icon-btn" aria-label={theme === 'dark' ? 'Passer au thème clair' : 'Passer au thème sombre'}>
      {theme === 'dark' ? (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
          <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" stroke="currentColor" strokeWidth="1.5" fill="currentColor"/>
        </svg>
      ) : (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
          <circle cx="12" cy="12" r="5" stroke="currentColor" strokeWidth="1.5" fill="currentColor"/>
          <path d="M12 1v3M12 20v3M4.22 4.22l2.12 2.12M17.66 17.66l2.12 2.12M1 12h3M20 12h3M4.22 19.78l2.12-2.12M17.66 6.34l2.12-2.12" stroke="currentColor" strokeWidth="1.5"/>
        </svg>
      )}
    </button>
  );
}


