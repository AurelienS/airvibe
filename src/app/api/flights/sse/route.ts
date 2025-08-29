import { NextRequest } from 'next/server';
import { addClient, removeClient, pingAll } from '@/lib/sse';

export const runtime = 'nodejs';

export async function GET(_req: NextRequest) {
  const stream = new ReadableStream({
    start(controller) {
      const encoder = new TextEncoder();
      controller.enqueue(encoder.encode('retry: 3000\n\n'));
      const client = addClient(controller);
      const interval = setInterval(() => pingAll(), 25000);
      return () => {
        clearInterval(interval);
        removeClient(client);
      };
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  });
}


