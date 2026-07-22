export interface WebhookEvent {
  id: string;
  type: string;
  payload: Record<string, unknown>;
  timestamp: string;
  signature?: string;
}

export interface WebhookEndpoint {
  id: string;
  url: string;
  secret: string;
  events: string[];
  active: boolean;
  createdAt: string;
}

export interface WebhookDelivery {
  id: string;
  eventId: string;
  endpointId: string;
  status: 'pending' | 'delivering' | 'delivered' | 'failed';
  attempt: number;
  error?: string;
  deliveredAt?: string;
}