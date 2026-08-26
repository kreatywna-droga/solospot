/**
 * ConnectorCapabilities.ts — Sprint S8 Import/Export Connectors (ETAP 2)
 *
 * Declarative capability model describing what a connector can do.
 *
 * NO DOM, NO React, NO Browser API, ZERO Runtime execution.
 */

export type ConnectorCapabilityType =
    | 'import'
    | 'export'
    | 'storage'
    | 'cloud_storage'
    | 'media_library'
    | 'sync'
    | 'authentication'
    | 'transform'
    | 'custom';

export interface ConnectorCapability {
    readonly capabilityId: string;
    readonly type: ConnectorCapabilityType;
    readonly name: string;
    readonly description?: string;
    readonly supportedFormats?: ReadonlyArray<string>;
    readonly maxFileSizeBytes?: number;
    readonly bidirectional?: boolean;
}

export interface ConnectorCapabilitiesDeclaration {
    readonly connectorId: string;
    readonly capabilities: ReadonlyArray<ConnectorCapability>;
}

export function createConnectorCapabilitiesDeclaration(
    connectorId: string,
    capabilities: ReadonlyArray<ConnectorCapability> = []
): ConnectorCapabilitiesDeclaration {
    return {
        connectorId,
        capabilities: [...capabilities],
    };
}

export function hasConnectorCapability(
    declaration: ConnectorCapabilitiesDeclaration,
    type: ConnectorCapabilityType
): boolean {
    return declaration.capabilities.some((c) => c.type === type);
}

export function getConnectorCapabilitiesByType(
    declaration: ConnectorCapabilitiesDeclaration,
    type: ConnectorCapabilityType
): ReadonlyArray<ConnectorCapability> {
    return declaration.capabilities.filter((c) => c.type === type);
}

export function isConnectorCapabilitiesDeclaration(
    value: unknown
): value is ConnectorCapabilitiesDeclaration {
    if (typeof value !== 'object' || value === null) {
        return false;
    }
    const candidate = value as Partial<ConnectorCapabilitiesDeclaration>;
    return (
        typeof candidate.connectorId === 'string' &&
        Array.isArray(candidate.capabilities)
    );
}