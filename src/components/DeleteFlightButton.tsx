'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Button } from '@/components/ui/Button';

export function DeleteFlightButton({ flightId }: { flightId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const onDelete = async () => {
    if (loading) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/flights/${flightId}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Delete failed');
      try {
        sessionStorage.setItem('flights:dirty', '1');
        window.dispatchEvent(new Event('flights:data-changed'));
      } catch {}
      router.back();
    } catch {
      setLoading(false);
    }
  };
  return (
    <Button type="button" onClick={onDelete} className="text-xs" style={{ background: 'var(--destructive)', color: 'var(--destructive-foreground)' }} disabled={loading}>
      {loading ? 'Suppression…' : 'Supprimer'}
    </Button>
  );
}


