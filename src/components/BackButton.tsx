'use client';

import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';

export function BackButton({ className = '' }: { className?: string }) {
  const router = useRouter();
  const onBack = () => {
    try {
      if (typeof window !== 'undefined' && window.history.length > 1) {
        router.back();
        return;
      }
    } catch {}
    router.push('/flights');
  };
  return (
    <Button variant="ghost" className={`text-xs ${className}`} onClick={onBack} aria-label="Retour">
      ← Retour
    </Button>
  );
}


