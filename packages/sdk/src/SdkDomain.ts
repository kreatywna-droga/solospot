export interface SoloSpotConfig {
  apiKey: string;
  baseUrl?: string;
  timeout?: number;
}

export interface SoloSpotClientInterface {
  stores: StoreClient;
  billing: BillingClient;
  marketplace: MarketplaceClient;
  domains: DomainClient;
  notifications: NotificationClient;
}

export interface StoreClient {
  create(params: { template?: string; name: string }): Promise<{ id: string; name: string }>;
  list(): Promise<{ id: string; name: string }[]>;
  get(id: string): Promise<{ id: string; name: string }>;
}

export interface BillingClient {
  getSubscription(tenantId: string): Promise<{ id: string; plan: string; status: string }>;
}

export interface MarketplaceClient {
  search(query: string): Promise<{ id: string; name: string; author: string }[]>;
  install(templateId: string, tenantId: string): Promise<{ id: string; installed: boolean }>;
}

export interface DomainClient {
  list(tenantId: string): Promise<{ id: string; hostname: string }[]>;
}

export interface NotificationClient {
  send(params: { recipient: string; channel: string; template: string; variables: Record<string, string> }): Promise<{ id: string; status: string }>;
}