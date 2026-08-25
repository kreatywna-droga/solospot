/**
 * StorefrontEmailNotificationBridgeEngine.ts — Sprint G1-87 Transactional Email Notification Engine (Night Shift Level 49)
 *
 * Implements a pure TypeScript, headless transactional email notification payload queue engine (Order Confirmation, Payment Receipt, Shipping Notice, Password Reset, Contact Form),
 * provider-ready handoff payload generation, and delivery status tracking for published WEB FACTOR storefronts.
 *
 * HONESTY RULE: No fake email delivery. Generate provider-ready payloads and explicit handoff states.
 * NO DOM, NO React, ZERO Browser APIs in domain layer.
 */

import { VectorWorkspaceState, VectorDocumentSnapshot } from '../vector/VectorWorkspaceController';

// ---------------------------------------------------------------------------
// DTOs & Interfaces
// ---------------------------------------------------------------------------

export type EmailNotificationType = 'ORDER_CONFIRMATION' | 'PAYMENT_CONFIRMATION' | 'SHIPPING_NOTIFICATION' | 'PASSWORD_RESET' | 'CONTACT_FORM';

export interface EmailPayloadDTO {
  readonly emailId: string;
  readonly recipientEmail: string;
  readonly subject: string;
  readonly bodyHtml: string;
  readonly type: EmailNotificationType;
  readonly status: 'QUEUED' | 'SENT' | 'FAILED';
  readonly createdAt: number;
}

export interface EmailQueueConfigDTO {
  readonly siteId: string;
  readonly emails: ReadonlyArray<EmailPayloadDTO>;
  readonly lastUpdated: number;
}

// ---------------------------------------------------------------------------
// Engine Implementation
// ---------------------------------------------------------------------------

export class StorefrontEmailNotificationBridgeEngine {
  /**
   * Creates a default email queue configuration.
   */
  public static createDefaultEmailQueueConfig(siteId = 'default_storefront_site'): EmailQueueConfigDTO {
    return {
      siteId,
      emails: [],
      lastUpdated: Date.now()
    };
  }

  /**
   * Enqueues a provider-ready transactional email payload DTO.
   */
  public static enqueueEmail(
    config: EmailQueueConfigDTO,
    recipientEmail: string,
    subject: string,
    bodyHtml: string,
    type: EmailNotificationType
  ): { config: EmailQueueConfigDTO; email: EmailPayloadDTO } {
    if (!config || !recipientEmail || !recipientEmail.includes('@') || !subject) {
      throw new Error('StorefrontEmailNotificationBridgeEngine: Invalid recipient email or subject');
    }

    const now = Date.now();
    const emailId = `eml_${now}_${Math.floor(Math.random() * 1000)}`;

    const email: EmailPayloadDTO = {
      emailId,
      recipientEmail: recipientEmail.toLowerCase().trim(),
      subject,
      bodyHtml,
      type,
      status: 'QUEUED',
      createdAt: now
    };

    const updatedConfig: EmailQueueConfigDTO = {
      ...config,
      emails: [...config.emails, email],
      lastUpdated: now
    };

    return { config: updatedConfig, email };
  }

  /**
   * Updates email delivery status upon provider handoff (e.g. Resend, SendGrid, AWS SES).
   */
  public static updateEmailStatus(
    config: EmailQueueConfigDTO,
    emailId: string,
    status: 'QUEUED' | 'SENT' | 'FAILED'
  ): EmailQueueConfigDTO {
    if (!config || !emailId) throw new Error('StorefrontEmailNotificationBridgeEngine: Config or emailId is null');

    const updatedEmails = config.emails.map(e => (e.emailId === emailId ? { ...e, status } : e));

    return {
      ...config,
      emails: updatedEmails,
      lastUpdated: Date.now()
    };
  }

  /**
   * Retrieves pending QUEUED email payloads ready for provider delivery.
   */
  public static getPendingEmails(config: EmailQueueConfigDTO): ReadonlyArray<EmailPayloadDTO> {
    if (!config) return [];
    return config.emails.filter(e => e.status === 'QUEUED');
  }

  /**
   * Serializes email queue config to JSON string.
   */
  public static serializeEmailQueueConfig(config: EmailQueueConfigDTO): string {
    return JSON.stringify(config);
  }

  /**
   * Restores email queue config from JSON string.
   */
  public static restoreEmailQueueConfig(json: string): EmailQueueConfigDTO {
    try {
      const parsed = JSON.parse(json);
      if (!parsed || typeof parsed !== 'object' || !parsed.siteId) {
        throw new Error('Invalid email queue JSON structure');
      }
      return parsed as EmailQueueConfigDTO;
    } catch (err: any) {
      throw new Error(`Failed to restore email queue config: ${err.message}`);
    }
  }
}
