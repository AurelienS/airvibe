import * as React from 'react';
import { formatAltitude, formatDistance, formatDuration } from '@/lib/format';

export type StatValueKind = 'string' | 'number' | 'duration' | 'distance' | 'altitude';

export type StatItem = {
  label: string;
  value: React.ReactNode | number | null | undefined;
  kind?: StatValueKind;
  empty?: string; // custom placeholder when value is missing
};

function computeDisplay(it: StatItem): { content: React.ReactNode; isPlaceholder: boolean } {
  const placeholder = it.empty ?? '—';
  const isMissing = it.value == null || (typeof it.value === 'string' && it.value.trim().length === 0);
  if (isMissing) return { content: placeholder, isPlaceholder: true };
  switch (it.kind) {
    case 'duration':
      return { content: formatDuration(typeof it.value === 'number' ? it.value : Number(it.value)), isPlaceholder: false };
    case 'distance':
      return { content: formatDistance(typeof it.value === 'number' ? it.value : Number(it.value)), isPlaceholder: false };
    case 'altitude':
      return { content: formatAltitude(typeof it.value === 'number' ? it.value : Number(it.value)), isPlaceholder: false };
    case 'number':
      return { content: String(it.value), isPlaceholder: false };
    case 'string':
    default:
      return { content: it.value as React.ReactNode, isPlaceholder: false };
  }
}

export function StatList({ items, className = '' }: { items: StatItem[]; className?: string }) {
  return (
    <ul className={`text-sm space-y-1 ${className}`}>
      {items.map((it, idx) => {
        const { content, isPlaceholder } = computeDisplay(it);
        return (
          <li key={idx} className="stat-list__item flex items-baseline gap-2">
            <span className="stat-list__label text-[--color-muted-foreground] shrink-0">{it.label}:</span>
            <span className={`stat-list__value truncate ${isPlaceholder ? 'text-[--color-muted-foreground] font-normal' : ''}`}>{content}</span>
          </li>
        );
      })}
    </ul>
  );
}


