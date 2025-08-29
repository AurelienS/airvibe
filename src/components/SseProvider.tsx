'use client';

import { createContext, useContext, useEffect, useRef } from 'react';
import { useCurrentUser } from '@/components/CurrentUserProvider';

type SseContextValue = {};
const SseContext = createContext<SseContextValue>({});

export function useSse() { return useContext(SseContext); }

export function SseProvider({ children }: { children: React.ReactNode }) {
  const eventSourceRef = useRef<EventSource | null>(null);
  const user = useCurrentUser();

  useEffect(() => {
    const es = new EventSource('/api/flights/sse');
    eventSourceRef.current = es;
    es.onmessage = (e) => {
      try {
        const data = JSON.parse(e.data);
        if (data?.userId && data.userId !== user.id && data.userId !== user.email) return;
        if (data?.type === 'flights:uploaded') {
          window.dispatchEvent(new Event('flights:data-changed'));
        }
        if (data?.type === 'flights:processed') {
          window.dispatchEvent(new Event('flights:data-changed'));
        }
        if (data?.type === 'flights:deleted' || data?.type === 'flights:deleted_all') {
          window.dispatchEvent(new Event('flights:data-changed'));
        }
      } catch {}
    };
    es.onerror = () => { /* keep connection open */ };
    return () => { try { es.close(); } catch {} };
  }, []);

  return (
    <SseContext.Provider value={{}}>
      {children}
    </SseContext.Provider>
  );
}


