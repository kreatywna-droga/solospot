export interface LabelGenerationResult {
  trackingNumber: string;
  labelUrl: string;
}

export interface ShippingProviderAdapter {
  getCarrierCode(): string; // e.g. "DHL", "INPOST"
  createShipment(recipientAddress: {
    fullName: string;
    street: string;
    city: string;
    zipCode: string;
    country: string;
  }): Promise<LabelGenerationResult>;
}

export class MockShippingProviderAdapter implements ShippingProviderAdapter {
  private readonly carrier: string;

  constructor(carrier: string) {
    this.carrier = carrier;
  }

  public getCarrierCode(): string {
    return this.carrier;
  }

  public async createShipment(recipientAddress: {
    fullName: string;
    street: string;
    city: string;
    zipCode: string;
    country: string;
  }): Promise<LabelGenerationResult> {
    const randomSuffix = Math.random().toString(36).substr(2, 9).toUpperCase();
    const trackingNumber = `${this.carrier}_TRK_${randomSuffix}`;
    const labelUrl = `https://labels.platform.com/${this.carrier.toLowerCase()}/${trackingNumber}.pdf`;

    return {
      trackingNumber,
      labelUrl,
    };
  }
}
