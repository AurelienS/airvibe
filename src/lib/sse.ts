type Client = {
  id: number;
  controller: ReadableStreamDefaultController;
};

const globalAny = globalThis as unknown as { __sseClients?: Set<Client>; __sseNextId?: number };
if (!globalAny.__sseClients) globalAny.__sseClients = new Set<Client>();
if (!globalAny.__sseNextId) globalAny.__sseNextId = 1;

export function addClient(controller: ReadableStreamDefaultController): Client {
  const client: Client = { id: globalAny.__sseNextId!++, controller };
  globalAny.__sseClients!.add(client);
  return client;
}

export function removeClient(client: Client) {
  globalAny.__sseClients!.delete(client);
}

export function broadcast(data: unknown) {
  const payload = `data: ${JSON.stringify(data)}\n\n`;
  for (const c of globalAny.__sseClients!) {
    try { c.controller.enqueue(new TextEncoder().encode(payload)); } catch {}
  }
}

export function pingAll() {
  const payload = `: ping\n\n`;
  for (const c of globalAny.__sseClients!) {
    try { c.controller.enqueue(new TextEncoder().encode(payload)); } catch {}
  }
}


