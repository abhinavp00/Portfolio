import type { Response } from 'express';

const sseClients = new Set<Response>();

export function addRealtimeClient(res: Response): void {
  sseClients.add(res);
}

export function removeRealtimeClient(res: Response): void {
  sseClients.delete(res);
}

export interface LiveActivityBroadcast {
  eventId: string;
  eventName: string;
  pagePath: string;
  sectionName: string;
  sourceLabel: string;
  projectTitle: string;
  deviceCategory: string;
  createdAt: string;
}

export function broadcastActivity(payload: LiveActivityBroadcast): void {
  if (sseClients.size === 0) return;
  const serialized = `event: activity\ndata: ${JSON.stringify(payload)}\n\n`;
  for (const client of sseClients) {
    try {
      client.write(serialized);
    } catch {
      sseClients.delete(client);
    }
  }
}
