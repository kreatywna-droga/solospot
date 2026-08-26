/**
 * StorefrontMerchantNotificationQueueEngine.ts — Sprint G1-129 Merchant Operational Alerts Engine (Night Shift Level 91)
 *
 * Provides pure TypeScript, headless merchant operational alert queuing, urgency level prioritization
 * (URGENT, HIGH, NORMAL, LOW), event category classification, and notification status tracking
 * (UNREAD, READ, DISMISSED, ARCHIVED).
 *
 * External notification dispatchers (Push, Slack Webhooks, Twilio SMS) remain explicit integration boundaries.
 * NO DOM, NO React, ZERO Browser APIs in domain layer.
 */

export type AlertUrgency = 'URGENT' | 'HIGH' | 'NORMAL' | 'LOW';

export type AlertCategory =
  | 'LOW_STOCK_WARNING'
  | 'HIGH_RISK_FRAUD'
  | 'NEW_B2B_QUOTE_REQUEST'
  | 'UNMATCHED_PAYMENT'
  | 'CUSTOMER_SURVEY_DETRACTOR'
  | 'SYSTEM_HEALTH_DEGRADED';

export type NotificationStatus = 'UNREAD' | 'READ' | 'DISMISSED' | 'ARCHIVED';

export interface MerchantAlertNotificationDTO {
  readonly notificationId: string;
  readonly tenantId: string;
  readonly merchantUserId: string;
  readonly category: AlertCategory;
  readonly urgency: AlertUrgency;
  readonly title: string;
  readonly message: string;
  readonly status: NotificationStatus;
  readonly metadata?: Record<string, string>;
  readonly createdAtMs: number;
  readonly updatedAtMs: number;
}

export interface MerchantNotificationQueueEngineStateDTO {
  readonly tenantId: string;
  readonly notifications: Record<string, MerchantAlertNotificationDTO>; // notificationId -> dto
}

export class StorefrontMerchantNotificationQueueEngine {
  private readonly tenantId: string;
  private notifications: Map<string, MerchantAlertNotificationDTO> = new Map();

  constructor(tenantId = 'default_tenant') {
    this.tenantId = tenantId;
  }

  /**
   * Enqueues a new merchant operational alert notification.
   */
  public enqueueNotification(params: {
    notificationId: string;
    merchantUserId: string;
    category: AlertCategory;
    urgency: AlertUrgency;
    title: string;
    message: string;
    metadata?: Record<string, string>;
  }): MerchantAlertNotificationDTO {
    const { notificationId, merchantUserId, category, urgency, title, message } = params;

    if (!notificationId || !merchantUserId || !category || !urgency || !title || !message) {
      throw new Error('notificationId, merchantUserId, category, urgency, title, and message are required');
    }

    const now = Date.now();
    const dto: MerchantAlertNotificationDTO = {
      notificationId: notificationId.trim(),
      tenantId: this.tenantId,
      merchantUserId: merchantUserId.trim(),
      category,
      urgency,
      title: title.trim(),
      message: message.trim(),
      status: 'UNREAD',
      metadata: params.metadata ? { ...params.metadata } : undefined,
      createdAtMs: now,
      updatedAtMs: now
    };

    this.notifications.set(dto.notificationId, dto);
    return dto;
  }

  /**
   * Updates notification state (e.g. READ or DISMISSED).
   */
  public updateNotificationStatus(notificationId: string, status: NotificationStatus): MerchantAlertNotificationDTO {
    const notification = this.notifications.get(notificationId.trim());
    if (!notification) {
      throw new Error(`Notification ${notificationId} not found`);
    }

    const updated: MerchantAlertNotificationDTO = {
      ...notification,
      status,
      updatedAtMs: Date.now()
    };

    this.notifications.set(notification.notificationId, updated);
    return updated;
  }

  /**
   * Retrieves active unread notifications for a merchant user sorted by urgency.
   */
  public getUnreadNotificationsForMerchant(merchantUserId: string): ReadonlyArray<MerchantAlertNotificationDTO> {
    const urgencyWeight: Record<AlertUrgency, number> = {
      URGENT: 4,
      HIGH: 3,
      NORMAL: 2,
      LOW: 1
    };

    const cleanUserId = merchantUserId.trim();
    return Array.from(this.notifications.values())
      .filter(n => n.merchantUserId === cleanUserId && n.status === 'UNREAD')
      .sort((a, b) => urgencyWeight[b.urgency] - urgencyWeight[a.urgency] || b.createdAtMs - a.createdAtMs);
  }

  public getNotification(notificationId: string): MerchantAlertNotificationDTO | undefined {
    return this.notifications.get(notificationId.trim());
  }

  public getTenantId(): string {
    return this.tenantId;
  }

  public exportState(): MerchantNotificationQueueEngineStateDTO {
    const record: Record<string, MerchantAlertNotificationDTO> = {};
    this.notifications.forEach((val, key) => {
      record[key] = val;
    });

    return {
      tenantId: this.tenantId,
      notifications: record
    };
  }

  public importState(state: MerchantNotificationQueueEngineStateDTO): void {
    if (!state || state.tenantId !== this.tenantId) {
      throw new Error('State tenantId mismatch during import');
    }
    this.notifications.clear();
    Object.entries(state.notifications || {}).forEach(([k, v]) => {
      this.notifications.set(k, v);
    });
  }
}
