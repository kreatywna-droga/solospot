/**
 * StorefrontOrderFulfillmentTrackingEngine.ts — Sprint G1-114 Multi-Carrier Shipment Tracking Engine (Night Shift Level 76)
 *
 * Provides pure TypeScript, headless multi-carrier order fulfillment tracking, shipment status normalization
 * (LABEL_CREATED, IN_TRANSIT, OUT_FOR_DELIVERY, DELIVERED, EXCEPTION, RETURNED), carrier tracking updates,
 * and delivery milestone event logs.
 *
 * External shipping APIs (Shippo, EasyPost, FedEx, UPS, DHL) remain explicit integration boundaries.
 * NO DOM, NO React, ZERO Browser APIs in domain layer.
 */

export type TrackingStatus =
  | 'LABEL_CREATED'
  | 'IN_TRANSIT'
  | 'OUT_FOR_DELIVERY'
  | 'DELIVERED'
  | 'EXCEPTION'
  | 'RETURNED_TO_SENDER';

export interface TrackingMilestoneDTO {
  readonly milestoneId: string;
  readonly status: TrackingStatus;
  readonly location: string;
  readonly message: string;
  readonly timestampMs: number;
}

export interface ShipmentTrackingDTO {
  readonly shipmentId: string;
  readonly tenantId: string;
  readonly orderId: string;
  readonly carrierCode: string; // e.g. 'FEDEX', 'UPS', 'DHL', 'USPS'
  readonly trackingNumber: string;
  readonly currentStatus: TrackingStatus;
  readonly estimatedDeliveryTimestampMs?: number;
  readonly milestones: ReadonlyArray<TrackingMilestoneDTO>;
  readonly createdAtMs: number;
  readonly updatedAtMs: number;
}

export interface OrderFulfillmentTrackingEngineStateDTO {
  readonly tenantId: string;
  readonly shipments: Record<string, ShipmentTrackingDTO>;
}

export class StorefrontOrderFulfillmentTrackingEngine {
  private readonly tenantId: string;
  private shipments: Map<string, ShipmentTrackingDTO> = new Map();

  constructor(tenantId = 'default_tenant') {
    this.tenantId = tenantId;
  }

  /**
   * Registers a new shipment for an order with an initial tracking status.
   */
  public registerShipment(params: {
    shipmentId: string;
    orderId: string;
    carrierCode: string;
    trackingNumber: string;
    estimatedDeliveryTimestampMs?: number;
  }): ShipmentTrackingDTO {
    const { shipmentId, orderId, carrierCode, trackingNumber } = params;

    if (!shipmentId || !orderId || !carrierCode || !trackingNumber) {
      throw new Error('shipmentId, orderId, carrierCode, and trackingNumber are required');
    }

    const now = Date.now();
    const initialMilestone: TrackingMilestoneDTO = {
      milestoneId: `mile_${now}_1`,
      status: 'LABEL_CREATED',
      location: 'ORIGIN_FACILITY',
      message: `Shipping label created with carrier ${carrierCode.toUpperCase()}`,
      timestampMs: now
    };

    const dto: ShipmentTrackingDTO = {
      shipmentId: shipmentId.trim(),
      tenantId: this.tenantId,
      orderId: orderId.trim(),
      carrierCode: carrierCode.trim().toUpperCase(),
      trackingNumber: trackingNumber.trim(),
      currentStatus: 'LABEL_CREATED',
      estimatedDeliveryTimestampMs: params.estimatedDeliveryTimestampMs,
      milestones: [initialMilestone],
      createdAtMs: now,
      updatedAtMs: now
    };

    this.shipments.set(dto.shipmentId, dto);
    return dto;
  }

