export interface TimelineEntry {
  id?: string;
  tenantId: string;
  correlationId: string;
  eventType: string;
  timestamp: string;
  actor: string;
  metadata: Record<string, any>;
}
