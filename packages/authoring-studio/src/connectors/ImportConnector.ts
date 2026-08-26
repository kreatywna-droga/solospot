/**
 * ImportConnector.ts — Sprint S8 Import/Export Connectors (ETAP 2)
 *
 * Import connector contracts for ingesting external data into the Studio.
 *
 * NO DOM, NO React, NO Browser API, ZERO Runtime execution.
 */

export type ImportFormat =
    | 'json'
    | 'builder_document'
    | 'animation_package'
    | 'image'
    | 'video'
    | 'audio'
    | 'csv'
    | 'custom';

export interface ImportRequest {
    readonly connectorId: string;
    readonly format: ImportFormat;
    readonly source: string;
    readonly payload: unknown;
    readonly options?: Readonly<Record<string, unknown>>;
}

export interface ImportResult {
    readonly connectorId: string;
    readonly success: boolean;
    readonly importedEntityId?: string;
    readonly importedEntityType?: string;
    readonly importedAt: number;
    readonly errorMessage?: string;
    readonly warnings?: ReadonlyArray<string>;
}

export interface ImportConnectorContract {
    readonly connectorId: string;
    readonly supportedFormats: ReadonlyArray<ImportFormat>;
    readonly canImport: (request: ImportRequest) => boolean;
    readonly importData: (request: ImportRequest) => ImportResult;
}

export function createImportRequest(
    connectorId: string,
    format: ImportFormat,
    source: string,
    payload: unknown,
    options?: Readonly<Record<string, unknown>>
): ImportRequest {
    return {
        connectorId,
        format,
        source,
        payload,
        options: options ? { ...options } : undefined,
    };
}

export function createImportResult(
    connectorId: string,
    success: boolean,
    importedEntityId?: string,
    importedEntityType?: string,
    errorMessage?: string,
    warnings?: ReadonlyArray<string>
): ImportResult {
    return {
        connectorId,
        success,
        importedEntityId,
        importedEntityType,
        importedAt: Date.now(),
        errorMessage,
        warnings: warnings ? [...warnings] : undefined,
    };
}