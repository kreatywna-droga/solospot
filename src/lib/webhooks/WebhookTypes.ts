export type WebhookStatus =
  | 'RECEIVED'
  | 'PROCESSING'
  | 'COMPLETED'
  | 'FAILED';

export interface WebhookEnvelope {
  provider: string;
  providerEventId: string;
  providerTransactionId: string;
  tenantId: string;
  correlationId: string;

  payloadHash: string;
  occurredAt: string; // ISO
}

export interface VerifiedWebhook {
  envelope: WebhookEnvelope;
  // Znormalizowane zdarzenie do dalszej obróbki.
  // Dla Step 3 używamy PaymentProviderEvent.
  // Importy w innych plikach, żeby nie robić cykli.
  event: unknown;
}

