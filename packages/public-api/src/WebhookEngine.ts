import { WebhookEvent, WebhookEndpoint, WebhookDelivery } from './WebhookDomain';

export class WebhookEngine {
  private endpoints: Map<string, WebhookEndpoint> = new Map();
  private deliveries: Map<string, WebhookDelivery> = new Map();

  registerEndpoint(endpoint: WebhookEndpoint): void {
    this.endpoints.set(endpoint.id, endpoint);
  }

  emit(event: WebhookEvent): void {
    const matching = Array.from(this.endpoints.values()).filter(e => e.events.includes(event.type) && e.active);
    matching.forEach(endpoint => {
      this.scheduleDelivery({
        id: `delivery-${Date.now()}`,
        eventId: event.id,
        endpointId: endpoint.id,
        status: 'pending',
        attempt: 1
      });
    });
  }

  private scheduleDelivery(delivery: WebhookDelivery): void {
    this.deliveries.set(delivery.id, delivery);
    // In production, this would trigger an HTTP request
  }

  getEndpoint(id: string): WebhookEndpoint | undefined {
    return this.endpoints.get(id);
  }

  listDeliveries(endpointId: string): WebhookDelivery[] {
    return Array.from(this.deliveries.values()).filter(d => d.endpointId === endpointId);
  }
}