import type { ListFlightsResponse } from "@/types/api";

export class ApiClient {
  private base: string;
  constructor(base = '') {
    this.base = base;
  }

  async listFlights(params: { year?: string; location?: string; cursor?: string | null; limit?: number }): Promise<ListFlightsResponse> {
    const sp = new URLSearchParams();
    if (params.year) sp.set('year', params.year);
    if (params.location) sp.set('location', params.location);
    if (params.cursor) sp.set('cursor', params.cursor);
    if (params.limit) sp.set('limit', String(params.limit));
    const res = await fetch(`${this.base}/api/flights/list?${sp.toString()}`, { cache: 'no-store' });
    if (!res.ok) throw new Error('Failed to list flights');
    return res.json();
  }

  async processFlights(): Promise<{ processed: number }> {
    const res = await fetch(`${this.base}/api/flights/process`, { method: 'POST', cache: 'no-store' });
    if (!res.ok) throw new Error('Failed to process flights');
    return res.json();
  }

  async status(): Promise<{ total: number; unprocessed: number }> {
    const res = await fetch(`${this.base}/api/flights/status`, { cache: 'no-store' });
    if (!res.ok) throw new Error('Failed to fetch status');
    return res.json();
  }
}

export const apiClient = new ApiClient('');
export function createApiClient(base = '') { return new ApiClient(base); }