  /**
   * Appends a new milestone tracking update from a carrier webhook or scan event.
   */
  public appendMilestone(params: {
    shipmentId: string;
    status: TrackingStatus;
    location: string;
    message: string;
  }): ShipmentTrackingDTO {
    const { shipmentId, status, location, message } = params;

    const shipment = this.shipments.get(shipmentId.trim());
    if (!shipment) {
      throw new Error(`Shipment ${shipmentId} not found`);
    }

    const now = Date.now();
    const milestone: TrackingMilestoneDTO = {
      milestoneId: `mile_${now}_${shipment.milestones.length + 1}`,
      status,
      location: location.trim(),
      message: message.trim(),
      timestampMs: now
    };

    const updatedMilestones = [...shipment.milestones, milestone];

    const updated: ShipmentTrackingDTO = {
      ...shipment,
      currentStatus: status,
      milestones: updatedMilestones,
      updatedAtMs: now
    };

    this.shipments.set(shipment.shipmentId, updated);
    return updated;
  }

  /**
   * Generates a carrier shipping label with barcode payload (G1-151 EXTEND).
   */
  public generateShippingLabel(params: {
    shipmentId: string;
    weightKg: number;
    dimensionsCm?: { length: number; width: number; height: number };
  }): { shipmentId: string; barcodeUrl: string; labelPdfUrl: string; weightKg: number } {
    const { shipmentId, weightKg } = params;

    const shipment = this.shipments.get(shipmentId.trim());
    if (!shipment) {
      throw new Error(`Shipment ${shipmentId} not found`);
    }

    if (weightKg <= 0) {
      throw new Error('weightKg must be positive');
    }

    const now = Date.now();
    const barcodeUrl = `https://labels.example.com/barcodes/${shipment.carrierCode}_${shipment.trackingNumber}.png`;
    const labelPdfUrl = `https://labels.example.com/pdf/${shipment.shipmentId}_${now}.pdf`;

    return {
      shipmentId: shipment.shipmentId,
      barcodeUrl,
      labelPdfUrl,
      weightKg
    };
  }

  /**
   * Generates a digital product download link token for hybrid digital/physical order fulfillment (G1-152 MERGE).
   */
  public generateDigitalDownloadToken(params: {
    orderId: string;
    digitalAssetId: string;
    customerId: string;
    maxDownloads?: number;
    validityHours?: number;
  }): { orderId: string; digitalAssetId: string; downloadToken: string; downloadUrl: string; expiresAtMs: number } {
    const { orderId, digitalAssetId, customerId } = params;

    if (!orderId || !digitalAssetId || !customerId) {
      throw new Error('orderId, digitalAssetId, and customerId are required');
    }

    const now = Date.now();
    const validityHours = params.validityHours ?? 72; // 72h default
    const expiresAtMs = now + validityHours * 3600000;
    const downloadToken = `dl_${now}_${Math.random().toString(36).substring(2, 10)}`;
    const downloadUrl = `https://downloads.example.com/assets/${digitalAssetId.trim()}?token=${downloadToken}`;

    return {
      orderId: orderId.trim(),
      digitalAssetId: digitalAssetId.trim(),
      downloadToken,
      downloadUrl,
      expiresAtMs
    };
  }

  public getShipment(shipmentId: string): ShipmentTrackingDTO | undefined {
    return this.shipments.get(shipmentId.trim());
  }



  public getTenantId(): string {
    return this.tenantId;
  }

  public exportState(): OrderFulfillmentTrackingEngineStateDTO {
    const record: Record<string, ShipmentTrackingDTO> = {};
    this.shipments.forEach((val, key) => {
      record[key] = val;
    });

    return {
      tenantId: this.tenantId,
      shipments: record
    };
  }

  public importState(state: OrderFulfillmentTrackingEngineStateDTO): void {
    if (!state || state.tenantId !== this.tenantId) {
      throw new Error('State tenantId mismatch during import');
    }
    this.shipments.clear();
    Object.entries(state.shipments || {}).forEach(([k, v]) => {
      this.shipments.set(k, v);
    });
  }
}
