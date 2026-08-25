/**
 * StorefrontCustomerSupportTicketBridgeEngine.ts — Sprint G1-75 Storefront Customer Support Engine (Night Shift Level 37)
 *
 * Implements a pure TypeScript, headless customer helpdesk, support ticket submission, customer message history, and ticket status tracking engine
 * for published WEB FACTOR storefronts. Manages customer inquiries, merchant replies, ticket priority levels, and resolution states.
 *
 * NO DOM, NO React, ZERO Browser APIs in domain layer.
 */

import { VectorWorkspaceState, VectorDocumentSnapshot } from '../vector/VectorWorkspaceController';

// ---------------------------------------------------------------------------
// DTOs & Interfaces
// ---------------------------------------------------------------------------

export type TicketPriority = 'LOW' | 'MEDIUM' | 'HIGH';
export type TicketStatus = 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';
export type SenderType = 'CUSTOMER' | 'SUPPORT_AGENT';

export interface SupportTicketMessageDTO {
  readonly messageId: string;
  readonly sender: SenderType;
  readonly senderName: string;
  readonly body: string;
  readonly timestamp: number;
}

export interface SupportTicketRecordDTO {
  readonly ticketId: string;
  readonly customerId: string;
  readonly customerEmail: string;
  readonly subject: string;
  readonly priority: TicketPriority;
  readonly status: TicketStatus;
  readonly messages: ReadonlyArray<SupportTicketMessageDTO>;
  readonly createdAt: number;
  readonly updatedAt: number;
}

export interface SupportConfigDTO {
  readonly siteId: string;
  readonly tickets: ReadonlyArray<SupportTicketRecordDTO>;
  readonly lastUpdated: number;
}

// ---------------------------------------------------------------------------
// Engine Implementation
// ---------------------------------------------------------------------------

export class StorefrontCustomerSupportTicketBridgeEngine {
  /**
   * Creates a default support desk configuration.
   */
  public static createDefaultSupportConfig(siteId = 'default_storefront_site'): SupportConfigDTO {
    return {
      siteId,
      tickets: [],
      lastUpdated: Date.now()
    };
  }

  /**
   * Submits a new customer support ticket.
   */
  public static createSupportTicket(
    config: SupportConfigDTO,
    customerId: string,
    customerEmail: string,
    subject: string,
    body: string,
    priority: TicketPriority = 'MEDIUM'
  ): SupportConfigDTO {
    if (!config || !customerId || !customerEmail || !subject) {
      throw new Error('StorefrontCustomerSupportTicketBridgeEngine: Required ticket fields missing');
    }

    const now = Date.now();
    const initialMessage: SupportTicketMessageDTO = {
      messageId: `msg_${now}_1`,
      sender: 'CUSTOMER',
      senderName: customerEmail.split('@')[0],
      body: body.trim(),
      timestamp: now
    };

    const newTicket: SupportTicketRecordDTO = {
      ticketId: `tkt_${now}_${Math.floor(Math.random() * 1000)}`,
      customerId,
      customerEmail: customerEmail.trim(),
      subject: subject.trim(),
      priority,
      status: 'OPEN',
      messages: [initialMessage],
      createdAt: now,
      updatedAt: now
    };

    return {
      ...config,
      tickets: [...config.tickets, newTicket],
      lastUpdated: now
    };
  }

  /**
   * Appends a message (reply) to an existing support ticket.
   */
  public static appendTicketMessage(
    config: SupportConfigDTO,
    ticketId: string,
    sender: SenderType,
    senderName: string,
    body: string
  ): SupportConfigDTO {
    if (!config || !ticketId || !body) {
      throw new Error('StorefrontCustomerSupportTicketBridgeEngine: Config, ticketId, or body is null');
    }

    const now = Date.now();
    const updatedTickets = config.tickets.map(ticket => {
      if (ticket.ticketId === ticketId) {
        const newMessage: SupportTicketMessageDTO = {
          messageId: `msg_${now}_${ticket.messages.length + 1}`,
          sender,
          senderName: senderName.trim(),
          body: body.trim(),
          timestamp: now
        };

        const nextStatus: TicketStatus = sender === 'SUPPORT_AGENT' ? 'IN_PROGRESS' : ticket.status;

        return {
          ...ticket,
          status: nextStatus,
          messages: [...ticket.messages, newMessage],
          updatedAt: now
        };
      }
      return ticket;
    });

    return {
      ...config,
      tickets: updatedTickets,
      lastUpdated: now
    };
  }

  /**
   * Updates a ticket's status (OPEN, IN_PROGRESS, RESOLVED, CLOSED).
   */
  public static updateTicketStatus(config: SupportConfigDTO, ticketId: string, status: TicketStatus): SupportConfigDTO {
    if (!config || !ticketId) throw new Error('StorefrontCustomerSupportTicketBridgeEngine: Config or ticketId is null');

    const now = Date.now();
    const updatedTickets = config.tickets.map(t => (t.ticketId === ticketId ? { ...t, status, updatedAt: now } : t));

    return {
      ...config,
      tickets: updatedTickets,
      lastUpdated: now
    };
  }

  /**
   * Retrieves all support tickets for a specific customer ID.
   */
  public static getCustomerTickets(config: SupportConfigDTO, customerId: string): ReadonlyArray<SupportTicketRecordDTO> {
    if (!config || !customerId) return [];
    return config.tickets.filter(t => t.customerId === customerId);
  }

  /**
   * Serializes support config to JSON string.
   */
  public static serializeSupportConfig(config: SupportConfigDTO): string {
    return JSON.stringify(config);
  }

  /**
   * Restores support config from JSON string.
   */
  public static restoreSupportConfig(json: string): SupportConfigDTO {
    try {
      const parsed = JSON.parse(json);
      if (!parsed || typeof parsed !== 'object' || !parsed.siteId) {
        throw new Error('Invalid support JSON structure');
      }
      return parsed as SupportConfigDTO;
    } catch (err: any) {
      throw new Error(`Failed to restore support config: ${err.message}`);
    }
  }
}
