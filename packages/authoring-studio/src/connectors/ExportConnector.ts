/**
 * ExportConnector.ts — Sprint S8 Import/Export Connectors (ETAP 2)
 *
 * Export connector contracts for sending Studio data to external services.
 *
 * NO DOM, NO React, NO Browser API, ZERO Runtime execution.
 */

import type { ImportFormat } from './ImportConnector';

export type ExportFormat = ImportFormat;

export interface ExportRequest {
    readonly connectorId: string;
    readonly format: ExportFormat;
    readonly target: string;
    readonly payload: unknown;
    readonly options?: Readonly<Record<string, unknown>>;
}

export interface ExportResult {
    readonly connectorId: string;
    readonly success: boolean;
    readonly exportedEntityId?: string;
    readonly exportedAt: number;
    readonly errorMessage?: string;
    readonly warnings?: ReadonlyArray<string>;
}

export interface ExportConnectorContract {
    readonly connectorId: string;
    readonly supportedFormats: ReadonlyArray<ExportFormat>;
    readonly canExport: (request: ExportRequest) => boolean;
    readonly exportData: (request: ExportRequest) => ExportResult;
}

export function createExportRequest(
    connectorId: string,
    format: ExportFormat,
    target: string,
    payload: unknown,
    options?: Readonly<Record<string, unknown>>
): ExportRequest {
    return {
        connectorId,
        format,
        target,
        payload,
        options: options ? { ...options } : undefined,
    };
}

export function createExportResult(
    connectorId: string,
    success: boolean,
    exportedEntityId?: string,
    errorMessage?: string,
    warnings?: ReadonlyArray<string>
): ExportResult {
    return {
        connectorId,
        success,
        exportedEntityId,
        exportedAt: Date.now(),
        errorMessage,
        warnings: warnings ? [...warnings] : undefined,
    };
}