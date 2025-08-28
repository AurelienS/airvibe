'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';

async function fetchStatus(): Promise<{ total: number; unprocessed: number } | null> {
  try {
    const res = await fetch('/api/flights/status', { cache: 'no-store' });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

export function ProcessingNotice() {
  const router = useRouter();
  const [visible, setVisible] = useState(false);
  const [unprocessed, setUnprocessed] = useState<number>(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const runningRef = useRef(false);

  useEffect(() => {
    const start = async () => {
      if (runningRef.current) return;
      runningRef.current = true;
      setVisible(true);
      const tick = async () => {
        const data = await fetchStatus();
        if (data) {
          setUnprocessed(data.unprocessed);
          if (data.unprocessed === 0) {
            runningRef.current = false;
            setVisible(false);
            if (timerRef.current) {
              clearTimeout(timerRef.current);
              timerRef.current = null;
            }
            // Notify pages to refetch client data and refresh server components
            try { window.dispatchEvent(new Event('flights:data-changed')); } catch {}
            router.refresh();
            return;
          }
        }
        // Proactively advance processing batches while active
        try { await fetch('/api/flights/process', { method: 'POST', cache: 'no-store' }); } catch {}
        timerRef.current = setTimeout(tick, 1000);
      };
      await tick();
    };

    const onTrigger = () => {
      start();
    };
    window.addEventListener('flights:processing-start', onTrigger as EventListener);
    return () => {
      window.removeEventListener('flights:processing-start', onTrigger as EventListener);
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  if (!visible) return null;
  return (
    <div className="fixed top-0 left-0 right-0 z-50 flex justify-center pointer-events-none">
      <div className="pointer-events-auto mt-2 rounded-md bg-blue-50 text-blue-800 text-xs px-4 py-2 shadow border border-blue-100">
        Traitement en cours… {unprocessed} en attente
      </div>
    </div>
  );
}


