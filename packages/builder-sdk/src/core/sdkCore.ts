export const SDK_VERSION = '2.0.0';
export const MIN_COMPATIBLE_SDK_VERSION = '2.0.0';

export type SDKIdentifier = string;

export interface SDKMetadata {
  version: string;
  minCompatibleVersion: string;
  environment: 'development' | 'production' | 'test';
}

export interface CapabilityDescriptor {
  id: SDKIdentifier;
  name: string;
  version: string;
  description?: string;
  metadata?: Record<string, any>;
}

export interface ICapabilityRegistry {
  registerCapability(capability: CapabilityDescriptor): void;
  unregisterCapability(id: SDKIdentifier): boolean;
  hasCapability(id: SDKIdentifier): boolean;
  getCapability(id: SDKIdentifier): CapabilityDescriptor | undefined;
  listCapabilities(): CapabilityDescriptor[];
}
