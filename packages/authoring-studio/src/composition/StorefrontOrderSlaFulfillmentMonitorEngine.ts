/**
 * StorefrontOrderSlaFulfillmentMonitorEngine.ts — Sprint G1-166 Order SLA Fulfillment Monitor Engine (Night Shift Level 105)
 *
 * Provides pure TypeScript, headless fulfillment SLA deadline tracking, breach risk calculation
 * (ON_TRACK, AT_RISK_OF_BREACH, SLA_BREACHED), operational lead-time evaluation, and merchant escalations.
 *
 * External WMS/ERP warehouse systems remain explicit integration boundaries.
 * NO DOM, NO React, ZERO Browser APIs in domain layer.
 */

export type SlaBreachStatus = 'ON_TRACK' | 'AT_RISK_OF_BREACH' | 'SLA_BREACHED' | 'FULFILLED_WITHIN_SLA' | 'FULFILLED_LATE';

export interface OrderSlaMonitorRecordDTO {
  readonly orderId: string;
  readonly tenantId: string;
  readonly orderTimestampMs: number;
  readonly slaDeadlineMs: number;
  readonly status: SlaBreachStatus;
  readonly remainingMinutesToSla: number;
  readonly isEscalated: boolean;
  readonly updatedAtMs: number;
}

export interface OrderSlaFulfillmentMonitorEngineStateDTO {
  readonly tenantId: string;
  readonly defaultSlaHours: number;
  readonly records: Record<string, OrderSlaMonitorRecordDTO>;
}

export class StorefrontOrderSlaFulfillmentMonitorEngine {
  private readonly tenantId: string;
  private defaultSlaHours: number;
  private records: Map<string, OrderSlaMonitorRecordDTO> = new Map();

  constructor(tenantId = 'default_tenant', defaultSlaHours = 24) {
    this.tenantId = tenantId;
    this.defaultSlaHours = defaultSlaHours;
  }

  /**
   * Registers a new order for fulfillment SLA monitoring.
   */
  public registerOrderSla(params: {
    orderId: string;
    orderTimestampMs?: number;
    customSlaHours?: number;
  }): OrderSlaMonitorRecordDTO {
    const { orderId } = params;

    if (!orderId) {
      throw new Error('orderId is required');
    }

    const now = Date.now();
    const orderTimestampMs = params.orderTimestampMs ?? now;
    const slaHours = params.customSlaHours ?? this.defaultSlaHours;
    const slaDeadlineMs = orderTimestampMs + slaHours * 3600000;

    const remainingMinutesToSla = Math.round((slaDeadlineMs - now) / 60000);

    let status: SlaBreachStatus = 'ON_TRACK';
    if (remainingMinutesToSla <= 0) {
      status = 'SLA_BREACHED';
    } else if (remainingMinutesToSla <= 120) { // < 2h remaining
      status = 'AT_RISK_OF_BREACH';
    }

    const dto: OrderSlaMonitorRecordDTO = {
      orderId: orderId.trim(),
      tenantId: this.tenantId,
      orderTimestampMs,
      slaDeadlineMs,
      status,
      remainingMinutesToSla,
      isEscalated: status === 'SLA_BREACHED' || status === 'AT_RISK_OF_BREACH',
      updatedAtMs: now
    };

    this.records.set(dto.orderId, dto);
    return dto;
  }

  /**
   * Evaluates current SLA status for registered order based on current timestamp.
   */
  public evaluateSlaStatus(orderId: string, currentTimestampMs?: number): OrderSlaMonitorRecordDTO {
    const record = this.records.get(orderId.trim());
    if (!record) {
      throw new Error(`Order ${orderId} not found in SLA monitor`);
    }

    const now = currentTimestampMs ?? Date.now();
    const remainingMinutesToSla = Math.round((record.slaDeadlineMs - now) / 60000);

    let status: SlaBreachStatus = record.status;
    if (status !== 'FULFILLED_WITHIN_SLA' && status !== 'FULFILLED_LATE') {
      if (remainingMinutesToSla <= 0) {
        status = 'SLA_BREACHED';
      } else if (remainingMinutesToSla <= 120) {
        status = 'AT_RISK_OF_BREACH';
      } else {
        status = 'ON_TRACK';
      }
    }

    const updated: OrderSlaMonitorRecordDTO = {
      ...record,
      status,
      remainingMinutesToSla,
      isEscalated: status === 'SLA_BREACHED' || status === 'AT_RISK_OF_BREACH',
      updatedAtMs: now
    };

    this.records.set(record.orderId, updated);
    return updated;
  }

  public getRecord(orderId: string): OrderSlaMonitorRecordDTO | undefined {
    return this.records.get(orderId.trim());
  }

  public getTenantId(): string {
    return this.tenantId;
  }

  public exportState(): OrderSlaFulfillmentMonitorEngineStateDTO {
    const record: Record<string, OrderSlaMonitorRecordDTO> = {};
    this.records.forEach((val, key) => { record[key] = val; });

    return {
      tenantId: this.tenantId,
      defaultSlaHours: this.defaultSlaHours,
      records: record
    };
  }

  public importState(state: OrderSlaFulfillmentMonitorEngineStateDTO): void {
    if (!state || state.tenantId !== this.tenantId) {
      throw new Error('State tenantId mismatch during import');
    }
    this.records.clear();
    Object.entries(state.records || {}).forEach(([k, v]) => { this.records.set(k, v); });
  }
}
